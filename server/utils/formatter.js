// Formatter utility: convert markdown lists to HTML lists
export function formatMarkdownList(raw) {
  if (!raw) return '';
  // Convert markdown lists to HTML <ul><li>
  let html = raw
    .replace(/(^|\n)[ \t]*([-*]|\d+\.)[ \t]+(.+)/g, (match, p1, p2, p3) => `${p1}<li>${p3}</li>`)
    .replace(/(<li>.*<\/li>)/gs, '<ul>$&</ul>');
  // Add paragraph breaks for double newlines
  html = html.replace(/\n{2,}/g, '<br/><br/>');
  return html;
} 