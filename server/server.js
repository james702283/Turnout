require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

// Route imports
const authRoutes = require('./api/auth');
const meRoutes = require('./api/me');
const googleRoutes = require('./api/google');
const openstatesRoutes = require('./api/openstates');
const proposalRoutes = require('./api/proposals');
const representativeRoutes = require('./api/representatives');

// Service imports for cron jobs
const ingestionService = require('./services/ingestion.service.js');
const { fetchAndSynthesizeReps } = require('./services/representativeService.js');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/me', meRoutes);
app.use('/api/google', googleRoutes);
app.use('/api/openstates', openstatesRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/reps', representativeRoutes);

// --- RESTORED: Cron Job for Event Ingestion ---
cron.schedule('15 */6 * * *', async () => { // Offset by 15 mins
    console.log('[Cron Job] Starting scheduled EVENT ingestion...');
    try {
        const configPath = path.join(__dirname, 'config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (config.locations.length > 0) {
            const uniqueLocations = [...new Map(config.locations.map(loc => [`${loc.city}-${loc.state}`, loc])).values()];
            console.log(`[Cron Job] Ingesting events for ${uniqueLocations.length} unique locations.`);
            for (const location of uniqueLocations) {
                await ingestionService.ingestAllSources({ address: location });
            }
            console.log('[Cron Job] Scheduled event ingestion completed successfully.');
        } else {
            console.warn('[Cron Job] No locations in config.json for event ingestion. Skipping run.');
        }
    } catch (error) {
        console.error('--- [Cron Job] Scheduled event ingestion failed ---', error);
    }
});

// --- RESTORED: Cron Job for Representative Cache Warming ---
cron.schedule('45 */6 * * *', async () => { // Offset by 45 mins
    console.log('[Cron Job] Starting scheduled REPRESENTATIVE cache refresh...');
    try {
        const configPath = path.join(__dirname, 'config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (config.locations.length > 0) {
            const uniqueLocations = [...new Map(config.locations.map(loc => [`${loc.city}-${loc.state}`, loc])).values()];
            console.log(`[Cron Job] Refreshing representative cache for ${uniqueLocations.length} unique locations.`);
            for (const location of uniqueLocations) {
                await fetchAndSynthesizeReps(location);
            }
            console.log('[Cron Job] Scheduled representative cache refresh completed successfully.');
        } else {
            console.warn('[Cron Job] No locations in config.json for rep cache refresh. Skipping run.');
        }
    } catch (error) {
        console.error('--- [Cron Job] Scheduled representative cache refresh failed ---', error);
    }
});

// Database connection and server start
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    app.listen(PORT, () => console.log(`Turnout server is running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });