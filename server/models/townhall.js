const mongoose = require('mongoose');
const { Schema } = mongoose;

const townHallSchema = new Schema({
    title: { type: String, required: true },
    representative: { type: String, required: true },
    date: { type: Date, required: true, index: true },
    location: { type: String, required: true },
    source: { type: String, required: true, enum: ['community', 'official'] },
    submitterId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TownHall', townHallSchema);
