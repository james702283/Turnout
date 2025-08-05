const mongoose = require('mongoose');

const RepresentativeSchema = new mongoose.Schema({
    ocdId: { type: String, unique: true, required: true },
    name: { type: String, required: true, index: true },
    party: { type: String, default: 'Non-Partisan' },
    role: { type: String, default: 'Official' },
    image: { type: String },
    links: [{
        url: String,
        note: String
    }],
    // --- FIX: Using a flexible locationKey for hierarchical caching ---
    locationKey: { type: String, required: true, index: true },
    lastUpdatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Representative', RepresentativeSchema);