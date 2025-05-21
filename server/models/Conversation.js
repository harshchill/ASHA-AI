// Conversation model for MongoDB using Mongoose
import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  role: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  intent: { type: String },
  entities: { type: [String], default: [] },
  sentiment: { type: Number },
}, { timestamps: true });

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation; 