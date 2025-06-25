"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area } from "recharts"
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Shield,
  Cpu,
  Activity,
  Lightbulb,
  CheckCircle,
  Clock,
  Zap,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Mock data for AI analysis
const anomalyData = [
  { time: "00:00", normal: 85, anomaly: 92, threshold: 90 },
  { time: "04:00", normal: 78, anomaly: 88, threshold: 90 },
  { time: "08:00", normal: 95, anomaly: 105, threshold: 90 },
  { time: "12:00", normal: 88, anomaly: 94, threshold: 90 },
  { time: "16:00", normal: 82, anomaly: 89, threshold: 90 },
  { time: "20:00", normal: 76, anomaly: 85, threshold: 90 },
]

const predictiveData = [
  { time: "Week 1", actual: 85, predicted: 87, confidence: 95 },
  { time: "Week 2", actual: 88, predicted: 89, confidence: 93 },
  { time: "Week 3", actual: 92, predicted: 91, confidence: 91 },
  { time: "Week 4", actual: 0, predicted: 94, confidence: 88 },
  { time: "Week 5", actual: 0, predicted: 97, confidence: 85 },
  { time: "Week 6", actual: 0, predicted: 99, confidence: 82 },
]

const aiModels = [
  {
    id: "anomaly-detection",
    name: "Anomaly Detection",
    type: "Isolation Forest + LSTM",
    accuracy: 94.2,
    status: "active",
    lastTrained: "2 hours ago",
    icon: AlertTriangle,
    description: "Detects unusual patterns in network behavior",
  },
  {
    id: "predictive-maintenance",
    name: "Predictive Maintenance",
    type: "Random Forest + Time Series",
    accuracy: 91.8,
    status: "active",
    lastTrained: "6 hours ago",
    icon: TrendingUp,
    description: "Predicts equipment failures before they occur",
  },
  {
    id: "capacity-planning",
    name: "Capacity Planning",
    type: "ARIMA + Neural Networks",
    accuracy: 89.5,
    status: "training",
    lastTrained: "1 day ago",
    icon: Cpu,
    description: "Forecasts resource capacity requirements",
  },
  {
    id: "security-threat",
    name: "Security Threat Detection",
    type: "XGBoost + Deep Learning",
    accuracy: 96.7,
    status: "active",
    lastTrained: "4 hours ago",
    icon: Shield,
    description: "Identifies potential security threats and vulnerabilities",
  },
]

const insights = [
  {
    id: 1,
    type: "critical",
    title: "Bandwidth Anomaly Detected",
    description: "Router R-Core-01 showing 340% increase in traffic patterns during off-peak hours",
    confidence: 97,
    recommendation: "Investigate potential DDoS attack or unauthorized traffic. Consider implementing rate limiting.",
    impact: "High",
    device: "R-Core-01",
    timestamp: "2024-01-27 14:30:00",
  },
  {
    id: 2,
    type: "warning",
    title: "Predictive Maintenance Alert",
    description: "Switch SW-Access-15 showing degraded performance indicators suggesting failure within 72 hours",
    confidence: 84,
    recommendation: "Schedule maintenance window for component replacement. Prepare backup switch.",
    impact: "Medium",
    device: "SW-Access-15",
    timestamp: "2024-01-27 13:45:00",
  },
  {
    id: 3,
    type: "info",
    title: "Capacity Optimization Opportunity",
    description: "Network utilization analysis suggests 23% improvement possible with load balancing optimization",
    confidence: 91,
    recommendation: "Implement automated load balancing on core routers. Redistribute traffic across available paths.",
    impact: "Low",
    device: "Network-Wide",
    timestamp: "2024-01-27 12:15:00",
  },
]

