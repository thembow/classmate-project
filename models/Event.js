// models/Event.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  start: { type: Date, required: true },
  end: { type: Date },
  type: { type: String, default: 'event' }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
