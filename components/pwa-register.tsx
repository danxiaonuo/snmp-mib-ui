"use client"

import { useEffect } from "react"

export function PWARegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        })
        .then((registration) => {
          console.log('✅ Service Worker registered successfully:', registration.scope)
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('🔄 New service worker available')
                  // Optionally show update notification
                  showUpdateNotification()
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error)
        })

      // Handle service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('📨 Message from service worker:', event.data)
        
        if (event.data.type === 'CACHE_UPDATED') {
          console.log('💾 Cache updated for:', event.data.url)
        }
      })

      // Handle online/offline status
      const handleOnline = () => {
        console.log('🌐 Back online')
        // Optionally sync data or show notification
      }

      const handleOffline = () => {
        console.log('📴 Gone offline')
        // Optionally show offline notification
      }

      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  const showUpdateNotification = () => {
    // Create a simple update notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('MIB Platform Updated', {
        body: 'A new version is available. Refresh to update.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'app-update',
        renotify: true,
        actions: [
          {
            action: 'refresh',
            title: 'Refresh Now'
          },
          {
            action: 'dismiss',
            title: 'Later'
          }
        ]
      })
    }
  }

  // Request notification permission on first load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        console.log('🔔 Notification permission:', permission)
      })
    }
  }, [])

  return null // This component doesn't render anything
}