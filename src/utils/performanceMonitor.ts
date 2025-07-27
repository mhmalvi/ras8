interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface PageLoadMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
    this.monitorPageLoad();
  }

  private initializeObservers() {
    // Monitor Long Tasks (>50ms)
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.recordMetric('long_task', entry.duration, {
              type: entry.entryType,
              name: entry.name
            });
            
            if (entry.duration > 100) {
              console.warn(`🐌 Long task detected: ${entry.name} (${entry.duration}ms)`);
            }
          });
        });
        
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (error) {
        console.warn('Long task observer not supported');
      }

      // Monitor Layout Shifts
      try {
        const layoutShiftObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (entry.hadRecentInput) return; // Ignore user-initiated shifts
            
            this.recordMetric('layout_shift', entry.value, {
              sources: entry.sources?.map((s: any) => s.node?.tagName).join(',') || 'unknown'
            });
            
            if (entry.value > 0.1) {
              console.warn(`🎨 Layout shift detected: ${entry.value}`);
            }
          });
        });
        
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(layoutShiftObserver);
      } catch (error) {
        console.warn('Layout shift observer not supported');
      }

      // Monitor First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.recordMetric('first_input_delay', (entry as any).processingStart - entry.startTime, {
              type: (entry as any).name
            });
          });
        });
        
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (error) {
        console.warn('FID observer not supported');
      }
    }
  }

  private monitorPageLoad() {
    // Web Vitals monitoring
    if ('PerformanceObserver' in window) {
      // LCP - Largest Contentful Paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordMetric('largest_contentful_paint', lastEntry.startTime);
        });
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (error) {
        console.warn('LCP observer not supported');
      }

      // FCP - First Contentful Paint
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.recordMetric('first_contentful_paint', entry.startTime);
          });
        });
        
        fcpObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(fcpObserver);
      } catch (error) {
        console.warn('FCP observer not supported');
      }
    }

    // Navigation timing
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          this.recordMetric('dns_lookup', navigation.domainLookupEnd - navigation.domainLookupStart);
          this.recordMetric('tcp_connect', navigation.connectEnd - navigation.connectStart);
          this.recordMetric('ttfb', navigation.responseStart - navigation.requestStart);
          this.recordMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart);
          this.recordMetric('page_load', navigation.loadEventEnd - navigation.fetchStart);
        }
      }, 1000);
    });
  }

  recordMetric(name: string, value: number, tags?: Record<string, string>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      tags
    };
    
    this.metrics.push(metric);
    
    // Log significant performance issues
    if (this.isPerformanceIssue(name, value)) {
      console.warn(`⚠️ Performance issue detected: ${name} = ${value}ms`, tags);
    }
    
    // Keep only last 1000 metrics to prevent memory leak
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  private isPerformanceIssue(name: string, value: number): boolean {
    const thresholds: Record<string, number> = {
      'largest_contentful_paint': 2500,
      'first_contentful_paint': 1800,
      'first_input_delay': 100,
      'layout_shift': 0.1,
      'ttfb': 800,
      'long_task': 100
    };
    
    return thresholds[name] ? value > thresholds[name] : false;
  }

  getMetrics(timeRange?: number): PerformanceMetric[] {
    if (!timeRange) return this.metrics;
    
    const cutoff = Date.now() - timeRange;
    return this.metrics.filter(metric => metric.timestamp > cutoff);
  }

  getPageLoadMetrics(): PageLoadMetrics | null {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (!navigation) return null;

    return {
      fcp: this.getMetricValue('first_contentful_paint') || 0,
      lcp: this.getMetricValue('largest_contentful_paint') || 0,
      fid: this.getMetricValue('first_input_delay') || 0,
      cls: this.getMetricValue('layout_shift') || 0,
      ttfb: navigation.responseStart - navigation.requestStart
    };
  }

  private getMetricValue(name: string): number | null {
    const metric = this.metrics.find(m => m.name === name);
    return metric ? metric.value : null;
  }

  generateReport(): string {
    const metrics = this.getPageLoadMetrics();
    if (!metrics) return 'No performance data available';

    const issues = [];
    
    if (metrics.lcp > 2500) issues.push(`LCP too slow: ${metrics.lcp}ms`);
    if (metrics.fcp > 1800) issues.push(`FCP too slow: ${metrics.fcp}ms`);
    if (metrics.fid > 100) issues.push(`FID too high: ${metrics.fid}ms`);
    if (metrics.cls > 0.1) issues.push(`CLS too high: ${metrics.cls}`);
    if (metrics.ttfb > 800) issues.push(`TTFB too slow: ${metrics.ttfb}ms`);

    return issues.length > 0 
      ? `Performance Issues:\n${issues.join('\n')}`
      : 'All performance metrics are within acceptable ranges';
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics = [];
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Add to window for development debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).performanceMonitor = performanceMonitor;
}

// Auto-report performance issues in development
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const report = performanceMonitor.generateReport();
    if (report.includes('Issues')) {
      console.group('🚨 Performance Report');
      console.warn(report);
      console.groupEnd();
    }
  }, 30000); // Check every 30 seconds
}
