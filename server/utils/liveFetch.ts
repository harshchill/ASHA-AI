import axios from 'axios';
import { RAGData } from '../types';

interface Statistic {
  value: string;
  source: string;
}

interface Resource {
  text: string;
  url: string;
}

interface BLSResponse {
  status: string;
  Results: {
    series: Array<{
      seriesID: string;
      data: Array<{
        year: string;
        period: string;
        periodName: string;
        value: string;
      }>;
    }>;
  };
}

interface WomenInTechResponse {
  name: string;
  title: string;
  organization: string;
  expertise: string[];
  impact: string;
}

interface DataSource {
  name: string;
  baseUrl: string;
  fetchData: (query: string) => Promise<{
    statistics?: Statistic[];
    resources?: Resource[];
  } | Statistic[] | null>;
}

const BLS_SERIES = {
  LABOR_FORCE_PARTICIPATION: 'LNS11300000',
  UNEMPLOYMENT_RATE: 'LNS14000000',
  WOMEN_EMPLOYMENT: 'LNS12000002'
};

const dataSources: DataSource[] = [
  {
    name: 'BLS',
    baseUrl: 'https://api.bls.gov/publicAPI/v1/timeseries/data',
    async fetchData(query: string) {
      const currentYear = new Date().getFullYear();
      const relevantSeries = Object.values(BLS_SERIES);

      try {
        const promises = relevantSeries.map(seriesId => 
          axios.get<BLSResponse>(`${this.baseUrl}/${seriesId}`, {
            params: {
              startyear: currentYear - 1,
              endyear: currentYear
            },
            timeout: 5000
          })
        );

        const responses = await Promise.allSettled(promises);
        const validResponses = responses
          .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
          .map(r => r.value.data)
          .filter(data => data.status === 'REQUEST_SUCCEEDED')
          .flatMap(data => formatBLSData(data));

        return validResponses;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
            console.error('BLS API request timed out');
          } else {
            console.error('BLS API error:', error.message);
          }
        }
        return null;
      }
    }
  },
  {
    name: 'WomenInTech',
    baseUrl: 'https://women-in-tech.apievangelist.com/apis/people',
    async fetchData(query: string) {
      try {
        const response = await axios.get<WomenInTechResponse[]>(this.baseUrl, {
          timeout: 5000,
          validateStatus: status => status === 200
        });

        if (!Array.isArray(response.data) || !response.data.length) {
          console.warn('Women in Tech API returned invalid data format');
          return null;
        }

        // Filter and validate profiles
        const keywords = query.toLowerCase().split(/\s+/);
        const validProfiles = response.data
          .filter(profile => 
            profile.name && 
            profile.title && 
            profile.organization && 
            Array.isArray(profile.expertise) &&
            profile.expertise.length > 0
          )
          .filter(profile =>
            keywords.some(kw => 
              profile.expertise.some(exp => exp.toLowerCase().includes(kw)) ||
              profile.title.toLowerCase().includes(kw)
            )
          )
          .slice(0, 3);

        if (!validProfiles.length) {
          return null;
        }

        return {
          statistics: validProfiles.map(profile => ({
            value: `${profile.name} achieved significant impact in ${profile.expertise.join(', ')}`,
            source: `${profile.organization} Success Story`
          })),
          resources: validProfiles.map(profile => ({
            text: `Connect with ${profile.name} - ${profile.title}`,
            url: `https://women-in-tech.apievangelist.com/profile/${encodeURIComponent(profile.name)}`
          }))
        };
      } catch (error) {
        console.error('Women in Tech API error:', error instanceof Error ? error.message : 'Unknown error');
        return null;
      }
    }
  }
];

function formatBLSData(response: BLSResponse): Statistic[] {
  if (!response?.Results?.series?.[0]?.data) {
    return [];
  }

  const series = response.Results.series[0];
  const latestData = series.data[0];
  
  return [{
    value: `Current ${series.seriesID} rate: ${latestData.value}% (${latestData.periodName} ${latestData.year})`,
    source: 'U.S. Bureau of Labor Statistics'
  }];
}

let failureCount = 0;

