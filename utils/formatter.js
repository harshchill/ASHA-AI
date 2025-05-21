// utils/formatter.js
// Utility to convert markdown lists to HTML <ul><li> blocks with paragraph breaks.

/**
 * Converts markdown lists to HTML <ul><li> blocks.
 * @param {string} raw - The raw markdown string.
 * @returns {string} - HTML string.
 */
export function formatMarkdownList(raw) {
  // Replace markdown list items with <li>
  const listItems = raw.replace(/(^|\n)[*-] (.+)/g, '$1<li>$2</li>');
  // Wrap <li> blocks in <ul> if any <li> present
  const html = /<li>/.test(listItems)
    ? `<ul>${listItems.replace(/(?:\n)?(<li>.+?<\/li>)/g, '$1')}</ul>`
    : listItems;
  // Add paragraph breaks for double newlines
  return html.replace(/\n{2,}/g, '<br/><br/>');
} 