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

export async function fetchRelevantData(query: string): Promise<RAGData> {
  // Check cache first
  const cacheKey = query.toLowerCase().trim();
  const cached = cache[cacheKey];
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    // Fetch latest statistics and resources from JobsForHer API
    // This is a placeholder - replace with actual API endpoints
    const stats = await fetch('https://api.jobsforher.com/v1/statistics').then(r => r.json());
    const resources = await fetch('https://api.jobsforher.com/v1/resources').then(r => r.json());

    const data: RAGData = {
      statistics: stats.map((s: any) => ({
        value: s.value,
        source: 'JobsForHer Analytics ' + new Date().toISOString().split('T')[0]
      })),
      resources: resources.map((r: any) => ({
        text: r.title,
        url: r.url
      }))
    };

    // Update cache
    cache[cacheKey] = {
      data,
      timestamp: Date.now()
    };

    return data;
  } catch (error) {
    console.error('Error fetching RAG data:', error);
    return {};
  }
}
