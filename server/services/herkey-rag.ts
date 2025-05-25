import { herkeyScraper } from './herkey-scraper';

interface HerKeyContext {
  type: 'job' | 'resource';
  title: string;
  content: string;
  url: string;
  relevance: number;
}

export async function getHerKeyContext(query: string): Promise<HerKeyContext[]> {
  // Ensure data is fresh
  await herkeyScraper.refreshData();
  
  // Search both jobs and resources
  const jobs = herkeyScraper.searchJobs(query);
  const resources = herkeyScraper.searchResources(query);
  
  // Combine and format results
  const context: HerKeyContext[] = [
    ...jobs.map(job => ({
      type: 'job' as const,
      title: job.title,
      content: `${job.company} - ${job.location}\n${job.description}`,
      url: job.url,
      relevance: calculateRelevance(query, `${job.title} ${job.company} ${job.description}`)
    })),
    ...resources.map(resource => ({
      type: 'resource' as const,
      title: resource.title,
      content: resource.content,
      url: resource.url,
      relevance: calculateRelevance(query, `${resource.title} ${resource.content}`)
    }))
  ];
  
  // Sort by relevance and return top results
  return context
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 5);
}

function calculateRelevance(query: string, text: string): number {
  const queryTerms = query.toLowerCase().split(' ');
  const textLower = text.toLowerCase();
  
  // Calculate term frequency
  const termFrequency = queryTerms.reduce((score, term) => {
    const count = (textLower.match(new RegExp(term, 'g')) || []).length;
    return score + count;
  }, 0);
  
  // Calculate term presence
  const termPresence = queryTerms.reduce((score, term) => {
    return score + (textLower.includes(term) ? 1 : 0);
  }, 0) / queryTerms.length;
  
  // Combine scores (70% term presence, 30% frequency)
  return (termPresence * 0.7) + (Math.min(termFrequency / (queryTerms.length * 2), 1) * 0.3);
}
