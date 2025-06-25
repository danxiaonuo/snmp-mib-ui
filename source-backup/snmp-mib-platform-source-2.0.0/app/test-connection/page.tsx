'use client'

import { useState, useEffect } from 'react'

export default function TestConnectionPage() {
  const [backendStatus, setBackendStatus] = useState<string>('Loading...')
  const [frontendStatus, setFrontendStatus] = useState<string>('Loading...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Test backend connection
    fetch('/api/test-backend')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBackendStatus(`Connected: ${JSON.stringify(data.backendStatus)}`)
        } else {
          setBackendStatus(`Failed: ${data.error}`)
        }
      })
      .catch(err => {
        setBackendStatus(`Error: ${err.message}`)
        setError(err.message)
      })

    // Test frontend health
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setFrontendStatus(`Status: ${data.status}, Version: ${data.version}`)
      })
      .catch(err => {
        setFrontendStatus(`Error: ${err.message}`)
      })
  }, [])

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Connection Test Page</h1>
      
      {error && (
        <div style={{ color: 'red', padding: '1rem', border: '1px solid red', marginBottom: '1rem' }}>
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      )}
      
      <div style={{ marginBottom: '2rem' }}>
        <h2>Frontend Status</h2>
        <pre>{frontendStatus}</pre>
      </div>
      
      <div>
        <h2>Backend Connection</h2>
        <pre>{backendStatus}</pre>
      </div>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>Environment Variables</h2>
        <ul>
          <li>NEXT_PUBLIC_API_URL: {process.env.NEXT_PUBLIC_API_URL || 'Not set'}</li>
          <li>NEXT_PUBLIC_BACKEND_URL: {process.env.NEXT_PUBLIC_BACKEND_URL || 'Not set'}</li>
          <li>NEXT_PUBLIC_BACKEND_BASE_URL: {process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'Not set'}</li>
        </ul>
      </div>
    </div>
  )
}