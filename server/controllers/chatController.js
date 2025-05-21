// Chat controller for POST /chat
import { analyze } from '../services/nlpService.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import { sendText, sendButtons, sendCarousel } from '../services/messageService.js';
import { track } from '../services/analytics.js';

export async function chatHandler(req, res) {
  try {
    const { userId, message } = req.body;
    if (!userId || !message) {
      return res.status(400).json({ message: 'userId and message are required' });
    }
    await track('session_start', { userId });
    // NLP analysis
    const nlp = await analyze(message);
    await track('intent_detected', { userId, ...nlp });
    // Save incoming message
    await Conversation.create({ userId, role: 'user', content: message, ...nlp });
    // Intent routing (stub)
    let response;
    if (nlp.intent === 'greeting') {
      response = await sendText(userId, 'Hello! How can I help you today?');
    } else if (nlp.intent === 'help_request') {
      response = await sendButtons(userId, 'What do you need help with?', [
        { label: 'Account', value: 'account' },
        { label: 'Billing', value: 'billing' }
      ]);
    } else {
      response = await sendText(userId, 'I am not sure how to help with that yet.');
    }
    // Save outgoing message
    await Conversation.create({ userId, role: 'assistant', content: response.text || '', ...nlp });
    await track('session_end', { userId });
    res.json({ response, nlp });
  } catch (err) {
    await track('api_error', { error: err.message, userId: req.body?.userId });
    res.status(500).json({ message: 'Internal server error' });
  }
} 