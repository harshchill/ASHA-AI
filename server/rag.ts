import { Groq } from "groq-sdk";
import { fetchLiveData } from './utils/liveFetch';
import { RAGData } from './types';
import { measureApiCall } from './utils/diagnostics';
import { performance } from 'perf_hooks';

interface RAGCache {
  [key: string]: {
    data: RAGData;
    timestamp: number;
    metrics?: {
      cacheHits: number;
      lastAccessed: number;
    };
  };
}

// In-memory cache with 1-hour expiry
const cache: RAGCache = {};
const CACHE_DURATION = 3600000; // 1 hour in milliseconds
const MAX_CACHE_ENTRIES = 1000; // Prevent unbounded growth

// Mock data for consistent responses
const MOCK_DATA: RAGData = {
  statistics: [
    {
      value: "92% of women felt more confident in their career decisions after personalized mentorship",
      source: "JobsForHer Impact Report 2025",
      emoji: "⭐",
      category: "success"
    },
    {
      value: "Women supporting women: 78% reported stronger emotional well-being with peer support",
      source: "JobsForHer Community Survey 2025",
      emoji: "💪",
      category: "impact"
    },
    {
      value: "3 in 4 women overcame career challenges through supportive networking",
      source: "Women in Tech Wellness Study 2025",
      emoji: "🤝",
      category: "success"
    },
    {
      value: "89% experienced reduced career anxiety with regular mentor guidance",
      source: "Professional Women's Mental Health Report 2025",
      emoji: "🎯",
      category: "impact"
    },
    {
      value: "Work-life harmony achievement increased by 65% with proper support systems",
      source: "JobsForHer Balance Index 2025",
      emoji: "⚖️",
      category: "trend"
    }
  ],  resources: [
    {
      text: "Emotional Intelligence in Leadership - Free Workshop",
      url: "https://www.jobsforher.com/workshops/ei-leadership",
      emoji: "🧠",
      category: "career",
      level: "intermediate",
      metrics: {
        relevance: 0.95,
        emotionalContext: "practical",
        usageCount: 0
      }
    },
    {
      text: "Women's Support Circle - Weekly Virtual Meetups",
      url: "https://www.jobsforher.com/community/support-circle",
      emoji: "👥",
      category: "community",
      level: "beginner",
      metrics: {
        relevance: 0.9,
        emotionalContext: "supportive",
        usageCount: 0
      }
    },
    {
      text: "Career Transition Support Program",
      url: "https://www.jobsforher.com/transition-support",
      emoji: "🔄",
      category: "career",
      level: "intermediate",
      metrics: {
        relevance: 0.85,
        emotionalContext: "practical",
        usageCount: 0
      }
    },
    {
      text: "Work-Life Balance Counseling Sessions",
      url: "https://www.jobsforher.com/counseling",
      emoji: "⚖️",
      category: "mentorship",
      level: "beginner",
      metrics: {
        relevance: 0.8,
        emotionalContext: "supportive",
        usageCount: 0
      }
    },
    {
      text: "Mindful Career Planning Resources",
      url: "https://www.jobsforher.com/mindful-planning",
      emoji: "🎯",
      category: "tool",
      level: "advanced",
      metrics: {
        relevance: 0.75,
        emotionalContext: "motivational",
        usageCount: 0
      }
    }
  ]
};

function cleanCache(): void {
  const now = Date.now();
  Object.keys(cache).forEach(key => {
    if (now - cache[key].timestamp > CACHE_DURATION) {
      delete cache[key];
    }
  });

  // If still too many entries, remove least recently accessed
  if (Object.keys(cache).length > MAX_CACHE_ENTRIES) {
    const entries = Object.entries(cache)
      .sort(([, a], [, b]) => (b.metrics?.lastAccessed || 0) - (a.metrics?.lastAccessed || 0))
      .slice(MAX_CACHE_ENTRIES);
    
    entries.forEach(([key]) => delete cache[key]);
  }
}

export async function fetchRelevantData(query: string): Promise<RAGData> {
  const startTime = performance.now();
  
  try {
    // Clean cache periodically
    cleanCache();
    
    // Check cache first
    const cacheKey = query.toLowerCase().trim();
    const cached = cache[cacheKey];
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      // Update cache metrics
      cached.metrics = {
        cacheHits: (cached.metrics?.cacheHits || 0) + 1,
        lastAccessed: Date.now()
      };
      
      console.log("Using cached RAG data", {
        cacheHits: cached.metrics.cacheHits,
        age: Math.round((Date.now() - cached.timestamp) / 1000) + 's'
      });
      
      return cached.data;
    }

    console.log("Fetching live data...");
    
    // Try to get live data first with performance monitoring
    let liveData: RAGData = await measureApiCall(
      () => fetchLiveData(query),
      'Live Data Fetch',
      'JFH_LIVE_API'
    );

    console.log("Successfully fetched live data", {
      statsCount: liveData.statistics.length,
      resourcesCount: liveData.resources.length,
      metrics: liveData.metrics
    });

    // Log latency warning if needed
    if (liveData.metrics?.requestTime && liveData.metrics.requestTime > 500) {
      console.warn(`⚠️ High latency in live data fetch: ${Math.round(liveData.metrics.requestTime)}ms`);
    }

    // Filter mock data based on query keywords for fallback/augmentation
    const keywords = query.toLowerCase().split(/\s+/);
    const filteredMockData: RAGData = {
      statistics: MOCK_DATA.statistics.filter(stat => 
        keywords.some(keyword => stat.value.toLowerCase().includes(keyword))
      ) || MOCK_DATA.statistics.slice(0, 2),
      resources: MOCK_DATA.resources.filter(resource => 
        keywords.some(keyword => resource.text.toLowerCase().includes(keyword))
      ) || MOCK_DATA.resources.slice(0, 2)
    };

    // Combine live and mock data, prioritizing live data
    const combinedData: RAGData = {
      statistics: [...liveData.statistics, ...filteredMockData.statistics].slice(0, 5),
      resources: [...liveData.resources, ...filteredMockData.resources].slice(0, 5),
      metrics: {
        requestTime: performance.now() - startTime,
        responseSize: JSON.stringify(liveData).length,
        latencyWarning: (performance.now() - startTime) > 500
      }
    };

    // Update cache
    cache[cacheKey] = {
      data: combinedData,
      timestamp: Date.now(),
      metrics: {
        cacheHits: 0,
        lastAccessed: Date.now()
      }
    };

    return combinedData;
  } catch (error) {
    console.error('Error in fetchRelevantData:', error);
    
    // Return subset of mock data on error with metrics
    return {
      statistics: MOCK_DATA.statistics.slice(0, 2),
      resources: MOCK_DATA.resources.slice(0, 2),
      metrics: {
        requestTime: performance.now() - startTime,
        responseSize: 0,
        latencyWarning: false
      }
    };
  }
}
