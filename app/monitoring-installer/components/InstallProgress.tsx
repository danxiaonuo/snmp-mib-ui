'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download, 
  Play, 
  Square, 
  RefreshCw,
  Terminal,
  AlertTriangle,
  ExternalLink
} from 'lucide-react'

interface InstallStep {
  id: string
  name: string
  description: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  startTime?: Date
  endTime?: Date
  output?: string[]
  error?: string
}

interface ServiceStatus {
  name: string
  status: 'running' | 'stopped' | 'error' | 'unknown'
  containerId?: string
  ports?: string[]
  uptime?: string
  health?: 'healthy' | 'unhealthy' | 'unknown'
}

interface InstallProgressProps {
  isInstalling: boolean
  components: string[]
  onInstall: () => void
  onCancel: () => void
  onRetry: () => void
}

const InstallProgress: React.FC<InstallProgressProps> = ({
  isInstalling,
  components,
  onInstall,
  onCancel,
  onRetry
}) => {
  const [steps, setSteps] = useState<InstallStep[]>([])
  const [currentStep, setCurrentStep] = useState<string | null>(null)
  const [overallProgress, setOverallProgress] = useState(0)
  const [installOutput, setInstallOutput] = useState<string[]>([])
  const [serviceStatuses, setServiceStatuses] = useState<ServiceStatus[]>([])
  const [showOutput, setShowOutput] = useState(false)
  const [estimatedTime, setEstimatedTime] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)

  // Initialize installation steps
  useEffect(() => {
    if (components.length > 0) {
      const initialSteps: InstallStep[] = [
        {
          id: 'check-environment',
          name: 'Environment Check',
          description: 'Check if Docker and Docker Compose are available',
          status: 'pending'
        },
        {
          id: 'create-network',
          name: 'Create Network',
          description: 'Create dedicated network for monitoring components',
          status: 'pending'
        },
        ...components.map(component => ({
          id: `install-${component}`,
          name: `Install ${component}`,
          description: `Download and start ${component} service`,
          status: 'pending' as const
        })),
        {
          id: 'verify-services',
          name: 'Verify Services',
          description: 'Check if all services are running normally',
          status: 'pending'
        }
      ]
      
      setSteps(initialSteps)
      setEstimatedTime(initialSteps.length * 30) // Estimate 30 seconds per step
    }
  }, [components])

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (isInstalling) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
    } else {
      setElapsedTime(0)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isInstalling])

  // Simulate installation process
  useEffect(() => {
    if (isInstalling && steps.length > 0) {
      simulateInstallation()
    }
  }, [isInstalling, steps.length])

  const simulateInstallation = async () => {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      
      // Start step
      setCurrentStep(step.id)
      updateStepStatus(step.id, 'running', { startTime: new Date() })
      addOutput(`Starting execution: ${step.name}`)
      
      try {
        // Simulate step execution
        await executeStep(step)
        
        // Complete step
        updateStepStatus(step.id, 'completed', { endTime: new Date() })
        addOutput(`✓ Completed: ${step.name}`)
        
        // Update progress
        setOverallProgress(((i + 1) / steps.length) * 100)
        
        // If it's an install component step, update service status
        if (step.id.startsWith('install-')) {
          const componentName = step.id.replace('install-', '')
          await updateServiceStatus(componentName)
        }
        
      } catch (error) {
        // Step failed
        const errorMessage = error instanceof Error ? error.message : String(error)
        updateStepStatus(step.id, 'failed', { 
          endTime: new Date(), 
          error: errorMessage 
        })
        addOutput(`✗ Failed: ${step.name} - ${errorMessage}`)
        break
      }
      
      // Delay between steps
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    setCurrentStep(null)
  }

  const executeStep = async (step: InstallStep): Promise<void> => {
    // Simulate execution time and possible errors for different steps
    const executionTime = Math.random() * 3000 + 1000 // 1-4秒
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate some steps may fail
        if (Math.random() < 0.1) { // 10% failure rate
          reject(new Error(`Simulation error: ${step.name} execution failed`))
        } else {
          resolve()
        }
      }, executionTime)
    })
  }

  const updateStepStatus = (stepId: string, status: InstallStep['status'], updates: Partial<InstallStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, ...updates }
        : step
    ))
  }

  const addOutput = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setInstallOutput(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const updateServiceStatus = async (componentName: string) => {
    // Simulate service status check
    const mockStatus: ServiceStatus = {
      name: componentName,
      status: Math.random() > 0.2 ? 'running' : 'error',
      containerId: `mock-${componentName}-${Math.random().toString(36).substr(2, 9)}`,
      ports: getDefaultPorts(componentName),
      uptime: 'Just started',
      health: Math.random() > 0.1 ? 'healthy' : 'unhealthy'
    }
    
    setServiceStatuses(prev => {
      const existing = prev.findIndex(s => s.name === componentName)
      if (existing >= 0) {
        const newStatuses = [...prev]
        newStatuses[existing] = mockStatus
        return newStatuses
      } else {
        return [...prev, mockStatus]
      }
    })
  }

  const getDefaultPorts = (componentName: string): string[] => {
    const portMap: Record<string, string[]> = {
      'node-exporter': ['9100:9100'],
      'categraf': ['9100:9100'],
      'vmagent': ['8429:8429'],
      'victoriametrics': ['8428:8428'],
      'grafana': ['3000:3000'],
      'alertmanager': ['9093:9093'],
      'snmp-exporter': ['9116:9116']
    }
    return portMap[componentName] || []
  }

  const getStepIcon = (status: InstallStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'running':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
      case 'skipped':
        return <Clock className="h-5 w-5 text-gray-400" />
      default:
        return <Clock className="h-5 w-5 text-gray-300" />
    }
  }

  const getStatusBadge = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-green-100 text-green-800">Running</Badge>
      case 'stopped':
        return <Badge className="bg-gray-100 text-gray-800">Stopped</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Unknown</Badge>
    }
  }

  const getHealthBadge = (health: ServiceStatus['health']) => {
    switch (health) {
      case 'healthy':
        return <Badge variant="outline" className="text-green-600 border-green-600">Healthy</Badge>
      case 'unhealthy':
        return <Badge variant="outline" className="text-red-600 border-red-600">Unhealthy</Badge>
      default:
        return <Badge variant="outline" className="text-gray-600 border-gray-600">Unknown</Badge>
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const completedSteps = steps.filter(step => step.status === 'completed').length
  const failedSteps = steps.filter(step => step.status === 'failed').length
  const hasErrors = failedSteps > 0
  const isCompleted = completedSteps === steps.length && !hasErrors

  return (
    <div className="space-y-6">
      {/* Overall progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Installation Progress</CardTitle>
              <CardDescription>
                {isInstalling ? 'Installing monitoring components...' : 
                 isCompleted ? 'Installation complete!' : 
                 hasErrors ? 'Installation encountered errors' : 'Ready to start installation'}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {Math.round(overallProgress)}%
              </div>
              <div className="text-sm text-gray-500">
                {isInstalling ? `Elapsed: ${formatTime(elapsedTime)}` : 
                 estimatedTime > 0 ? `Estimated: ${formatTime(estimatedTime)}` : ''}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={overallProgress} className="mb-4" />
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{completedSteps} / {steps.length} steps completed</span>
            <span>{components.length} components</span>
          </div>
          
          {hasErrors && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Errors encountered during installation, please check logs and retry.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Installation steps */}
      <Card>
        <CardHeader>
          <CardTitle>Installation Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  step.status === 'running' ? 'bg-blue-50 border border-blue-200' :
                  step.status === 'completed' ? 'bg-green-50' :
                  step.status === 'failed' ? 'bg-red-50' :
                  'bg-gray-50'
                }`}
              >
                <div className="flex-shrink-0">
                  {getStepIcon(step.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{step.name}</span>
                    {step.status === 'running' && (
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        In Progress
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{step.description}</p>
                  {step.error && (
                    <p className="text-sm text-red-600 mt-1">Error: {step.error}</p>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {step.startTime && step.endTime && (
                    <span>
                      {Math.round((step.endTime.getTime() - step.startTime.getTime()) / 1000)}s
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Service status */}
      {serviceStatuses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Service Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {serviceStatuses.map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="font-medium">{service.name}</div>
                    {getStatusBadge(service.status)}
                    {service.health && getHealthBadge(service.health)}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {service.ports && service.ports.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <span>Ports:</span>
                        {service.ports.map((port, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {port}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {service.uptime && (
                      <span>Uptime: {service.uptime}</span>
                    )}
                    {service.containerId && (
                      <span className="font-mono text-xs">
                        {service.containerId.substring(0, 12)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Installation logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Installation Logs</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOutput(!showOutput)}
            >
              <Terminal className="h-4 w-4 mr-1" />
              {showOutput ? 'Hide' : 'Show'} Logs
            </Button>
          </div>
        </CardHeader>
        {showOutput && (
          <CardContent>
            <ScrollArea className="h-64 w-full border rounded-lg p-3">
              <div className="space-y-1 font-mono text-sm">
                {installOutput.map((line, index) => (
                  <div key={index} className="text-gray-700">
                    {line}
                  </div>
                ))}
                {installOutput.length === 0 && (
                  <div className="text-gray-500 text-center py-8">
                    No log output yet
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        )}
      </Card>

      {/* Action buttons */}
      <div className="flex items-center justify-center space-x-4">
        {!isInstalling && !isCompleted && (
          <Button onClick={onInstall} className="px-8">
            <Play className="h-4 w-4 mr-2" />
            Start Installation
          </Button>
        )}
        
        {isInstalling && (
          <Button variant="outline" onClick={onCancel}>
            <Square className="h-4 w-4 mr-2" />
            Cancel Installation
          </Button>
        )}
        
        {hasErrors && (
          <Button onClick={onRetry} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Installation
          </Button>
        )}
        
        {isCompleted && (
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Installation Complete!</span>
            </div>
            <div className="text-sm text-gray-600">
              All components have been successfully installed and are running
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default InstallProgress