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

interface CareerContent {
  type: 'job' | 'course' | 'article';
  title: string;
  company?: string;
  location?: string;
  description: string;
  url: string;
  postedDate?: string;
  salary?: string;
  actions: {
    type: 'apply' | 'enroll' | 'read' | 'save';
    label: string;
    url: string;
  }[];
  source: string;
  skills?: string[];
  requirements?: string[];
}

const jobSources: JobSource[] = [
  // Career Portals
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
  // Learning Platforms
  {
    url: 'https://www.coursera.org/courses',
    type: 'web',
    name: 'Coursera',
    priority: 2
  },
  {
    url: 'https://www.udacity.com/courses/all',
    type: 'web',
    name: 'Udacity',
    priority: 2
  },
  // Career Resources
  {
    url: 'https://www.anitab.org/resources/',
    type: 'web',
    name: 'AnitaB.org',
    priority: 2
  }
];

async function fetchFromWebpage(url: string, query: string): Promise<RetrievalDoc[]> {
  try {
    let fullUrl = url;
    if (!url.includes(query)) {
      const searchParam = encodeURIComponent(query);
      if (url.includes('linkedin.com')) {
        fullUrl = `${url}?keywords=${searchParam}`;
      } else if (url.includes('indeed.com')) {
        fullUrl = `${url}?q=${searchParam}`;
      } else if (url.includes('naukri.com')) {
        fullUrl = `${url}/search/${searchParam}-jobs`;
      } else if (url.includes('coursera.org')) {
        fullUrl = `${url}?query=${searchParam}`;
      }
    }

    const response = await axios.get(fullUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.google.com/'
      }
    });
    
    const $ = cheerio.load(response.data);
    const careerContent: CareerContent[] = [];
    
    // Job Listings
    $('div[class*="job-"], div[class*="card"], .job-listing, article').each((_, element) => {
      const el = $(element);
      const title = el.find('h2, h3, [class*="title"]').first().text().trim();
      const company = el.find('[class*="company"], [class*="employer"]').first().text().trim();
      const location = el.find('[class*="location"]').first().text().trim();
      const description = el.find('[class*="description"], [class*="snippet"]').first().text().trim();
      const salary = el.find('[class*="salary"], [class*="compensation"]').first().text().trim();
      const jobUrl = el.find('a').first().attr('href');
      const postedDate = el.find('[class*="date"], time').first().text().trim();
      
      if (title && (description || company)) {
        const content: CareerContent = {
          type: 'job',
          title,
          company,
          location,
          description: description || `${title} - ${company} - ${location}`,
          url: jobUrl ? new URL(jobUrl, fullUrl).href : fullUrl,
          postedDate,
          salary,
          source: url.includes('linkedin.com') ? 'LinkedIn' : 
                 url.includes('naukri.com') ? 'Naukri' :
                 url.includes('indeed.com') ? 'Indeed' :
                 url.includes('glassdoor') ? 'Glassdoor' : 'Other',
          actions: [
            {
              type: 'apply',
              label: 'Apply Now',
              url: jobUrl ? new URL(jobUrl, fullUrl).href : fullUrl
            },
            {
              type: 'save',
              label: 'Save Job',
              url: jobUrl ? new URL(jobUrl, fullUrl).href : fullUrl
            }
          ]
        };
        careerContent.push(content);
      }
    });
    
    // Courses
    if (url.includes('coursera.org') || url.includes('udacity.com')) {
      $('div[class*="course-"], div[class*="card"]').each((_, element) => {
        const el = $(element);
        const title = el.find('h2, h3, [class*="title"]').first().text().trim();
        const description = el.find('[class*="description"]').first().text().trim();
        const courseUrl = el.find('a').first().attr('href');
        
        if (title && description) {
          careerContent.push({
            type: 'course',
            title,
            description,
            url: courseUrl ? new URL(courseUrl, fullUrl).href : fullUrl,
            source: url.includes('coursera.org') ? 'Coursera' : 'Udacity',
            actions: [
              {
                type: 'enroll',
                label: 'Enroll Now',
                url: courseUrl ? new URL(courseUrl, fullUrl).href : fullUrl
              },
              {
                type: 'save',
                label: 'Save Course',
                url: courseUrl ? new URL(courseUrl, fullUrl).href : fullUrl
              }
            ]
          });
        }
      });
    }

    // Articles and Resources
    if (careerContent.length === 0) {
      const content = $('article, .content, .main, #main, .post-content')
        .text()
        .replace(/\s+/g, ' ')
        .trim();
        
      if (content) {
        careerContent.push({
          type: 'article',
          title: $('title').text() || $('h1').first().text(),
          description: content,
          url: fullUrl,
          source: url.includes('anitab.org') ? 'AnitaB.org' : 'Other',
          actions: [
            {
              type: 'read',
              label: 'Read More',
              url: fullUrl
            }
          ]
        });
      }
    }

    // Convert to RetrievalDoc format with action buttons
    return careerContent.map(content => ({
      content: `${content.title}\n${
        content.company ? 'Company: ' + content.company + '\n' : ''}${
        content.location ? 'Location: ' + content.location + '\n' : ''}${
        content.salary ? 'Salary: ' + content.salary + '\n' : ''}${
        content.postedDate ? 'Posted: ' + content.postedDate + '\n' : ''}${
        content.description}\n\nActions:\n${
        content.actions.map(action => `[${action.label}](${action.url})`).join('\n')}`,
      source: content.source,
      score: 1.0,
      title: content.title,
      url: content.url
    }));
  } catch (error) {
    console.error(`Error scraping from ${url}:`, error);
    return [];
  }
}

function calculateRelevanceScore(doc: RetrievalDoc, query: string): number {
  const queryTerms = query.toLowerCase().split(/\s+/);
  const content = doc.content.toLowerCase();
  const title = (doc.title || '').toLowerCase();
  
  // Calculate term matches in title and content
  const titleMatches = queryTerms.filter(term => title.includes(term)).length;
  const contentMatches = queryTerms.filter(term => content.includes(term)).length;
  
  // Calculate base score
  let score = (titleMatches / queryTerms.length) * 0.4 + // Title matches weighted more
              (contentMatches / queryTerms.length) * 0.3;
  
  // Boost score for exact phrase matches
  if (title.includes(query.toLowerCase())) {
    score += 0.2;
  }
  if (content.includes(query.toLowerCase())) {
    score += 0.1;
  }
  
  // Boost score based on content freshness (if postedDate exists)
  if (content.includes('posted:')) {
    const postedMatch = content.match(/posted:\s*([^\n]+)/i);
    if (postedMatch) {
      const postedDate = new Date(postedMatch[1]);
      if (!isNaN(postedDate.getTime())) {
        const daysSincePosted = (new Date().getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSincePosted < 7) {
          score += 0.2; // Boost very recent content
        } else if (daysSincePosted < 30) {
          score += 0.1; // Small boost for recent content
        }
      }
    }
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
