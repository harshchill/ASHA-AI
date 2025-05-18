import axios from 'axios';
import * as cheerio from 'cheerio';

interface RetrievalDoc {
  content: string;
  source: string;
  score: number;
  title?: string;
  url?: string;
}

async function fetchFromAPI(url: string): Promise<RetrievalDoc[]> {
  try {
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Asha-AI/1.0'
      }
    });
    
    // Handle different API response formats
    const data = response.data;
    if (Array.isArray(data)) {
      return data.map(item => ({
        content: JSON.stringify(item),
        source: url,
        score: 1.0,
        title: item.title || item.name,
        url: item.url || item.link
      }));
    }
    
    return [{
      content: JSON.stringify(data),
      source: url,
      score: 1.0,
      title: data.title || data.name,
      url: data.url || data.link
    }];
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error);
    return [];
  }
}

async function fetchFromWebpage(url: string): Promise<RetrievalDoc[]> {
  try {
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Asha-AI/1.0'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // Extract main content based on common content containers
    const content = $('article, .content, .main, #main, .post-content')
      .text()
      .replace(/\s+/g, ' ')
      .trim();
      
    // Extract title
    const title = $('title').text() || $('h1').first().text();
    
    // Extract meta description
    const description = $('meta[name="description"]').attr('content');
    
    return [{
      content: description || content,
      source: url,
      score: 1.0,
      title,
      url
    }];
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error);
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

export async function retrieveRelevantDocs(query: string): Promise<RetrievalDoc[]> {
  const sources = [
    {
      url: `https://api.jobsforher.com/v1/resources?query=${encodeURIComponent(query)}`,
      type: 'api'
    },
    {
      url: `https://womenreturners.com/api/articles?search=${encodeURIComponent(query)}`,
      type: 'api'
    },
    {
      url: 'https://www.anitab.org/resources/research/',
      type: 'web'
    },
    {
      url: 'https://www.catalyst.org/research/women-in-tech/',
      type: 'web'
    },
    {
      url: 'https://labour.gov.in/data',
      type: 'web'
    },
    {
      url: 'https://insights.stackoverflow.com/survey',
      type: 'web'
    }
  ];

  const fetchPromises = sources.map(source => 
    source.type === 'api' ? fetchFromAPI(source.url) : fetchFromWebpage(source.url)
  );

  const results = await Promise.all(fetchPromises);
  const allDocs = results.flat();
  
  // Calculate relevance scores
  const scoredDocs = allDocs.map(doc => ({
    ...doc,
    score: calculateRelevanceScore(doc, query)
  }));
  
  // Sort by relevance and take top 3
  const sortedDocs = scoredDocs
    .sort((a, b) => b.score - a.score)
    .filter(doc => doc.score > 0.1); // Filter out very low relevance docs
    
  return sortedDocs.slice(0, 3);
}
