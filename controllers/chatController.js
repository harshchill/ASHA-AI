// controllers/chatController.js
// Handles chat POST endpoint and message processing pipeline.

import express from 'express';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import { analyze } from '../services/nlpService.js';
import * as messageService from '../services/messageService.js';
import * as analytics from '../services/analytics.js';

const router = express.Router();

// Error-handling middleware for retrying external API calls
async function withRetry(fn, args, userId) {
  let attempt = 0;
  let lastError;
  while (attempt < 3) {
    try {
      return await fn(...args);
    } catch (err) {
      lastError = err;
      attempt++;
      await analytics.track('api_error', { userId, error: err.message, attempt });
      if (attempt < 3) {
        await new Promise(res => setTimeout(res, 2 ** attempt * 100)); // Exponential backoff
      }
    }
  }
  throw lastError;
}

// POST /chat
router.post('/', async (req, res) => {
  try {
    // a) Extract userId & message
    const { userId, message } = req.body;
    if (!userId || !message) {
      return res.status(400).json({ error: 'userId and message required' });
    }
    await analytics.track('session_start', { userId });

    // b) NLP analysis
    const nlpResult = await withRetry(analyze, [message], userId);
    await analytics.track('intent_detected', { userId, intent: nlpResult.intent });

    // c) Save incoming message
    await Conversation.create({
      userId,
      role: 'user',
      content: message,
      timestamp: new Date(),
      intent: nlpResult.intent,
      entities: nlpResult.entities,
      sentiment: nlpResult.sentiment,
    });

    // d) Route based on intent (stub: only searchJobs)
    let response;
    if (nlpResult.intent === 'searchJobs') {
      response = messageService.sendText(userId, 'Here are some jobs for you!');
    } else {
      response = messageService.sendText(userId, "I'm not sure how to help with that yet.");
    }

    // e) Use messageService for rich responses (already done above)

    // f) Save outgoing message
    await Conversation.create({
      userId,
      role: 'bot',
      content: response.text,
      timestamp: new Date(),
      intent: nlpResult.intent,
      entities: [],
      sentiment: 0,
    });

    // g) Track event
    await analytics.track('session_end', { userId });

    res.json(response);
  } catch (err) {
    await analytics.track('api_error', { error: err.message });
    res.status(500).json({ error: "Sorry, I'm having trouble—let me try again." });
  }
});

export default router; 