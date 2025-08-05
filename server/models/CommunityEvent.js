const mongoose = require('mongoose');
const { Schema } = mongoose;

const communityEventSchema = new Schema({
    uniqueId: { type: String, required: true, unique: true, index: true },
    openstatesId: { type: String, sparse: true, unique: true }, // CORRECTED: This is now optional
    name: { type: String, required: true },
    description: { type: String },
    jurisdiction: { type: String },
    classification: { type: String },
    startDate: { type: Date, required: true, index: true },
    locationName: { type: String },
    sourceApi: { type: String, required: true, index: true },
    sourceUrl: { type: String },
    agenda: [Schema.Types.Mixed],
    lastIngestedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CommunityEvent', communityEventSchema);