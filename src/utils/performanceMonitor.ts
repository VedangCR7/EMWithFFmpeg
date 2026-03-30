/**
 * Performance Monitoring Utility
 * 
 * Tracks and logs performance metrics for debugging and optimization
 * Only active in development mode
 */

import React from 'react';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private enabled: boolean = __DEV__;

  /**
   * Measure execution time of a function
   */
  measure<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    if (!this.enabled) {
      return fn();
    }

    const start = performance.now();
    const result = fn();
    const end = performance.now();
    const duration = end - start;

    this.recordMetric(name, duration, metadata);

    return result;
  }

  /**
   * Measure async function execution time
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    if (!this.enabled) {
      return fn();
    }

    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const duration = end - start;

    this.recordMetric(name, duration, metadata);

    return result;
  }

  /**
   * Record a custom metric
   */
  recordMetric(name: string, duration: number, metadata?: Record<string, any>) {
    if (!this.enabled) return;

    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);

    // Log slow operations (>100ms)
    if (duration > 100) {
      console.warn(`⚠️ Slow operation: ${name} took ${duration.toFixed(2)}ms`, metadata);
    }

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }
  }

  /**
   * Get average duration for a metric name
   */
  getAverageDuration(name: string): number {
    const metrics = this.metrics.filter(m => m.name === name);
    if (metrics.length === 0) return 0;

    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
  }

  /**
   * Get performance summary
   */
  getSummary(): Record<string, { count: number; avgDuration: number; maxDuration: number }> {
    const summary: Record<string, { count: number; avgDuration: number; maxDuration: number }> = {};

    this.metrics.forEach(metric => {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          count: 0,
          avgDuration: 0,
          maxDuration: 0,
        };
      }

      const entry = summary[metric.name];
      entry.count++;
      entry.avgDuration = (entry.avgDuration * (entry.count - 1) + metric.duration) / entry.count;
      entry.maxDuration = Math.max(entry.maxDuration, metric.duration);
    });

    return summary;
  }

  /**
   * Log performance summary
   */
  logSummary() {
    if (!this.enabled) return;

    const summary = this.getSummary();
    console.log('📊 Performance Summary:', summary);
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React Hook for measuring component render time
 */
export const usePerformanceMeasure = (componentName: string) => {
  const renderStartRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (__DEV__) {
      renderStartRef.current = performance.now();
    }

    return () => {
      if (__DEV__ && renderStartRef.current !== null) {
        const duration = performance.now() - renderStartRef.current;
        if (duration > 16) { // Log if render took more than one frame (16ms)
          console.warn(`⚠️ Slow render: ${componentName} took ${duration.toFixed(2)}ms`);
        }
      }
    };
  });
};