export default function IntelligentAnalysisPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (isAnalyzing) {
      const interval = setInterval(() => {
        setAnalysisProgress((prev) => {
          if (prev >= 100) {
            setIsAnalyzing(false)
            toast({
              title: "Analysis Complete",
              description: "AI analysis has been completed successfully.",
            })
            return 0
          }
          return prev + 10
        })
      }, 500)
      return () => clearInterval(interval)
    }
  }, [isAnalyzing, toast])

  const startAnalysis = () => {
    setIsAnalyzing(true)
    setAnalysisProgress(0)
    toast({
      title: "Analysis Started",
      description: "Running comprehensive AI analysis on network data...",
    })
  }

  const retrainModel = (modelId: string) => {
    toast({
      title: "Model Retraining",
      description: `Retraining ${modelId} model with latest data...`,
    })
  }

  const implementRecommendation = (insightId: number) => {
    toast({
      title: "Recommendation Implemented",
      description: "The recommended action has been queued for implementation.",
    })
  }

  const getSeverityColor = (type: string) => {
    switch (type) {
      case "critical":
        return "border-l-red-500 bg-red-50"
      case "warning":
        return "border-l-yellow-500 bg-yellow-50"
      case "info":
        return "border-l-blue-500 bg-blue-50"
      default:
        return "border-l-gray-500 bg-gray-50"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "training":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8" />
            Intelligent Analysis
          </h1>
          <p className="text-muted-foreground">
            AI-powered insights and predictive analytics for your network infrastructure
          </p>
        </div>
        <Button onClick={startAnalysis} disabled={isAnalyzing} className="gap-2">
          <Brain className="h-4 w-4" />
          {isAnalyzing ? "Analyzing..." : "Run Deep Analysis"}
        </Button>
      </div>

      {isAnalyzing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Running AI Analysis</span>
                <span>{analysisProgress}%</span>
              </div>
              <Progress value={analysisProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Analyzing network patterns, detecting anomalies, and generating predictions...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="anomalies">Anomaly Detection</TabsTrigger>
          <TabsTrigger value="predictions">Predictive Analysis</TabsTrigger>
          <TabsTrigger value="models">AI Models</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            {insights.map((insight) => (
              <Alert key={insight.id} className={`border-l-4 ${getSeverityColor(insight.type)}`}>
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      <h4 className="font-semibold">{insight.title}</h4>
                      <Badge
                        variant={
                          insight.type === "critical"
                            ? "destructive"
                            : insight.type === "warning"
                              ? "secondary"
                              : "default"
                        }
                      >
                        {insight.impact} Impact
                      </Badge>
                    </div>
                    <AlertDescription className="text-sm">{insight.description}</AlertDescription>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Device:</span>
                        <p className="font-medium">{insight.device}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Confidence:</span>
                        <p className="font-medium">{insight.confidence}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Detected:</span>
                        <p className="font-medium">{insight.timestamp}</p>
                      </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-md border-l-2 border-l-blue-200">
                      <p className="text-sm">
                        <strong>Recommendation:</strong> {insight.recommendation}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => implementRecommendation(insight.id)} className="gap-1">
                        <Zap className="h-3 w-3" />
                        Implement
                      </Button>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Real-time Anomaly Detection
              </CardTitle>
              <CardDescription>AI-powered detection of unusual patterns in network behavior</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  normal: { label: "Normal Behavior", color: "hsl(var(--chart-1))" },
                  anomaly: { label: "Detected Anomaly", color: "hsl(var(--chart-2))" },
                  threshold: { label: "Alert Threshold", color: "hsl(var(--chart-3))" },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={anomalyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="normal" stroke="var(--color-normal)" strokeWidth={2} />
                    <Line
                      type="monotone"
                      dataKey="anomaly"
                      stroke="var(--color-anomaly)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                    <Line
                      type="monotone"
                      dataKey="threshold"
                      stroke="var(--color-threshold)"
                      strokeWidth={1}
                      strokeDasharray="2 2"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Predictive Analysis
              </CardTitle>
              <CardDescription>
                Machine learning predictions for network performance and capacity planning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  actual: { label: "Actual Values", color: "hsl(var(--chart-1))" },
                  predicted: { label: "Predicted Values", color: "hsl(var(--chart-2))" },
                  confidence: { label: "Confidence Band", color: "hsl(var(--chart-3))" },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={predictiveData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="confidence"
                      stackId="1"
                      stroke="var(--color-confidence)"
                      fill="var(--color-confidence)"
                      fillOpacity={0.3}
                    />
                    <Line type="monotone" dataKey="actual" stroke="var(--color-actual)" strokeWidth={2} />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="var(--color-predicted)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {aiModels.map((model) => {
              const IconComponent = model.icon
              return (
                <Card
                  key={model.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedModel === model.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedModel(model.id)}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      {model.name}
                    </CardTitle>
                    {getStatusIcon(model.status)}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-xs text-muted-foreground">{model.description}</div>
                      <div className="text-xs font-mono bg-muted p-2 rounded">{model.type}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Accuracy</span>
                        <span className="font-semibold">{model.accuracy}%</span>
                      </div>
                      <Progress value={model.accuracy} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Last trained: {model.lastTrained}</span>
                        <Badge variant={model.status === "active" ? "default" : "secondary"}>{model.status}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            retrainModel(model.id)
                          }}
                        >
                          Retrain
                        </Button>
                        <Button size="sm" variant="outline">
                          Configure
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
