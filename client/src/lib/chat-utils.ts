import { theme } from './theme';

interface FormattedSection {
  emoji?: string;
  title?: string;
  items: string[];
  isHerKey?: boolean;
  source?: {
    url: string;
    text: string;
  };
}

function detectHerKeyContent(text: string): boolean {
  const herKeyTerms = [
    'herkey foundation',
    'jobsforher foundation',
    'herkeyfoundation.org',
    'jfhfoundation'
  ];
  return herKeyTerms.some(term => text.toLowerCase().includes(term));
}

function formatSourceLink(url: string, text: string): string {
  return `<a href="${url}" class="chat-link hover:underline hover:bg-primary-50 text-primary-600" target="_blank" rel="noopener">${text}</a>`;
}

const SECTION_EMOJIS = {
  herkey: '★',
  insight: '💡',
  data: '📊',
  tip: '💫',
  resource: '📎',
  warning: '⚠️'
};

export function formatMessageContent(content: string): {
  formattedHtml: string;
  keyPoints: string[];
} {
  const lines = content.split('\n').filter(line => line.trim());
  const sections: FormattedSection[] = [];
  let currentSection: FormattedSection = { items: [] };
  const keyPoints: string[] = [];

  for (const line of lines) {
    // Check for HerKey content first
    if (detectHerKeyContent(line)) {
      sections.unshift({
        emoji: SECTION_EMOJIS.herkey,
        items: [line.trim()],
        isHerKey: true
      });
      keyPoints.push(line.trim());
      continue;
    }

    // Handle source links
    const linkMatch = line.match(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/);
    if (linkMatch) {
      currentSection.source = {
        url: linkMatch[1],
        text: linkMatch[2]
      };
      continue;
    }

    // Check for section headers (lines ending with ":")
    if (line.trim().endsWith(':')) {
      if (currentSection.items.length > 0) {
        sections.push(currentSection);
      }
      currentSection = {
        emoji: SECTION_EMOJIS.insight,
        title: line.trim().slice(0, -1),
        items: []
      };
      continue;
    }

    // Add line to current section
    currentSection.items.push(line.trim());
    if (line.length > 10) {
      keyPoints.push(line.trim());
    }
  }

  // Add final section if not empty
  if (currentSection.items.length > 0) {
    sections.push(currentSection);
  }

  // Format all sections as HTML
  const formattedSections = sections.map(section => {
    const sectionClass = section.isHerKey ? 'herkey-section' : 'chat-section';
    const titleHtml = section.title 
      ? `<div class="section-title font-medium mb-2">
           ${section.emoji || ''} ${section.title}
         </div>`
      : '';
    
    const itemsHtml = section.items.map(item => 
      `<li class="mb-2 leading-relaxed">
        ${section.isHerKey ? formatSourceLink('https://jobsforherfoundation.org', item) : item}
       </li>`
    ).join('');

    const sourceHtml = section.source 
      ? `<li class="mt-1 text-sm">
           ${SECTION_EMOJIS.resource} Source: ${formatSourceLink(section.source.url, section.source.text)}
         </li>`
      : '';

    return `
      <div class="${sectionClass} mb-4">
        ${titleHtml}
        <ul class="space-y-1 list-none">
          ${itemsHtml}
          ${sourceHtml}
        </ul>
      </div>
    `;
  }).join('');

  return {
    formattedHtml: `<div class="chat-content">${formattedSections}</div>`,
    keyPoints: keyPoints.slice(0, 5)
  };
}{
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
