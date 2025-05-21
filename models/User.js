// models/User.js
// Defines the User schema for MongoDB persistence.

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  summary: { type: String },
});

const User = mongoose.model('User', userSchema);
export default User; 