const mongoose = require('mongoose');
const { Schema } = mongoose;
const proposalSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true, default: 'general' },
    creatorId: { type: String, required: true },
    supporters: { type: [String], default: [] },
    supporterCount: { type: Number, default: 0, index: true },
    createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Proposal', proposalSchema);