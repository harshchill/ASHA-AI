import { performance } from 'perf_hooks';

interface ApiMetrics {
  requestSize: number;
  responseSize: number;
  elapsedTime: number;
}

export function measureObjectSize(obj: any): number {
  return Buffer.from(JSON.stringify(obj)).length;
}

export async function measureApiCall<T>(
  apiCall: () => Promise<T>,
  context: string
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
      elapsedTime: end - start
    };

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
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}
