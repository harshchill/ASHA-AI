import axios from 'axios';
import * as cheerio from 'cheerio';

interface RetrievalDoc {
  content: string;
  source: string;
  url?: string;
  score: number;
  title?: string;
  priority?: number;
  sourceName?: string;
}

interface JobSource {
  url: string;
  type: 'api' | 'web';
  name: string;
  priority: number;
}

const jobSources: JobSource[] = [
  // Primary sources (HerKey ecosystem)
  {
    url: 'https://jobsforher.com/jobs',
    type: 'web',
    name: 'JobsForHer',
    priority: 1
  },
  {
    url: 'https://womenreturners.com/jobs',
    type: 'web',
    name: 'WomenReturners',
    priority: 1
  },
  // Secondary sources (Major job portals)
  {
    url: 'https://www.linkedin.com/jobs/search',
    type: 'web',
    name: 'LinkedIn',
    priority: 2
  },
  {
    url: 'https://www.naukri.com',
    type: 'web',
    name: 'Naukri',
    priority: 2
  },
  {
    url: 'https://www.indeed.com/jobs',
    type: 'web',
    name: 'Indeed',
    priority: 2
  },
  {
    url: 'https://www.glassdoor.co.in/Job/index.htm',
    type: 'web',
    name: 'Glassdoor',
    priority: 2
  },
  // Research and data sources
  {
    url: 'https://www.anitab.org/resources/research/',
    type: 'web',
    name: 'AnitaB.org',
    priority: 3
  },
  {
    url: 'https://www.catalyst.org/research/women-in-tech/',
    type: 'web',
    name: 'Catalyst',
    priority: 3
  }
];

interface ScrapedJob {
  title: string;
  company?: string;
  location?: string;
  description: string;
  url: string;
  postedDate?: string;
}

async function fetchFromWebpage(url: string, query: string): Promise<RetrievalDoc[]> {
  try {
    let fullUrl = url;
    if (!url.includes(query)) {
      // Add search parameters based on the job site
      if (url.includes('linkedin.com')) {
        fullUrl = `${url}?keywords=${encodeURIComponent(query)}`;
      } else if (url.includes('indeed.com')) {
        fullUrl = `${url}?q=${encodeURIComponent(query)}`;
      } else if (url.includes('naukri.com')) {
        fullUrl = `${url}/search/${encodeURIComponent(query)}-jobs`;
      } else if (url.includes('glassdoor')) {
        fullUrl = `${url}?q=${encodeURIComponent(query)}`;
      }
    }

    const response = await axios.get(fullUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.google.com/'
      }
    });
    
    const $ = cheerio.load(response.data);
    const jobs: ScrapedJob[] = [];
    
    // Generic job listing selectors
    const jobCards = $('div[class*="job-"], div[class*="card"], .job-listing, article');
    
    jobCards.each((_, element) => {
      const el = $(element);
      const title = el.find('h2, h3, [class*="title"]').first().text().trim();
      const company = el.find('[class*="company"], [class*="employer"]').first().text().trim();
      const location = el.find('[class*="location"]').first().text().trim();
      const description = el.find('[class*="description"], [class*="snippet"]').first().text().trim();
      const jobUrl = el.find('a').first().attr('href');
      const postedDate = el.find('[class*="date"], time').first().text().trim();
      
      if (title && (description || company)) {
        jobs.push({
          title,
          company,
          location,
          description: description || `${title} - ${company} - ${location}`,
          url: jobUrl ? new URL(jobUrl, fullUrl).href : fullUrl,
          postedDate
        });
      }
    });
    
    // If no jobs found, try extracting general content
    if (jobs.length === 0) {
      const content = $('article, .content, .main, #main, .post-content')
        .text()
        .replace(/\s+/g, ' ')
        .trim();
        
      if (content) {
        jobs.push({
          title: $('title').text() || $('h1').first().text(),
          description: content,
          url: fullUrl
        });
      }
    }

    // Convert scraped jobs to RetrievalDoc format
    return jobs.map(job => ({
      content: `${job.title}\n${job.company ? 'Company: ' + job.company + '\n' : ''}${
        job.location ? 'Location: ' + job.location + '\n' : ''}${
        job.postedDate ? 'Posted: ' + job.postedDate + '\n' : ''
      }${job.description}`,
      source: url,
      score: 1.0,
      title: job.title,
      url: job.url
    }));
  } catch (error) {
    console.error(`Error scraping from ${url}:`, error);
    return [];
  }
}

function calculateRelevanceScore(doc: RetrievalDoc, query: string): number {
  const queryTerms = query.toLowerCase().split(/\s+/);
  const content = doc.content.toLowerCase();
  
  // Count term matches
  const termMatches = queryTerms.filter(term => content.includes(term)).length;
  
  // Calculate base score
  let score = (termMatches / queryTerms.length) * 0.7;
  
  // Boost score for exact phrase matches
  if (content.includes(query.toLowerCase())) {
    score += 0.3;
  }
  
  return score;
}

const prioritizeHerKeyResults = (docs: RetrievalDoc[]): RetrievalDoc[] => {
  const herKeyDocs = docs.filter(doc => 
    doc.url?.toLowerCase().includes('herkeyfoundation.org') ||
    doc.url?.toLowerCase().includes('jfhfoundation')
  );
  
  const otherDocs = docs.filter(doc => 
    !doc.url?.toLowerCase().includes('herkeyfoundation.org') &&
    !doc.url?.toLowerCase().includes('jfhfoundation')
  );

  return [...herKeyDocs, ...otherDocs];
};

async function fetchWithRateLimit(source: JobSource, query: string): Promise<RetrievalDoc[]> {
  try {
    return await fetchFromWebpage(source.url, query);
  } catch (error) {
    console.error(`Error fetching from ${source.name}:`, error);
    return [];
  }
}

export async function retrieveRelevantDocs(query: string): Promise<RetrievalDoc[]> {
  // Fetch from all sources with rate limiting
  const fetchPromises = jobSources.map(source => 
    new Promise<RetrievalDoc[]>(resolve => {
      setTimeout(async () => {
        const docs = await fetchWithRateLimit(source, query);
        resolve(docs.map(doc => ({
          ...doc,
          priority: source.priority,
          sourceName: source.name
        })));
      }, source.priority * 200); // Stagger requests based on priority
    })
  );

  const results = await Promise.all(fetchPromises);
  const allDocs = results.flat();
    // Calculate relevance scores
  const scoredDocs = allDocs.map(doc => ({
    ...doc,
    score: calculateRelevanceScore(doc, query) * (1 / (doc.priority || 3)) // Adjust score based on source priority, default to lowest priority
  }));
  
  // Sort by score and filter low relevance
  const sortedDocs = scoredDocs
    .sort((a, b) => b.score - a.score)
    .filter(doc => doc.score > 0.1);
    
  // Take top results but ensure representation from primary sources
  const maxResults = 10;
  const primaryDocs = sortedDocs.filter(doc => doc.priority === 1);
  const otherDocs = sortedDocs.filter(doc => (doc.priority || 3) > 1);
  
  // Ensure at least 30% of results are from primary sources if available
  const minPrimaryDocs = Math.min(Math.ceil(maxResults * 0.3), primaryDocs.length);
  const remainingSlots = maxResults - minPrimaryDocs;
  
  return [
    ...primaryDocs.slice(0, minPrimaryDocs),
    ...otherDocs.slice(0, remainingSlots)
  ];
}
