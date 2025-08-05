const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const router = express.Router();

const GOOGLE_API_KEY = process.env.GOOGLE_CIVIC_API_KEY;

// Helper to geocode ZIP to city/state
const geocodeZip = async (zip) => {
    try {
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${zip}&key=${GOOGLE_API_KEY}`);
        if (!response.ok) return null;
        const data = await response.json();
        if (!data.results || data.results.length === 0) return null;
        const addressComponents = data.results[0].address_components;
        const city = addressComponents.find(c => c.types.includes('locality'))?.long_name;
        const state = addressComponents.find(c => c.types.includes('administrative_area_level_1'))?.short_name;
        return (city && state) ? { city, state } : null;
    } catch (error) {
        console.error("Error in geocodeZip:", error);
        return null;
    }
};

// --- THIS IS THE FIX FOR THE LOGIN FAILURE ---
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // 1. Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // 2. Compare the provided password with the stored hash
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // 3. If credentials are correct, create and sign a JWT token
        const payload = { user: { id: user.id } };
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5h' },
            (err, token) => {
                if (err) throw err;
                // 4. Send the token and user info back to the client
                res.json({ token, user: { id: user.id, email: user.email, address: user.address } });
            }
        );
    } catch (error) {
        console.error('--- Server error during login ---', error);
        res.status(500).send('Server error');
    }
});

router.post('/register', async (req, res) => {
    const { email, password, address } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ email, password: hashedPassword, address });
        await user.save();

        // --- User-Enhancement Logic for the location cache ---
        try {
            const configPath = path.join(__dirname, '..', 'config.json');
            const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            const zipExists = config.locations.some(loc => loc.zip === address.zip);

            if (!zipExists && address.zip) {
                const locationInfo = await geocodeZip(address.zip);
                if (locationInfo) {
                    const newLocation = { ...locationInfo, zip: address.zip, type: 'user-provided' };
                    if (config.locations.length === 0) {
                        newLocation.type = 'auto-detected-base';
                    }
                    config.locations.push(newLocation);
                    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                    console.log(`[Config] New location added by user registration: ${newLocation.city}, ${newLocation.state}`);
                }
            }
        } catch (configError) {
            console.error("--- Failed to update config.json during registration ---", configError);
            // We do not block registration if the config update fails.
        }
        // --- End of User-Enhancement Logic ---

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.status(201).json({ token, user: { id: user.id, email: user.email, address: user.address } });
        });
    } catch (error) {
        console.error('--- Server error during registration ---', error);
        res.status(500).send('Server error');
    }
});

module.exports = router;