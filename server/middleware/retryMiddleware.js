// Middleware to retry external API calls with exponential backoff
import { track } from '../services/analytics.js';

export function retryMiddleware(handler) {
  return async (req, res, next) => {
    let attempts = 0;
    let lastError;
    while (attempts < 3) {
      try {
        return await handler(req, res, next);
      } catch (err) {
        lastError = err;
        attempts++;
        if (attempts < 3) {
          // Exponential backoff: 100ms, 400ms
          await new Promise(r => setTimeout(r, 100 * Math.pow(2, attempts - 1)));
        }
      }
    }
    // Log error to analytics
    await track('api_error', {
      error: lastError?.message || 'Unknown error',
      path: req.path,
      method: req.method,
      userId: req.body?.userId || req.query?.userId || 'unknown',
      timestamp: new Date()
    });
    // Return friendly fallback
    res.status(502).json({ message: 'Sorry, something went wrong. Please try again later.' });
  };
} 