// server/models/proposal.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const proposalSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true, default: 'general' },
    creatorId: { type: String, required: true }, // In a real system, this would be a mongoose.Schema.Types.ObjectId
    supporters: { type: [String], default: [] },
    supporterCount: { type: Number, default: 0, index: true }, // Index for sorting
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Proposal', proposalSchema);

// server/models/townhall.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const townHallSchema = new Schema({
    title: { type: String, required: true },
    representative: { type: String, required: true },
    date: { type: Date, required: true, index: true }, // Index for sorting
    location: { type: String, required: true },
    source: { type: String, required: true, enum: ['community', 'official'] }, // Can only be one of these values
    submitterId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TownHall', townHallSchema);
