import { theme } from './theme';

const BULLET_EMOJIS = ['🔹', '✅', '💡', '📝', '🎯', '🚀'];

export function formatMessageContent(content: string): { 
  formattedHtml: string; 
  keyPoints: string[]; 
} {
  const points: string[] = [];
  const lines = content.split('\n').filter(line => line.trim());
  
  // Convert content to list format
  const formattedLines = lines.map((line, index) => {
    // Strip existing markdown bullets
    let cleanLine = line.replace(/^[*-]\s+/, '').trim();
    cleanLine = cleanLine.replace(/^\d+\.\s+/, '').trim();
    
    // Remove markdown bold markers
    cleanLine = cleanLine.replace(/\*\*(.*?)\*\*/g, '$1');
    
    // If line is significant, add to key points
    if (cleanLine.length > 3) {
      points.push(cleanLine);
    }

    // Rotate through emojis for bullets
    const emoji = BULLET_EMOJIS[index % BULLET_EMOJIS.length];
    
    return `<li class="mb-2 flex items-start gap-2">
      <span class="text-lg leading-6 flex-shrink-0">${emoji}</span>
      <span class="flex-1">${cleanLine}</span>
    </li>`;
  }).join('');
  
  // Wrap in styled list container
  let html = `<ul class="space-y-1 list-none p-0 m-0">${formattedLines}</ul>`;
  
  // Format links with theme colors
  html = html.replace(
    /<a href="(.*?)".*?>(.*?)<\/a>/g,
    `<a href="$1" 
        class="text-[${theme.colors.primary.main}] hover:bg-[${theme.colors.primary.hover}] 
               rounded px-1 py-0.5 transition-colors" 
        target="_blank" 
        rel="noopener noreferrer">$2</a>`
  );

  // Format code blocks
  if (html.includes('```')) {
    html = html.replace(
      /```(\w+)?\n([\s\S]*?)```/g,
      '<pre class="bg-gray-50 p-3 rounded-md overflow-x-auto my-2"><code class="font-mono text-sm">$2</code></pre>'
    );
  }

  return {
    formattedHtml: html,
    keyPoints: points.slice(0, 5) // Keep top 5 key points
  };
}
