// services/messageService.js
// Provides methods for sending rich responses (text, buttons, carousel) with plain-text fallback.

/**
 * Card/Button JSON schema:
 * {
 *   type: 'button',
 *   text: 'Button label',
 *   value: 'payload',
 * }
 *
 * Carousel item schema:
 * {
 *   title: 'Card title',
 *   subtitle: 'Card subtitle',
 *   imageUrl: 'https://...',
 *   buttons: [ ...buttonSchema ]
 * }
 */

export function sendText(chatId, text) {
  // Returns a simple text message
  return {
    chatId,
    type: 'text',
    text,
    fallback: text,
  };
}

export function sendButtons(chatId, text, buttonsArray) {
  // Returns a message with buttons and plain-text fallback
  return {
    chatId,
    type: 'buttons',
    text,
    buttons: buttonsArray,
    fallback: `${text} Options: ${buttonsArray.map(b => b.text).join(', ')}`,
  };
}

export function sendCarousel(chatId, itemsArray) {
  // Returns a carousel message and plain-text fallback
  return {
    chatId,
    type: 'carousel',
    items: itemsArray,
    fallback: itemsArray.map(item => `${item.title}: ${item.subtitle}`).join(' | '),
  };
} 