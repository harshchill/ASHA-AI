import { performance } from 'perf_hooks';

interface ApiMetrics {
  requestSize: number;
  responseSize: number;
  elapsedTime: number;
  source?: string;
  consecutive_failures?: number;
  context?: Record<string, any>;
}

export function measureObjectSize(obj: any): number {
  return Buffer.from(JSON.stringify(obj)).length;
}

// Track API performance history
const apiMetricsHistory = new Map<string, ApiMetrics[]>();
const MAX_HISTORY_SIZE = 100;

export function trackApiMetrics(
  metrics: ApiMetrics,
  source: string
): void {
  const history = apiMetricsHistory.get(source) || [];
  history.push(metrics);
  
  // Keep history size manageable
  if (history.length > MAX_HISTORY_SIZE) {
    history.shift();
  }
  
  apiMetricsHistory.set(source, history);
  
  // Calculate rolling average
  const avgLatency = history.reduce((sum, m) => sum + m.elapsedTime, 0) / history.length;
  
  // Log performance trends
  console.log(`API Performance Trends [${source}]:
    - Avg latency (last ${history.length} calls): ${avgLatency.toFixed(2)}ms
    - Current call: ${metrics.elapsedTime.toFixed(2)}ms
    - Response size: ${(metrics.responseSize / 1024).toFixed(2)}KB
  `);
}

export async function measureApiCall<T>(
  apiCall: () => Promise<T>,
  context: string,
  source?: string
): Promise<T> {
  const start = performance.now();
  const startMemory = process.memoryUsage().heapUsed;
  
  try {
    const result = await apiCall();
    const end = performance.now();
    const endMemory = process.memoryUsage().heapUsed;
    
    const metrics: ApiMetrics = {
      requestSize: endMemory - startMemory,
      responseSize: measureObjectSize(result),
      elapsedTime: end - start,
      source,
      context: {
        timestamp: new Date().toISOString()
      }
    };

    // Track metrics if source is provided
    if (source) {
      trackApiMetrics(metrics, source);
    }

    // Log metrics
    console.log(`API Call Metrics [${context}]:`, {
      ...metrics,
      timestamp: new Date().toISOString()
    });

    // Warn if latency is high
    if (metrics.elapsedTime > 500) {
      console.warn(`⚠️ High latency detected [${context}]: ${metrics.elapsedTime.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    const end = performance.now();
    console.error(`API Call Failed [${context}]:`, {
      error,
      elapsedTime: end - start,
      source,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

interface MetricsReport {
  source?: string;
  callCount: number;
  avgLatency: number;
  maxLatency: number;
  avgResponseSize: number;
}

export function getApiMetricsReport(source?: string): Record<string, MetricsReport> {
  if (source) {
    const history = apiMetricsHistory.get(source) || [];
    const report: Record<string, MetricsReport> = {
      [source]: {
        source,
        callCount: history.length,
        avgLatency: history.length
          ? history.reduce((sum: number, m: ApiMetrics) => sum + m.elapsedTime, 0) / history.length
          : 0,
        maxLatency: history.length
          ? Math.max(...history.map((m: ApiMetrics) => m.elapsedTime))
          : 0,
        avgResponseSize: history.length
          ? history.reduce((sum: number, m: ApiMetrics) => sum + m.responseSize, 0) / history.length
          : 0
      }
    };
    return report;
  }

  // Return metrics for all sources
  const report: Record<string, MetricsReport> = {};
  
  // Convert Map entries to array for iteration
  Array.from(apiMetricsHistory.entries()).forEach(([src, history]) => {
    report[src] = {
      source: src,
      callCount: history.length,
      avgLatency: history.reduce((sum: number, m: ApiMetrics) => sum + m.elapsedTime, 0) / history.length,
      maxLatency: Math.max(...history.map((m: ApiMetrics) => m.elapsedTime)),
      avgResponseSize: history.reduce((sum: number, m: ApiMetrics) => sum + m.responseSize, 0) / history.length
    };
  });
  
  return report;
}
