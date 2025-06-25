"use client"

import { useEffect, useState } from "react"
import { useIsMobile } from "@/hooks/use-mobile"

export function MobileOptimizations() {
  const isMobile = useIsMobile()
  const [isStandalone, setIsStandalone] = useState(false)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  useEffect(() => {
    // Check if running as PWA
    const checkStandalone = () => {
      const isStandalonePWA = window.matchMedia('(display-mode: standalone)').matches ||
                             (window.navigator as any).standalone ||
                             document.referrer.includes('android-app://')
      setIsStandalone(isStandalonePWA)
    }

    // Check orientation
    const checkOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape')
    }

    checkStandalone()
    checkOrientation()

    // Listen for orientation changes
    window.addEventListener('orientationchange', checkOrientation)
    window.addEventListener('resize', checkOrientation)

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    mediaQuery.addEventListener('change', checkStandalone)

    return () => {
      window.removeEventListener('orientationchange', checkOrientation)
      window.removeEventListener('resize', checkOrientation)
      mediaQuery.removeEventListener('change', checkStandalone)
    }
  }, [])

  useEffect(() => {
    // Apply mobile-specific optimizations
    if (isMobile) {
      // Prevent zoom on double tap
      let lastTouchEnd = 0
      const preventZoom = (e: TouchEvent) => {
        const now = new Date().getTime()
        if (now - lastTouchEnd <= 300) {
          e.preventDefault()
        }
        lastTouchEnd = now
      }
      
      document.addEventListener('touchend', preventZoom, { passive: false })

      // Improve scrolling performance
      document.body.style.webkitOverflowScrolling = 'touch'
      document.body.style.overscrollBehaviorY = 'contain'

      // Add mobile-specific classes
      document.documentElement.classList.add('mobile-device')
      
      if (isStandalone) {
        document.documentElement.classList.add('pwa-mode')
      }

      if (orientation === 'landscape') {
        document.documentElement.classList.add('landscape-mode')
      } else {
        document.documentElement.classList.remove('landscape-mode')
      }

      return () => {
        document.removeEventListener('touchend', preventZoom)
        document.documentElement.classList.remove('mobile-device', 'pwa-mode', 'landscape-mode')
      }
    }
  }, [isMobile, isStandalone, orientation])

  useEffect(() => {
    // Handle viewport height changes (mobile browser address bar)
    const setVH = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }

    setVH()
    window.addEventListener('resize', setVH)
    window.addEventListener('orientationchange', () => {
      setTimeout(setVH, 100) // Delay to ensure orientation change is complete
    })

    return () => {
      window.removeEventListener('resize', setVH)
      window.removeEventListener('orientationchange', setVH)
    }
  }, [])

  // Handle iOS Safari specific issues
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

    if (isIOS && isSafari) {
      // Fix iOS Safari viewport issues
      document.documentElement.classList.add('ios-safari')
      
      // Prevent elastic scrolling
      document.body.addEventListener('touchmove', (e) => {
        if ((e.target as Element).closest('.scroll-container')) return
        e.preventDefault()
      }, { passive: false })

      // Fix iOS input zoom
      const inputs = document.querySelectorAll('input, textarea, select')
      inputs.forEach(input => {
        input.addEventListener('focus', () => {
          document.body.style.zoom = '1'
        })
      })
    }

    return () => {
      document.documentElement.classList.remove('ios-safari')
    }
  }, [])

  return null // This component doesn't render anything
}