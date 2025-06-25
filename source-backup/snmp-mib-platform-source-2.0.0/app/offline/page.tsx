"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WifiOff, RefreshCw, Home, Activity } from "lucide-react"
import Link from "next/link"

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    // Check initial status
    updateOnlineStatus()

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  const handleRetry = async () => {
    setIsRetrying(true)
    
    try {
      // Try to fetch a simple endpoint to test connectivity
      const response = await fetch('/api/health', { 
        method: 'GET',
        cache: 'no-cache'
      })
      
      if (response.ok) {
        // If successful, redirect to home
        window.location.href = '/'
      } else {
        throw new Error('Network test failed')
      }
    } catch (error) {
      console.log('Still offline:', error)
      // Show user that we're still offline
      setTimeout(() => setIsRetrying(false), 1000)
    }
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
            <WifiOff className="w-8 h-8 text-slate-600 dark:text-slate-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            You're Offline
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            {isOnline 
              ? "Connection restored! You can now access the platform."
              : "Please check your internet connection and try again."
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-center space-x-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
            <Activity className={`w-4 h-4 ${isOnline ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`text-sm font-medium ${isOnline ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
              {isOnline ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleRetry} 
              disabled={isRetrying}
              className="w-full"
              variant={isOnline ? "default" : "outline"}
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Checking Connection...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {isOnline ? 'Go to Dashboard' : 'Retry Connection'}
                </>
              )}
            </Button>

            <Button 
              onClick={handleGoHome}
              variant="ghost" 
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              Try Homepage
            </Button>
          </div>

          {/* Offline Features */}
          {!isOnline && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Available Offline:
              </h3>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Cached dashboard data</li>
                <li>• Previously viewed device information</li>
                <li>• Offline documentation</li>
                <li>• Basic navigation</li>
              </ul>
            </div>
          )}

          {/* Tips */}
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <h4 className="text-xs font-semibold text-amber-900 dark:text-amber-100 mb-1">
              Troubleshooting Tips:
            </h4>
            <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
              <li>• Check your WiFi or mobile data</li>
              <li>• Try refreshing the page</li>
              <li>• Clear browser cache if issues persist</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}