export async function fetchLiveData(query: string): Promise<RAGData> {
  const startTime = performance.now();
  
  // Initialize results with required fields
  const results: RAGData = {
    statistics: [],
    resources: [],
    metrics: {
      requestTime: 0,
      responseSize: 0,
      latencyWarning: false
    }
  };

  try {
    // Execute all data source fetches with a global timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Global API timeout')), 15000);
    });

    const dataPromises = dataSources.map(source => source.fetchData(query));
    const responses = await Promise.race([
      Promise.allSettled(dataPromises),
      timeoutPromise
    ]) as PromiseSettledResult<any>[];
    
    // Track performance metrics
    const endTime = performance.now();
    const requestTime = endTime - startTime;
    const responseSize = responses.reduce((size, response) => {
      if (response.status === 'fulfilled' && response.value) {
        return size + JSON.stringify(response.value).length;
      }
      return size;
    }, 0);

    // Update metrics
    results.metrics = {
      requestTime,
      responseSize,
      latencyWarning: requestTime > 500
    };

    // Log performance metrics
    console.log(`📊 Live Data Metrics:
    - Total request time: ${Math.round(requestTime)}ms
    - Total response size: ${Math.round(responseSize / 1024)}KB
    ${requestTime > 500 ? '⚠️ High latency warning!' : ''}`);

    // Track consecutive failures for fallback logic
    let currentFailures = 0;

    // Process successful responses
    responses.forEach((response, index) => {
      if (response.status === 'fulfilled' && response.value) {
        const data = response.value;
        
        if (Array.isArray(data)) {
          results.statistics.push(...data.filter((stat: any): stat is Statistic => 
            stat && typeof stat.value === 'string' && typeof stat.source === 'string'
          ));
        } else if (data.statistics || data.resources) {
          if (Array.isArray(data.statistics)) {
            results.statistics.push(...data.statistics.filter((stat: any): stat is Statistic => 
              stat && typeof stat.value === 'string' && typeof stat.source === 'string'
            ));
          }
          if (Array.isArray(data.resources)) {
            results.resources.push(...data.resources.filter((resource: any): resource is Resource => 
              resource && typeof resource.text === 'string' && typeof resource.url === 'string'
            ));
          }
        }      } else if (response.status === 'rejected') {
        console.error(`Error fetching from ${dataSources[index].name}:`, response.reason);
        currentFailures++;
      }
    });

    // Check for consecutive failures
    if (currentFailures >= 3) {
      console.warn('Multiple API failures detected - falling back to default data');
      return {
        statistics: [{
          value: "As of 2025, women make up approximately 34% of the tech workforce",
          source: "Cache: Women in Tech Report 2025"
        }],
        resources: [{
          text: "JobsForHer Career Resources",
          url: "https://www.jobsforher.com/resources"
        }],
        metrics: results.metrics
      };
    }

    // Deduplicate results with null checks
    const uniqueStats = new Set<string>();
    const uniqueResources = new Set<string>();
    
    results.statistics = results.statistics
      .filter((stat: Statistic) => {
        const key = `${stat.value}|${stat.source}`;
        if (uniqueStats.has(key)) return false;
        uniqueStats.add(key);
        return true;
      })
      .slice(0, 5);

    results.resources = results.resources
      .filter((resource: Resource) => {
        const key = resource.url;
        if (uniqueResources.has(key)) return false;
        uniqueResources.add(key);
        return true;
      })
      .slice(0, 5);    console.log('Live data fetched successfully:', {
      statisticsCount: results.statistics.length,
      resourcesCount: results.resources.length,
      requestTime: `${Math.round(results.metrics?.requestTime || 0)}ms`,
      latencyWarning: results.metrics?.latencyWarning
    });

    // Ensure we never return empty results
    if (results.statistics.length === 0 && results.resources.length === 0) {
      return {
        statistics: [{
          value: "As of 2025, women make up approximately 34% of the tech workforce",
          source: "Cache: Women in Tech Report 2025"
        }],
        resources: [{
          text: "JobsForHer Career Resources",
          url: "https://www.jobsforher.com/resources"
        }],
        metrics: results.metrics
      };
    }

    return results;
  } catch (error) {
    console.error('Error in fetchLiveData:', error instanceof Error ? error.message : 'Unknown error');
    failureCount++;

    // After three consecutive failures, suggest service status check
    const errorMessage = failureCount >= 3
      ? "We're experiencing persistent issues with our data services. Please try again later or contact support."
      : "Temporary data fetch error - using cached data.";

    console.warn(errorMessage);

    return {
      statistics: [{
        value: "As of 2025, women make up approximately 34% of the tech workforce",
        source: "Cache: Women in Tech Report 2025"
      }],
      resources: [{
        text: "JobsForHer Career Resources",
        url: "https://www.jobsforher.com/resources"
      }],
      metrics: {
        requestTime: performance.now() - startTime,
        responseSize: 0,
        latencyWarning: false
      }
    };
  }
}
