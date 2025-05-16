import { Groq } from "groq-sdk";

interface RAGData {
  statistics?: Array<{
    value: string;
    source: string;
  }>;
  resources?: Array<{
    text: string;
    url: string;
  }>;
}

interface RAGCache {
  [key: string]: {
    data: RAGData;
    timestamp: number;
  };
}

// In-memory cache with 1-hour expiry
const cache: RAGCache = {};
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

// Mock data for consistent responses
const MOCK_DATA: RAGData = {
  statistics: [
    {
      value: "73% of women reported career growth after mentorship",
      source: "JobsForHer Impact Report 2025"
    },
    {
      value: "Over 500,000 women professionals connected on our platform",
      source: "JobsForHer Platform Statistics 2025"
    },
    {
      value: "85% of mentored professionals reported higher job satisfaction",
      source: "Women in Tech Survey 2025"
    }
  ],
  resources: [
    {
      text: "JobsForHer Mentorship Program",
      url: "https://www.jobsforher.com/mentorship"
    },
    {
      text: "Career Development Resources",
      url: "https://www.jobsforher.com/resources"
    },
    {
      text: "Professional Skills Workshops",
      url: "https://www.jobsforher.com/workshops"
    }
  ]
};

export async function fetchRelevantData(query: string): Promise<RAGData> {
  try {
    // Check cache first
    const cacheKey = query.toLowerCase().trim();
    const cached = cache[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log("Using cached RAG data");
      return cached.data;
    }

    console.log("Using mock RAG data");
    
    // Filter mock data based on query keywords
    const keywords = query.toLowerCase().split(/\s+/);
    const filteredData: RAGData = {
      statistics: MOCK_DATA.statistics?.filter(s => 
        keywords.some(k => s.value.toLowerCase().includes(k))
      ) || MOCK_DATA.statistics?.slice(0, 2),
      resources: MOCK_DATA.resources?.filter(r => 
        keywords.some(k => r.text.toLowerCase().includes(k))
      ) || MOCK_DATA.resources?.slice(0, 2)
    };

    // Update cache
    cache[cacheKey] = {
      data: filteredData,
      timestamp: Date.now()
    };

    return filteredData;
  } catch (error) {
    console.error('Error in fetchRelevantData:', error);
    // Return subset of mock data on error
    return {
      statistics: MOCK_DATA.statistics?.slice(0, 2),
      resources: MOCK_DATA.resources?.slice(0, 2)
    };
  }
}
