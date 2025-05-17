import { Groq } from "groq-sdk";
import { fetchLiveData } from './utils/liveFetch';
import { RAGData } from './types';

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
      value: "92% of women felt more confident in their career decisions after personalized mentorship",
      source: "JobsForHer Impact Report 2025"
    },
    {
      value: "Women supporting women: 78% reported stronger emotional well-being with peer support",
      source: "JobsForHer Community Survey 2025"
    },
    {
      value: "3 in 4 women overcame career challenges through supportive networking",
      source: "Women in Tech Wellness Study 2025"
    },
    {
      value: "89% experienced reduced career anxiety with regular mentor guidance",
      source: "Professional Women's Mental Health Report 2025"
    },
    {
      value: "Work-life harmony achievement increased by 65% with proper support systems",
      source: "JobsForHer Balance Index 2025"
    }
  ],
  resources: [
    {
      text: "Emotional Intelligence in Leadership - Free Workshop",
      url: "https://www.jobsforher.com/workshops/ei-leadership"
    },
    {
      text: "Women's Support Circle - Weekly Virtual Meetups",
      url: "https://www.jobsforher.com/community/support-circle"
    },
    {
      text: "Career Transition Support Program",
      url: "https://www.jobsforher.com/transition-support"
    },
    {
      text: "Work-Life Balance Counseling Sessions",
      url: "https://www.jobsforher.com/counseling"
    },
    {
      text: "Mindful Career Planning Resources",
      url: "https://www.jobsforher.com/mindful-planning"
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

    console.log("Fetching live data...");
    
    // Try to get live data first
    let liveData: RAGData;
    try {
      liveData = await fetchLiveData(query);
      console.log("Successfully fetched live data");
    } catch (error) {
      console.warn("Live data fetch failed, falling back to mock data", error);
      liveData = { statistics: [], resources: [] };
    }

    // Filter mock data based on query keywords
    const keywords = query.toLowerCase().split(/\s+/);
    const filteredMockData: RAGData = {      statistics: MOCK_DATA.statistics?.filter((stat: { value: string; source: string }) => 
        keywords.some((keyword) => stat.value.toLowerCase().includes(keyword))
      ) || MOCK_DATA.statistics?.slice(0, 2),
      resources: MOCK_DATA.resources?.filter((resource: { text: string; url: string }) => 
        keywords.some((keyword) => resource.text.toLowerCase().includes(keyword))
      ) || MOCK_DATA.resources?.slice(0, 2)
    };

    // Combine live and mock data, prioritizing live data
    const combinedData: RAGData = {
      statistics: [...(liveData.statistics || []), ...(filteredMockData.statistics || [])].slice(0, 5),
      resources: [...(liveData.resources || []), ...(filteredMockData.resources || [])].slice(0, 5)
    };

    // Update cache
    cache[cacheKey] = {
      data: combinedData,
      timestamp: Date.now()
    };

    return combinedData;
  } catch (error) {
    console.error('Error in fetchRelevantData:', error);
    // Return subset of mock data on error
    return {
      statistics: MOCK_DATA.statistics?.slice(0, 2),
      resources: MOCK_DATA.resources?.slice(0, 2)
    };
  }
}
