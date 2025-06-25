"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function TestPage() {
  const [count, setCount] = useState(0)
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Simple Test Page</h1>
      <p>If you can see this, Next.js routing is working!</p>
      
      <div className="p-4 border rounded bg-white dark:bg-slate-800">
        <h2 className="text-xl font-semibold mb-4">Counter Test</h2>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setCount(count - 1)}
          >
            Decrease
          </Button>
          <span className="text-2xl font-bold">{count}</span>
          <Button 
            variant="default" 
            onClick={() => setCount(count + 1)}
          >
            Increase
          </Button>
        </div>
      </div>
    </div>
  )
}