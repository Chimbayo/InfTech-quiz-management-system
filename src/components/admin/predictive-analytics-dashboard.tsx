'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  AlertTriangle,
  Target,
  MessageSquare,
  BookOpen,
  UserCheck,
  Clock,
  Lightbulb
} from 'lucide-react'

interface PredictiveData {
  predictions: Array<{
    student: {
      id: string
      name: string
      email: string
    }
    metrics: {
      chatEngagement: {
        totalMessages: number
        engagementScore: number
        engagementFrequency: number
        diversityScore: number
      }
      performanceMetrics: {
        totalAttempts: number
        averageScore: number
        passRate: number
        improvementTrend: number
        consistencyScore: number
        recentPerformance: number
      }
      studyGroupParticipation: {
        activeGroups: number
        participationScore: number
        hasStudyGroups: boolean
      }
    }
    predictions: {
      successProbability: number
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
      nextQuizSuccessRate: number
    }
    riskFactors: Array<{
      type: string
      severity: string
      description: string
      value: number
    }>
    interventions: Array<{
      type: string
      priority: string
      action: string
      description: string
    }>
  }>
  cohortInsights: {
    performanceDistribution: {
      excellent: number
      good: number
      average: number
      belowAverage: number
    }
    engagementPatterns: {
      highEngagement: number
      moderateEngagement: number
      lowEngagement: number
    }
    correlation: {
      chatEngagementVsPerformance: number
      strength: string
    }
    trends: {
      averageImprovement: number
      studyGroupParticipation: number
    }
  }
  earlyWarnings: Array<{
    type: string
    severity: string
    count: number
    message: string
    students: string[]
  }>
  summary: {
    totalStudents: number
    highRiskStudents: number
    mediumRiskStudents: number
    lowRiskStudents: number
    averageSuccessProbability: number
  }
}

