const express = require('express');
const fetch = require('node-fetch');
const { protect } = require('./middleware');
const User = require('../models/user');
const CivicEntry = require('../models/CivicEntry');
const ingestionService = require('../services/ingestion.service.js');

const router = express.Router();

const OPENSTATES_API_KEY = process.env.OPENSTATES_API_KEY;
const OPENSTATES_GQL_URL = 'https://openstates.org/graphql';

// --- A single, reusable function to format event data consistently ---
const formatEventForDisplay = (eventEntry) => {
    if (!eventEntry) return null;

    const { data, rawData, sourceUrl, uniqueId, _id } = eventEntry;
    const { name, description, startDate, locationName, classification } = data;

    // Generate interactive links
    const encodedLocation = locationName ? encodeURIComponent(locationName) : null;
    const googleMapsUrl = encodedLocation ? `https://www.google.com/maps/search/?api=1&query=${encodedLocation}` : null;

    let calendarLinks = null;
    if (startDate) {
        const startTime = new Date(startDate);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Default to 1 hour
        const formatDate = (date) => date.toISOString().replace(/-|:|\.\d{3}/g, '');
        
        const gCalUrl = new URLSearchParams({
            action: 'TEMPLATE',
            text: name || '',
            dates: `${formatDate(startTime)}/${formatDate(endTime)}`,
            details: description || '',
            location: locationName || ''
        }).toString();
        calendarLinks = { google: `https://www.google.com/calendar/render?${gCalUrl}` };
    }

    return {
        _id: _id.toString(),
        name: name || "Event Name Not Available",
        description: description || "No description provided.",
        startDate: startDate, // For the list card
        start_date: startDate ? startDate.toISOString() : null, // For the detail page
        locationName: locationName || "Location TBD", // For the list card
        location: { name: locationName || "Location TBD" }, // For the detail page
        classification: classification || "Event",
        agenda: rawData?.agenda || (description ? [{ description }] : []),
        googleMapsUrl: googleMapsUrl,
        calendarLinks: calendarLinks,
        sources: rawData?.sources || [{ url: sourceUrl || '#', note: 'Source' }],
        links: rawData?.links || [],
        id: uniqueId,
        status: rawData?.status || 'confirmed'
    };
};

// My Representatives route
router.post('/query', protect, async (req, res) => {
    try {
        const { query, variables } = req.body;
        const response = await fetch(OPENSTATES_GQL_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-KEY': OPENSTATES_API_KEY },
            body: JSON.stringify({ query, variables })
        });
        const data = await response.json();
        if (data.errors) return res.status(400).json({ message: data.errors[0].message });
        res.json(data);
    } catch (error) {
        console.error("Open States /query Error:", error);
        res.status(500).json({ message: 'Failed to fetch data from Open States GraphQL API.' });
    }
});

// Ingestion route
router.post('/ingest', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        const result = await ingestionService.ingestAllSources(user);
        res.status(200).json({ message: 'Ingestion complete.', ...result });
    } catch (error) {
        console.error('--- [INGEST] Ingestion process failed ---', error);
        res.status(500).json({ message: 'Event ingestion failed.', error: error.message });
    }
});

// Event list route
router.get('/events', protect, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateFilter = {};
        if (startDate) { dateFilter.$gte = new Date(startDate); } 
        else { const today = new Date(); today.setHours(0, 0, 0, 0); dateFilter.$gte = today; }
        if (endDate) { dateFilter.$lte = new Date(endDate); }

        const eventEntries = await CivicEntry.find({ dataType: 'event', 'data.startDate': dateFilter }).sort({ 'data.startDate': 1 });
        const formattedEvents = eventEntries.map(formatEventForDisplay);
        res.json({ results: formattedEvents });
    } catch (error) {
        console.error('--- Error fetching events from database ---', error);
        res.status(500).json({ message: 'Failed to retrieve events from database.' });
    }
});

// Event detail route
router.get('/events/:id', protect, async (req, res) => {
    try {
        const eventEntry = await CivicEntry.findById(req.params.id);
        if (!eventEntry) return res.status(404).json({ message: 'Event not found.' });
        const normalizedEvent = formatEventForDisplay(eventEntry);
        res.json(normalizedEvent);
    } catch (error) {
        console.error(`--- Error fetching event ${req.params.id} from database ---`, error);
        res.status(500).json({ message: 'Failed to retrieve event from database.' });
    }
});

module.exports = router;