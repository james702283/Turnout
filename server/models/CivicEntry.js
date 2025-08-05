const mongoose = require('mongoose');
const { Schema } = mongoose;

const civicEntrySchema = new Schema({
    uniqueId: { type: String, required: true, unique: true, index: true },
    dataType: { type: String, required: true, index: true, enum: ['event', 'bill', 'person'] },
    sourceApi: { type: String, required: true, index: true },
    sourceUrl: { type: String },
    jurisdictionId: { type: String, required: true, index: true },
    data: {
        name: { type: String, required: true },
        description: { type: String },
        classification: { type: String },
        startDate: { type: Date, index: true },
        locationName: { type: String },
    },
    rawData: { type: Schema.Types.Mixed },
    lastIngestedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CivicEntry', civicEntrySchema);