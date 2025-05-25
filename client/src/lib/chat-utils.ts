import { theme } from './theme';

interface FormattedSection {
  emoji?: string;
  title?: string;
  items: string[];
  isPriority?: boolean;
  isListFormat?: boolean;
  source?: {
    url: string;
    text: string;
  };
}

function detectPriorityContent(text: string): boolean {
  return text.toLowerCase().includes('jobsforherfoundation.org') || text.includes('★');
}

function detectListContent(text: string): boolean {
  const listIndicators = [
    'list of',
    'steps to',
    'guide to',
    'how to',
    'tips for',
    'ways to',
    'strategies',
    'tips',
    'recommendations',
    'guidelines'
  ];
  return listIndicators.some(indicator => 
    text.toLowerCase().includes(indicator)
  );
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
    // Check for priority content first (HerKey)
    if (detectPriorityContent(line)) {
      sections.unshift({
        emoji: SECTION_EMOJIS.herkey,
        items: [line.trim()],
        isPriority: true,
        isListFormat: detectListContent(line)
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
    const sectionClass = section.isPriority ? 'herkey-section' : 'chat-section';
    const formatClass = section.isListFormat ? 'list-format' : 'paragraph-format';
    
    const titleHtml = section.title 
      ? `<div class="section-title font-medium mb-2">
           ${section.emoji || ''} ${section.title}
         </div>`
      : '';
    
    const itemsHtml = section.items.map(item => 
      `<li class="mb-2 leading-relaxed">
        ${section.isPriority ? formatSourceLink('https://jobsforherfoundation.org', item) : item}
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
}
