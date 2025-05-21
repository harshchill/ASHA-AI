// services/analytics.js
// Analytics service to track events in MongoDB.

import mongoose from 'mongoose';

// Event schema: { event, userId, details, timestamp }
const eventSchema = new mongoose.Schema({
  event: { type: String, required: true },
  userId: { type: String },
  details: { type: Object },
  timestamp: { type: Date, default: Date.now },
});

const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);

/**
 * Tracks an analytics event.
 * @param {string} eventName - Name of the event.
 * @param {object} metadata - Additional event details.
 */
export async function track(eventName, metadata = {}) {
  const { userId, ...details } = metadata;
  await Event.create({ event: eventName, userId, details, timestamp: new Date() });
} 