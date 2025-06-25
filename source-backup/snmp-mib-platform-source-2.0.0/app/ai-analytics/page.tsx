"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Target,
  Lightbulb,
  Activity,
  BarChart3,
  Zap,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Settings,
} from "lucide-react"

export default function AIAnalyticsPage() {
  const [selectedModel, setSelectedModel] = useState("anomaly-detection")
  const [selectedTimeframe, setSelectedTimeframe] = useState("7d")

  // Mock AI analytics data
  const aiModels = [
    {
      id: "anomaly-detection",
      name: "Anomaly Detection",
      status: "active",
      accuracy: 94.2,
      lastTrained: "2024-01-20",
      predictions: 156,
      description: "Detects unusual network behavior patterns",
    },
    {
      id: "predictive-maintenance",
      name: "Predictive Maintenance",
      status: "active",
      accuracy: 89.7,
      lastTrained: "2024-01-18",
      predictions: 23,
      description: "Predicts device failures before they occur",
    },
    {
      id: "capacity-planning",
      name: "Capacity Planning",
      status: "training",
      accuracy: 91.5,
      lastTrained: "2024-01-15",
      predictions: 45,
      description: "Forecasts resource capacity requirements",
    },
    {
      id: "security-threat",
      name: "Security Threat Detection",
      status: "active",
      accuracy: 96.8,
      lastTrained: "2024-01-19",
      predictions: 78,
      description: "Identifies potential security threats and attacks",
    },
  ]

  const anomalies = [
    {
      id: 1,
      type: "performance",
      severity: "high",
      device: "Core-Switch-01",
      metric: "CPU Usage",
      value: 95,
      threshold: 80,
      confidence: 98.5,
      timestamp: "2024-01-20 15:30:00",
      status: "investigating",
      description: "Unusual CPU spike detected outside normal patterns",
    },
    {
      id: 2,
      type: "network",
      severity: "medium",
      device: "Router-DMZ-02",
      metric: "Packet Loss",
      value: 2.3,
      threshold: 1.0,
      confidence: 87.2,
      timestamp: "2024-01-20 14:45:00",
      status: "resolved",
      description: "Intermittent packet loss pattern detected",
    },
    {
      id: 3,
      type: "security",
      severity: "critical",
      device: "Firewall-Main",
      metric: "Connection Attempts",
      value: 1250,
      threshold: 500,
      confidence: 95.8,
      timestamp: "2024-01-20 13:20:00",
      status: "active",
      description: "Potential DDoS attack pattern identified",
    },
  ]

  const predictions = [
    {
      id: 1,
      type: "failure",
      device: "UPS-DataCenter-01",
      prediction: "Battery failure likely within 7 days",
      confidence: 92.3,
      timeframe: "7 days",
      impact: "high",
      recommendation: "Schedule battery replacement immediately",
      probability: 92,
    },
    {
      id: 2,
      type: "capacity",
      device: "Storage-Array-02",
      prediction: "Storage capacity will reach 90% in 30 days",
      confidence: 88.7,
      timeframe: "30 days",
      impact: "medium",
      recommendation: "Plan storage expansion or data archiving",
      probability: 89,
    },
    {
      id: 3,
      type: "performance",
      device: "Database-Server-01",
      prediction: "Memory upgrade needed within 14 days",
      confidence: 85.4,
      timeframe: "14 days",
      impact: "medium",
      recommendation: "Schedule memory upgrade during maintenance window",
      probability: 85,
    },
  ]

  const insights = [
    {
      id: 1,
      category: "optimization",
      title: "Network Traffic Optimization",
      description: "AI analysis suggests redistributing traffic across multiple paths could improve performance by 23%",
      impact: "Performance improvement: +23%",
      confidence: 91,
      actionable: true,
    },
    {
      id: 2,
      category: "cost",
      title: "Resource Consolidation Opportunity",
      description: "Several underutilized servers could be consolidated, saving approximately $15,000 annually",
      impact: "Cost savings: $15,000/year",
      confidence: 87,
      actionable: true,
    },
    {
      id: 3,
      category: "security",
      title: "Security Policy Enhancement",
      description: "Analysis of security events suggests implementing additional firewall rules for specific IP ranges",
      impact: "Security improvement: +35%",
      confidence: 94,
      actionable: true,
    },
  ]

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "training":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "inactive":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "performance":
        return <BarChart3 className="h-4 w-4 text-blue-500" />
      case "network":
        return <Activity className="h-4 w-4 text-green-500" />
      case "security":
        return <Shield className="h-4 w-4 text-red-500" />
      case "failure":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case "capacity":
        return <TrendingUp className="h-4 w-4 text-purple-500" />
      default:
        return <Eye className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8" />
            AI Analytics & Intelligence
          </h1>
          <p className="text-muted-foreground">Advanced AI-powered network analysis, predictions, and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Configure Models
          </Button>
        </div>
      </div>

      {/* AI Models Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {aiModels.map((model) => (
          <Card key={model.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{model.name}</CardTitle>
                {getStatusIcon(model.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Accuracy</span>
                  <span className="font-medium">{model.accuracy}%</span>
                </div>
                <Progress value={model.accuracy} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Predictions: {model.predictions}</span>
                  <span>Updated: {model.lastTrained}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="anomalies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="anomalies">Anomaly Detection</TabsTrigger>
          <TabsTrigger value="predictions">Predictive Analytics</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="models">Model Management</TabsTrigger>
        </TabsList>

        <TabsContent value="anomalies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Detected Anomalies
              </CardTitle>
              <CardDescription>AI-detected anomalies and unusual patterns in network behavior</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {anomalies.map((anomaly) => (
                  <div key={anomaly.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(anomaly.type)}
                        <div>
                          <h4 className="font-medium">{anomaly.device}</h4>
                          <p className="text-sm text-muted-foreground">{anomaly.metric}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(anomaly.severity)}>{anomaly.severity}</Badge>
                        <Badge variant="outline">{anomaly.status}</Badge>
                      </div>
                    </div>
                    <p className="text-sm mb-3">{anomaly.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Current Value:</span>
                        <p className="font-medium">{anomaly.value}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Threshold:</span>
                        <p className="font-medium">{anomaly.threshold}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Confidence:</span>
                        <p className="font-medium">{anomaly.confidence}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Detected:</span>
                        <p className="font-medium">{anomaly.timestamp}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Predictive Analytics
              </CardTitle>
              <CardDescription>AI-powered predictions for proactive network management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictions.map((prediction) => (
                  <div key={prediction.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(prediction.type)}
                        <div>
                          <h4 className="font-medium">{prediction.device}</h4>
                          <p className="text-sm text-muted-foreground">{prediction.timeframe}</p>
                        </div>
                      </div>
                      <Badge className={getSeverityColor(prediction.impact)}>{prediction.impact} impact</Badge>
                    </div>
                    <p className="text-sm mb-3">{prediction.prediction}</p>
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Confidence Level</span>
                        <span>{prediction.confidence}%</span>
                      </div>
                      <Progress value={prediction.confidence} className="h-2" />
                    </div>
                    <div className="bg-blue-50 p-3 rounded-md">
                      <p className="text-sm">
                        <Lightbulb className="inline h-4 w-4 mr-1" />
                        <strong>Recommendation:</strong> {prediction.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                AI-Generated Insights
              </CardTitle>
              <CardDescription>Intelligent recommendations for network optimization and improvement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.map((insight) => (
                  <div key={insight.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium">{insight.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{insight.category}</Badge>
                        {insight.actionable && <Badge className="bg-green-100 text-green-800">Actionable</Badge>}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium text-green-600">{insight.impact}</span>
                        <span className="text-muted-foreground ml-2">(Confidence: {insight.confidence}%)</span>
                      </div>
                      {insight.actionable && (
                        <Button size="sm">
                          <Zap className="h-4 w-4 mr-1" />
                          Implement
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Model Management
              </CardTitle>
              <CardDescription>Configure and manage AI models for network analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiModels.map((model) => (
                  <div key={model.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(model.status)}
                        <div>
                          <h4 className="font-medium">{model.name}</h4>
                          <p className="text-sm text-muted-foreground">{model.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          Configure
                        </Button>
                        <Button variant="outline" size="sm">
                          Retrain
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <p className="font-medium capitalize">{model.status}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Accuracy:</span>
                        <p className="font-medium">{model.accuracy}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Predictions:</span>
                        <p className="font-medium">{model.predictions}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Trained:</span>
                        <p className="font-medium">{model.lastTrained}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
