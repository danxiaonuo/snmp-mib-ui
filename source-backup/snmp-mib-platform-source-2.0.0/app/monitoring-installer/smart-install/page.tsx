"use client"

export const dynamic = 'force-dynamic'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SmartInstallPage() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>智能安装</CardTitle>
          <CardDescription>
            智能安装功能正在开发中
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>该功能将提供自动化的监控组件安装能力。</p>
        </CardContent>
      </Card>
    </div>
  )
}