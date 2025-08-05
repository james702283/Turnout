// server/api/representatives.js

const express = require('express');
const { protect } = require('./middleware');
const User = require('../models/user');
const Representative = require('../models/Representative');
const { fetchAndSynthesizeReps } = require('../services/representativeService');

const router = express.Router();

router.get('/for-user', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('address');
        if (!user || !user.address || !user.address.zip) {
            return res.status(400).json({ message: 'User address with ZIP code is required.' });
        }

        const { zip, city, state } = user.address;

        // The multi-layer cache keys. This will now work correctly.
        const locationKeys = [
            `zip_${zip}`,
            `city_${city.toLowerCase()}`,
            `state_${state.toLowerCase()}`
        ];

        // Add federal key for all US addresses
        if (state) locationKeys.push('federal_us');

        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Find representatives who have AT LEAST ONE of the location keys
        // and are not stale.
        const cachedReps = await Representative.find({ 
            locationKeys: { $in: locationKeys },
            lastUpdatedAt: { $gte: twentyFourHoursAgo }
        }).lean(); // Use .lean() for faster read-only queries

        if (cachedReps.length > 0) {
            console.log(`[Rep API] Serving ${cachedReps.length} representatives from multi-layer cache.`);
            return res.json(cachedReps);
        }

        console.log(`[Rep API] Cache miss or stale for keys: ${locationKeys.join(', ')}. Fetching live data...`);
        const liveRepresentatives = await fetchAndSynthesizeReps(user.address);
        res.json(liveRepresentatives);

    } catch (error) {
        console.error('--- Error in /for-user representative route ---', error);
        res.status(500).json({ message: 'An internal error occurred while fetching representatives.' });
    }
});

module.exports = router;