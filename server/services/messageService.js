// Message service for sending rich responses
// Extend this to integrate with your messaging abstraction
export async function sendText(chatId, text) {
  // Send plain text message
  return { chatId, type: 'text', text };
}

export async function sendButtons(chatId, text, buttonsArray) {
  // Send message with buttons (rich JSON + fallback)
  return {
    chatId,
    type: 'buttons',
    text,
    buttons: buttonsArray,
    fallback: `${text}\n${buttonsArray.map(b => b.label).join(' | ')}`
  };
}

export async function sendCarousel(chatId, itemsArray) {
  // Send carousel/cards (rich JSON + fallback)
  return {
    chatId,
    type: 'carousel',
    items: itemsArray,
    fallback: itemsArray.map(item => item.title).join(' | ')
  };
} 