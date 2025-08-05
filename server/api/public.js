const express = require('express');
const fetch = require('node-fetch');
const googleSearch = require('../services/googleSearch.service.js');
const gemini = require('../services/gemini.service.js');
const CivicEntry = require('../models/CivicEntry');

const router = express.Router();

const GOOGLE_API_KEY = process.env.GOOGLE_CIVIC_API_KEY;

// This is a simplified, on-demand ingestion for a specific location.
const ingestForLocation = async (city, state) => {
    let allEntries = [];
    const eventUrls = await googleSearch.findEventPages(city, state);

    if (eventUrls && eventUrls.length > 0) {
        const geminiResults = await Promise.all(
            eventUrls.slice(0, 5).map(url => gemini.extractEventsFromUrl(url))
        );
        geminiResults.flat().forEach(event => {
            if (event && event.eventName && event.eventDate) {
                event.sourceApi = 'gemini';
                allEntries.push(event);
            }
        });
    }
    
    let operations = [];
    for (const item of allEntries) {
        const startDate = new Date(item.eventDate);
        if (isNaN(startDate.getTime())) continue;

        const entry = {
            uniqueId: `gem-${item.sourceUrl}-${item.eventName.replace(/\s+/g, '-')}`,
            dataType: 'event',
            sourceApi: 'gemini',
            sourceUrl: item.sourceUrl,
            jurisdictionId: `ocd-jurisdiction/country:us/state:${state.toLowerCase()}/government`,
            data: {
                name: item.eventName,
                description: item.summary || 'No summary available.',
                classification: 'Community',
                startDate: startDate,
                locationName: item.location || 'Location not specified.'
            },
            rawData: item
        };
        operations.push({ updateOne: { filter: { uniqueId: entry.uniqueId }, update: { $set: entry }, upsert: true } });
    }

    if (operations.length > 0) {
        await CivicEntry.bulkWrite(operations);
    }
    return allEntries;
};


// --- NEW: On-demand event fetching for the landing page ---
router.get('/events-for-location', async (req, res) => {
    const { city, state } = req.query;
    if (!city || !state) {
        return res.status(400).json({ message: 'City and state are required.' });
    }
    try {
        const events = await ingestForLocation(city, state);
        // Normalize the data for the front-end
        const formattedEvents = events.map((event, i) => ({
            _id: `new-${i}`, // Temporary ID for the front-end
            name: event.eventName,
            startDate: event.eventDate,
            locationName: event.location || 'N/A',
            classification: 'Community',
        }));
        res.json({ results: formattedEvents });
    } catch (error) {
        console.error('--- Error in on-demand ingestion ---', error);
        res.status(500).json({ message: 'Failed to fetch events for location.' });
    }
});

module.exports = router;