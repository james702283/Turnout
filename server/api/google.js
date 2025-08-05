const express = require('express');
const axios = require('axios');
const { protect } = require('./middleware');
const User = require('../models/user');

const router = express.Router();

// This route provides the user's geocoded location for the representatives page
router.get('/geocode', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.address) {
            return res.status(400).json({ message: 'User address not found.' });
        }
        const addressString = `${user.address.street}, ${user.address.city}, ${user.address.state} ${user.address.zip}`;
    
        const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
                address: addressString,
                key: process.env.GOOGLE_CIVIC_API_KEY
            }
        });

        if (response.data.results.length === 0) {
            return res.status(404).json({ message: 'Could not geocode address.' });
        }
        const { lat, lng } = response.data.results[0].geometry.location;
        res.json({ lat, lng });

    } catch (error) {
        console.error('Geocoding API error:', error.response?.data || error.message);
        res.status(500).json({ message: 'Failed to geocode address.' });
    }
});

module.exports = router;