// Analytics service: track events in MongoDB
default import mongoose from '../config/db.js';

const eventSchema = new mongoose.Schema({
  eventName: { type: String, required: true },
  metadata: { type: Object, default: {} },
  timestamp: { type: Date, default: Date.now }
});

const Event = mongoose.model('Event', eventSchema);

export async function track(eventName, metadata = {}) {
  // Save event to MongoDB
  await Event.create({ eventName, metadata });
} 