// Performance monitoring and analytics

export interface WebVitalsMetric {
  id: string
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  entries: PerformanceEntry[]
}

// Web Vitals thresholds
const VITALS_THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
}

// Rate metric based on thresholds
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = VITALS_THRESHOLDS[name as keyof typeof VITALS_THRESHOLDS]
  if (!thresholds) return 'good'
  
  if (value <= thresholds.good) return 'good'
  if (value <= thresholds.poor) return 'needs-improvement'
  return 'poor'
}

// Send metric to analytics service
export function sendToAnalytics(metric: WebVitalsMetric) {
  // In production, send to your analytics service
  if (process.env.NODE_ENV === 'production') {
    // Example: Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', metric.name, {
        custom_map: { metric_id: 'custom_metric_id' },
        metric_id: metric.id,
        metric_value: metric.value,
        metric_delta: metric.delta,
        metric_rating: metric.rating,
      })
    }
    
    // Example: Custom analytics endpoint
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'web-vital',
        metric: metric.name,
        value: metric.value,
        rating: metric.rating,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    }).catch(console.error)
  } else {
    // Development logging
    console.log('📊 Web Vital:', {
      name: metric.name,
      value: Math.round(metric.value),
      rating: metric.rating,
      delta: Math.round(metric.delta),
    })
  }
}

// Enhanced Web Vitals reporting
export function reportWebVitals(metric: any) {
  const enhancedMetric: WebVitalsMetric = {
    ...metric,
    rating: getRating(metric.name, metric.value),
  }
  
  sendToAnalytics(enhancedMetric)
}

// Performance observer for custom metrics
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private observers: PerformanceObserver[] = []
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }
  
  // Monitor navigation timing
  monitorNavigation() {
    if (typeof window === 'undefined') return
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming
          
          // Custom metrics
          const metrics = {
            domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
            firstByte: navEntry.responseStart - navEntry.requestStart,
            dnsLookup: navEntry.domainLookupEnd - navEntry.domainLookupStart,
            tcpConnect: navEntry.connectEnd - navEntry.connectStart,
          }
          
          Object.entries(metrics).forEach(([name, value]) => {
            if (value > 0) {
              sendToAnalytics({
                id: `${name}-${Date.now()}`,
                name: `custom_${name}`,
                value,
                rating: value < 1000 ? 'good' : value < 3000 ? 'needs-improvement' : 'poor',
                delta: value,
                entries: [entry],
              })
            }
          })
        }
      }
    })
    
    observer.observe({ entryTypes: ['navigation'] })
    this.observers.push(observer)
  }
  
  // Monitor resource loading
  monitorResources() {
    if (typeof window === 'undefined') return
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming
          
          // Track slow resources
          if (resourceEntry.duration > 1000) {
            sendToAnalytics({
              id: `slow-resource-${Date.now()}`,
              name: 'slow_resource',
              value: resourceEntry.duration,
              rating: 'poor',
              delta: resourceEntry.duration,
              entries: [entry],
            })
          }
        }
      }
    })
    
    observer.observe({ entryTypes: ['resource'] })
    this.observers.push(observer)
  }
  
  // Monitor long tasks
  monitorLongTasks() {
    if (typeof window === 'undefined') return
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'longtask') {
          sendToAnalytics({
            id: `long-task-${Date.now()}`,
            name: 'long_task',
            value: entry.duration,
            rating: 'poor',
            delta: entry.duration,
            entries: [entry],
          })
        }
      }
    })
    
    try {
      observer.observe({ entryTypes: ['longtask'] })
      this.observers.push(observer)
    } catch (e) {
      // longtask not supported in all browsers
      console.warn('Long task monitoring not supported')
    }
  }
  
  // Start all monitoring
  startMonitoring() {
    this.monitorNavigation()
    this.monitorResources()
    this.monitorLongTasks()
  }
  
  // Stop all monitoring
  stopMonitoring() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  const monitor = PerformanceMonitor.getInstance()
  monitor.startMonitoring()
}