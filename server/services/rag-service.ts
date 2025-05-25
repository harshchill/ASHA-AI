import axios from 'axios';
import * as cheerio from 'cheerio';

interface RetrievalDoc {
  content: string;
  source: string;
  url?: string;
  score: number;
  title?: string;
  sourceName?: string;
  metadata?: {
    type: 'job' | 'course' | 'article';
    company?: string;
    location?: string;
    postedDate?: string;
    salary?: string;
  };
}

interface JobSource {
  url: string;
  name: string;
  searchUrlPattern: string;
  selectors: {
    container: string;
    title: string;
    company: string;
    location: string;
    description: string;
    salary: string;
    date: string;
    link: string;
  };
}

const jobSources: JobSource[] = [
  {
    url: 'https://jobsforher.com/jobs',
    name: 'JobsForHer',
    searchUrlPattern: 'https://jobsforher.com/jobs/search?q={query}',
    selectors: {
      container: '.job-card, .job-listing',
      title: '.job-title, h2',
      company: '.company-name',
      location: '.location',
      description: '.job-description',
      salary: '.salary',
      date: '.posted-date',
      link: 'a.job-link'
    }
  },
  {
    url: 'https://www.linkedin.com/jobs',
    name: 'LinkedIn',
    searchUrlPattern: 'https://www.linkedin.com/jobs/search?keywords={query}',
    selectors: {
      container: '.job-card-container, .jobs-search-result-item',
      title: '.job-card-list__title, .job-card-container__link',
      company: '.job-card-container__company-name',
      location: '.job-card-container__metadata-item',
      description: '.job-card-list__description',
      salary: '.compensation',
      date: 'time',
      link: '.job-card-container__link'
    }
  },
  {
    url: 'https://www.naukri.com',
    name: 'Naukri',
    searchUrlPattern: 'https://www.naukri.com/jobs-{query}',
    selectors: {
      container: '.jobTuple, .job-tuple',
      title: '.title, .jobTitle',
      company: '.company-name, .companyName',
      location: '.location, .locWdth',
      description: '.job-description',
      salary: '.salary',
      date: '.posted-date',
      link: 'a.title'
    }
  },
  {
    url: 'https://www.indeed.com/jobs',
    name: 'Indeed',
    searchUrlPattern: 'https://www.indeed.com/jobs?q={query}',
    selectors: {
      container: '.job_seen_beacon, .jobsearch-ResultsList',
      title: '.jobTitle, .jcs-JobTitle',
      company: '.company, .companyName',
      location: '.location, .companyLocation',
      description: '.job-snippet',
      salary: '.salary-snippet',
      date: '.date',
      link: '.jcs-JobTitle a'
    }
  }
];

async function scrapeJobsite(source: JobSource, query: string): Promise<RetrievalDoc[]> {
  try {
    const searchUrl = source.searchUrlPattern.replace('{query}', encodeURIComponent(query));
    
    const response = await axios.get(searchUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });
    
    const $ = cheerio.load(response.data);
    const jobs: RetrievalDoc[] = [];
    
    $(source.selectors.container).each((_, element) => {
      const el = $(element);
      const title = el.find(source.selectors.title).first().text().trim();
      const company = el.find(source.selectors.company).first().text().trim();
      const location = el.find(source.selectors.location).first().text().trim();
      const description = el.find(source.selectors.description).first().text().trim();
      const salary = el.find(source.selectors.salary).first().text().trim();
      const jobUrl = el.find(source.selectors.link).first().attr('href');
      const postedDate = el.find(source.selectors.date).first().text().trim();
      
      if (title && (description || company)) {
        const fullJobUrl = jobUrl ? new URL(jobUrl, searchUrl).href : searchUrl;
        
        // Create action buttons with proper URLs
        const actions = [
          { label: 'Apply Now', url: fullJobUrl },
          { label: 'Save Job', url: `${fullJobUrl}#save` }
        ];
        
        jobs.push({
          content: `${title}\n${
            company ? 'Company: ' + company + '\n' : ''}${
            location ? 'Location: ' + location + '\n' : ''}${
            salary ? 'Salary: ' + salary + '\n' : ''}${
            postedDate ? 'Posted: ' + postedDate + '\n' : ''}${
            description}\n\nActions:\n${
            actions.map(action => `[${action.label}](${action.url})`).join('\n')}`,
          source: source.name,
          sourceName: source.name,
          title,
          url: fullJobUrl,
          score: 1.0,
          metadata: {
            type: 'job',
            company,
            location,
            salary,
            postedDate
          }
        });
      }
    });
    
    return jobs;
  } catch (error) {
    console.error(`Error scraping from ${source.name}:`, error);
    return [];
  }
}

function calculateRelevanceScore(doc: RetrievalDoc, query: string): number {
  const queryTerms = query.toLowerCase().split(/\s+/);
  const content = doc.content.toLowerCase();
  const title = (doc.title || '').toLowerCase();
  
  // Calculate term matches
  const titleMatches = queryTerms.filter(term => title.includes(term)).length;
  const contentMatches = queryTerms.filter(term => content.includes(term)).length;
  
  // Base score from content matching
  let score = (titleMatches / queryTerms.length) * 0.6 + // Title matches weighted more
              (contentMatches / queryTerms.length) * 0.4;
              
  // Boost score for exact matches
  if (title.includes(query.toLowerCase())) score += 0.2;
  if (content.includes(query.toLowerCase())) score += 0.1;
  
  // Boost score for recent jobs
  if (doc.metadata?.postedDate) {
    try {
      const postedDate = new Date(doc.metadata.postedDate);
      const daysSincePosted = (new Date().getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSincePosted < 7) score += 0.3;
      else if (daysSincePosted < 30) score += 0.1;
    } catch (e) {}
  }
  
  return Math.min(score, 1.0); // Cap score at 1.0
}

export async function retrieveRelevantDocs(query: string): Promise<RetrievalDoc[]> {
  // Fetch jobs from all sources with slight delays to prevent rate limiting
  const jobs = await Promise.all(
    jobSources.map((source, index) => 
      new Promise<RetrievalDoc[]>(resolve => {
        setTimeout(async () => {
          const results = await scrapeJobsite(source, query);
          resolve(results);
        }, index * 200); // 200ms delay between each source
      })
    )
  );
  
  // Combine all results
  const allJobs = jobs.flat();
  
  // Calculate scores
  const scoredJobs = allJobs.map(job => ({
    ...job,
    score: calculateRelevanceScore(job, query)
  }));
  
  // Sort by source (JobsForHer first) then by score
  const sortedJobs = scoredJobs.sort((a, b) => {
    if (a.sourceName === 'JobsForHer' && b.sourceName !== 'JobsForHer') return -1;
    if (a.sourceName !== 'JobsForHer' && b.sourceName === 'JobsForHer') return 1;
    return b.score - a.score;
  });
  
  // Return top results, ensuring some diversity in sources
  const maxResults = 10;
  const maxPerSource = 3;
  
  const results: RetrievalDoc[] = [];
  const sourceCount: { [key: string]: number } = {};
  
  for (const job of sortedJobs) {
    const source = job.sourceName || 'unknown';
    sourceCount[source] = (sourceCount[source] || 0) + 1;
    
    if (sourceCount[source] <= maxPerSource && results.length < maxResults) {
      results.push(job);
    }
  }
  
  return results;
}