export function PredictiveAnalyticsDashboard() {
  const [data, setData] = useState<PredictiveData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('90')
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('ALL')

  useEffect(() => {
    fetchPredictiveData()
  }, [timeRange])

  const fetchPredictiveData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/analytics/predictive?timeRange=${timeRange}`)
      if (response.ok) {
        const analyticsData = await response.json()
        setData(analyticsData)
      }
    } catch (error) {
      console.error('Error fetching predictive analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-500'
      case 'MEDIUM': return 'bg-yellow-500'
      case 'LOW': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getSuccessProbabilityColor = (probability: number) => {
    if (probability >= 75) return 'text-green-600'
    if (probability >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const filteredPredictions = data?.predictions.filter(prediction => 
    selectedRiskLevel === 'ALL' || prediction.predictions.riskLevel === selectedRiskLevel
  ) || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Analyzing student data...</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load predictive analytics</p>
        <Button onClick={fetchPredictiveData} className="mt-4">Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Predictive Analytics Dashboard</h1>
          <p className="text-gray-600">AI-powered insights for student success prediction</p>
        </div>
        
        <div className="flex gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="180">Last 6 months</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedRiskLevel} onValueChange={setSelectedRiskLevel}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Students</SelectItem>
              <SelectItem value="HIGH">High Risk</SelectItem>
              <SelectItem value="MEDIUM">Medium Risk</SelectItem>
              <SelectItem value="LOW">Low Risk</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Early Warnings */}
      {data.earlyWarnings.length > 0 && (
        <div className="space-y-3">
          {data.earlyWarnings.map((warning, index) => (
            <Alert key={index} className={warning.severity === 'HIGH' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{warning.message}</strong>
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-blue-600 hover:underline">
                    View affected students
                  </summary>
                  <div className="mt-1 text-sm">
                    {warning.students.join(', ')}
                  </div>
                </details>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-3xl font-bold">{data.summary.totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Risk</p>
                <p className="text-3xl font-bold text-red-600">{data.summary.highRiskStudents}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Medium Risk</p>
                <p className="text-3xl font-bold text-yellow-600">{data.summary.mediumRiskStudents}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Risk</p>
                <p className="text-3xl font-bold text-green-600">{data.summary.lowRiskStudents}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Success Rate</p>
                <p className="text-3xl font-bold text-purple-600">{Math.round(data.summary.averageSuccessProbability)}%</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cohort Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Excellent (90%+)</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(data.cohortInsights.performanceDistribution.excellent / data.summary.totalStudents) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{data.cohortInsights.performanceDistribution.excellent}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Good (80-89%)</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(data.cohortInsights.performanceDistribution.good / data.summary.totalStudents) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{data.cohortInsights.performanceDistribution.good}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Average (70-79%)</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ width: `${(data.cohortInsights.performanceDistribution.average / data.summary.totalStudents) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{data.cohortInsights.performanceDistribution.average}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Below Average (&lt;70%)</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${(data.cohortInsights.performanceDistribution.belowAverage / data.summary.totalStudents) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{data.cohortInsights.performanceDistribution.belowAverage}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Engagement Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Chat-Performance Correlation</p>
                <p className="text-2xl font-bold text-blue-600">
                  {(data.cohortInsights.correlation.chatEngagementVsPerformance * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-gray-500">{data.cohortInsights.correlation.strength} correlation</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-gray-600">Study Group Participation</p>
                  <p className="text-lg font-bold text-green-600">
                    {Math.round(data.cohortInsights.trends.studyGroupParticipation * 100)}%
                  </p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-gray-600">Avg Improvement</p>
                  <p className="text-lg font-bold text-purple-600">
                    {data.cohortInsights.trends.averageImprovement > 0 ? '+' : ''}
                    {data.cohortInsights.trends.averageImprovement.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Predictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Student Success Predictions
          </CardTitle>
          <CardDescription>
            AI-powered analysis of individual student success probability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPredictions.slice(0, 20).map((prediction) => (
              <div key={prediction.student.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold">{prediction.student.name}</h4>
                    <p className="text-sm text-gray-600">{prediction.student.email}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getRiskColor(prediction.predictions.riskLevel)}>
                      {prediction.predictions.riskLevel} RISK
                    </Badge>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${getSuccessProbabilityColor(prediction.predictions.successProbability)}`}>
                        {prediction.predictions.successProbability}%
                      </p>
                      <p className="text-xs text-gray-500">Success Rate</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Quiz Performance</p>
                    <p className="text-lg font-bold">{prediction.metrics.performanceMetrics.averageScore.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">
                      {prediction.metrics.performanceMetrics.totalAttempts} attempts
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Chat Engagement</p>
                    <p className="text-lg font-bold">{Math.round(prediction.metrics.chatEngagement.engagementScore)}</p>
                    <p className="text-xs text-gray-500">
                      {prediction.metrics.chatEngagement.totalMessages} messages
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Next Quiz Prediction</p>
                    <p className="text-lg font-bold">{prediction.predictions.nextQuizSuccessRate}%</p>
                    <p className="text-xs text-gray-500">Expected score</p>
                  </div>
                </div>

                {/* Risk Factors */}
                {prediction.riskFactors.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-sm font-semibold mb-2">Risk Factors:</h5>
                    <div className="flex flex-wrap gap-2">
                      {prediction.riskFactors.map((factor, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {factor.description}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interventions */}
                {prediction.interventions.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold mb-2 flex items-center gap-1">
                      <Lightbulb className="h-4 w-4" />
                      Recommended Interventions:
                    </h5>
                    <div className="space-y-2">
                      {prediction.interventions.map((intervention, index) => (
                        <div key={index} className="flex items-start space-x-2 text-sm">
                          <div className={`w-2 h-2 rounded-full mt-2 ${getPriorityColor(intervention.priority)}`}></div>
                          <div>
                            <p className="font-medium">{intervention.action}</p>
                            <p className="text-gray-600 text-xs">{intervention.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
