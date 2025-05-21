// server.js
// Entry point for chatbot backend. Sets up Express, connects to MongoDB, and mounts chat controller.

import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import chatRouter from './controllers/chatController.js';

dotenv.config();
const app = express();
app.use(express.json());

// Connect to MongoDB
await connectDB();

// Mount chat controller
app.use('/chat', chatRouter);

// Dynamic port for Render compatibility
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 