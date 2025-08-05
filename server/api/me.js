const express = require('express');
const axios = require('axios');
const { protect } = require('./middleware');

const router = express.Router();

// Helper function to categorize and rank OCD IDs
const processAndRankDivisions = (divisions) => {
    const ranked = {
        local: [],
        county: [],
        state: [],
        federal: [],
        other: []
    };

    for (const ocdId in divisions) {
        const division = { ocdId, name: divisions[ocdId].name };
        if (ocdId.includes('/place:') || ocdId.includes('/council_district:')) {
            ranked.local.push(division);
        } else if (ocdId.includes('/county:')) {
            ranked.county.push(division);
        } else if (ocdId.includes('/state:')) {
            ranked.state.push(division);
        } else if (ocdId.includes('/country:us')) {
            // Avoid adding the generic "United States" entry if other federal districts exist
            if (ocdId.includes('/cd:')) {
                 ranked.federal.push(division);
            } else if (!ocdId.includes('/cd:')) {
                // Push "United States" to other for now, can be filtered on front-end if needed
                if(ranked.federal.length === 0 && ocdId === 'ocd-division/country:us') {
                    // Only add if no other federal divisions are present
                }
            }
        } else {
            ranked.other.push(division);
        }
    }
    // Return a single, ordered array based on impact
    return [...ranked.local, ...ranked.county, ...ranked.state, ...ranked.federal, ...ranked.other];
};


// --- GET /api/me/civic-info ---
// Protected route to get ranked and processed civic info for the logged-in user.
router.get('/civic-info', protect, async (req, res) => {
    const userAddress = req.user.address;
    
    if (!userAddress) {
        return res.status(400).json({ message: 'No address found for this user.' });
    }

    const addressString = `${userAddress.street} ${userAddress.city} ${userAddress.state} ${userAddress.zip}`;
    const apiKey = process.env.GOOGLE_CIVIC_API_KEY;

    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
        return res.status(500).json({ message: 'Server is missing Google Civic API key.' });
    }

    const encodedAddress = encodeURIComponent(addressString);
    const url = `https://www.googleapis.com/civicinfo/v2/divisionsByAddress?key=${apiKey}&address=${encodedAddress}`;
    
    try {
        const response = await axios.get(url);
        const { divisions, normalizedInput } = response.data;

        // Process and rank the raw division data
        const rankedDivisions = processAndRankDivisions(divisions);

        // Send the clean, processed data to the frontend
        res.json({
            normalizedInput,
            divisions: rankedDivisions
        });

    } catch (error) {
        console.error('--- Civic Info API Call Failed ---');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
        res.status(500).json({ message: 'Failed to fetch civic division information.' });
    }
});

module.exports = router;