// models/Conversation.js
// Defines the Conversation schema for MongoDB persistence.

import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  role: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  intent: { type: String },
  entities: { type: Array, default: [] },
  sentiment: { type: Number },
});

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation; 