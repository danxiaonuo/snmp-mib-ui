'use client'

import { useEffect } from 'react'
import { reportWebVitals } from '@/lib/analytics'

// Performance monitoring component
export default function PerformanceMonitor() {
  useEffect(() => {
    // Import and setup web vitals
    import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB, onINP }) => {
      onCLS(reportWebVitals)
      onFID(reportWebVitals)
      onFCP(reportWebVitals)
      onLCP(reportWebVitals)
      onTTFB(reportWebVitals)
      onINP(reportWebVitals)
    })

    // Custom performance tracking
    const trackPageLoad = () => {
      if (typeof window !== 'undefined' && window.performance) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        
        if (navigation) {
          // Track custom metrics
          const metrics = {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            firstByte: navigation.responseStart - navigation.requestStart,
            dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcpConnect: navigation.connectEnd - navigation.connectStart,
            sslHandshake: navigation.secureConnectionStart > 0 
              ? navigation.connectEnd - navigation.secureConnectionStart 
              : 0,
          }

          // Send custom metrics
          Object.entries(metrics).forEach(([name, value]) => {
            if (value > 0) {
              reportWebVitals({
                id: `${name}-${Date.now()}`,
                name: `custom_${name}`,
                value,
                rating: value < 1000 ? 'good' : value < 3000 ? 'needs-improvement' : 'poor',
                delta: value,
                entries: [navigation],
              })
            }
          })
        }
      }
    }

    // Track page load metrics after a short delay
    const timer = setTimeout(trackPageLoad, 1000)

    // Track user interactions
    const trackInteraction = (event: Event) => {
      const startTime = performance.now()
      
      requestAnimationFrame(() => {
        const duration = performance.now() - startTime
        
        if (duration > 16) { // Longer than one frame (16ms)
          reportWebVitals({
            id: `interaction-${Date.now()}`,
            name: 'custom_interaction_delay',
            value: duration,
            rating: duration < 50 ? 'good' : duration < 100 ? 'needs-improvement' : 'poor',
            delta: duration,
            entries: [],
          })
        }
      })
    }

    // Add interaction listeners
    const events = ['click', 'keydown', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, trackInteraction, { passive: true })
    })

    // Memory usage tracking (if available)
    const trackMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        
        reportWebVitals({
          id: `memory-${Date.now()}`,
          name: 'custom_memory_usage',
          value: memory.usedJSHeapSize / 1024 / 1024, // MB
          rating: memory.usedJSHeapSize < 50 * 1024 * 1024 ? 'good' : 'needs-improvement',
          delta: memory.usedJSHeapSize / 1024 / 1024,
          entries: [],
        })
      }
    }

    // Track memory usage every 30 seconds
    const memoryTimer = setInterval(trackMemoryUsage, 30000)

    // Error tracking
    const trackError = (event: ErrorEvent) => {
      reportWebVitals({
        id: `error-${Date.now()}`,
        name: 'custom_javascript_error',
        value: 1,
        rating: 'poor',
        delta: 1,
        entries: [],
      })
    }

    const trackUnhandledRejection = (event: PromiseRejectionEvent) => {
      reportWebVitals({
        id: `promise-rejection-${Date.now()}`,
        name: 'custom_promise_rejection',
        value: 1,
        rating: 'poor',
        delta: 1,
        entries: [],
      })
    }

    window.addEventListener('error', trackError)
    window.addEventListener('unhandledrejection', trackUnhandledRejection)

    // Cleanup
    return () => {
      clearTimeout(timer)
      clearInterval(memoryTimer)
      events.forEach(event => {
        document.removeEventListener(event, trackInteraction)
      })
      window.removeEventListener('error', trackError)
      window.removeEventListener('unhandledrejection', trackUnhandledRejection)
    }
  }, [])

  // This component doesn't render anything
  return null
}