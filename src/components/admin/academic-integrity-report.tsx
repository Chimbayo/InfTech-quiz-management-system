'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  AlertTriangle, 
  TrendingDown, 
  Users, 
  Clock,
  FileText,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react'

interface IntegrityReportData {
  summary: {
    totalViolations: number
    highSeverityViolations: number
    mediumSeverityViolations: number
    lowSeverityViolations: number
    resolvedViolations: number
    uniqueUsers: number
    uniqueQuizzes: number
    timeRange: number
  }
  integrityScore: {
    score: number
    level: string
    description: string
  }
  suspiciousActivities: Array<{
    id: string
    type: string
    severity: string
    description: string
    evidence: any
    timestamp: string
    resolved: boolean
    user: {
      id: string
      name: string
      email: string
      role: string
    }
    room: {
      id: string
      name: string
      type: string
      quiz?: {
        id: string
        title: string
      }
    }
    message?: {
      id: string
      content: string
      createdAt: string
    }
  }>
  patternAnalysis: {
    violationsByType: Array<{ type: string, count: number }>
    hourlyDistribution: Record<string, { total: number, high: number, medium: number, low: number }>
    repeatOffenders: Array<{
      userId: string
      violationCount: number
      user: {
        id: string
        name: string
        email: string
        role: string
      }
    }>
  }
  userRiskAssessment: Array<{
    user: {
      id: string
      name: string
      email: string
      role: string
    }
    violations: {
      high: number
      medium: number
      low: number
      total: number
    }
    riskScore: number
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  }>
  quizAnalysis?: {
    quizTitle: string
    totalAttempts: number
    totalViolations: number
    compromisedAttempts: number
    integrityScore: number
    violationsByType: Record<string, number>
  }
  recommendations: string[]
}

export function AcademicIntegrityReport() {
  const [data, setData] = useState<IntegrityReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')
  const [selectedQuiz, setSelectedQuiz] = useState<string>('all')
  const [quizzes, setQuizzes] = useState<Array<{id: string, title: string}>>([])

  useEffect(() => {
    fetchQuizzes()
    generateReport()
  }, [])

  useEffect(() => {
    generateReport()
  }, [timeRange, selectedQuiz])

  const fetchQuizzes = async () => {
    try {
      const response = await fetch('/api/quizzes?role=admin')
      if (response.ok) {
        const quizzesData = await response.json()
        setQuizzes(quizzesData)
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error)
    }
  }

  const generateReport = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        timeRange,
        ...(selectedQuiz && selectedQuiz !== 'all' && { quizId: selectedQuiz })
      })
      
      const response = await fetch(`/api/reports/academic-integrity?${params}`)
      if (response.ok) {
        const reportData = await response.json()
        setData(reportData)
      }
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 75) return 'text-blue-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreBackground = (score: number) => {
    if (score >= 90) return 'bg-green-100'
    if (score >= 75) return 'bg-blue-100'
    if (score >= 60) return 'bg-yellow-100'
    if (score >= 40) return 'bg-orange-100'
    return 'bg-red-100'
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'bg-red-100 text-red-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Generating integrity report...</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to generate report</p>
        <Button onClick={generateReport} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Integrity Report</h1>
          <p className="text-gray-600">Comprehensive analysis of academic integrity violations</p>
        </div>
        
        <div className="flex gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedQuiz} onValueChange={setSelectedQuiz}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Quizzes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Quizzes</SelectItem>
              {quizzes.map(quiz => (
                <SelectItem key={quiz.id} value={quiz.id}>{quiz.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={generateReport} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Integrity Score */}
      <Card className={`${getScoreBackground(data.integrityScore.score)} border-2`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-2">Overall Integrity Score</h2>
              <p className="text-sm text-gray-600 mb-4">{data.integrityScore.description}</p>
              <Badge className={getRiskColor(data.integrityScore.level)}>
                {data.integrityScore.level}
              </Badge>
            </div>
            <div className="text-center">
              <div className={`text-6xl font-bold ${getScoreColor(data.integrityScore.score)}`}>
                {data.integrityScore.score}
              </div>
              <div className="text-sm text-gray-600">out of 100</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Violations</p>
                <p className="text-3xl font-bold">{data.summary.totalViolations}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Severity</p>
                <p className="text-3xl font-bold text-red-600">{data.summary.highSeverityViolations}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Affected Users</p>
                <p className="text-3xl font-bold text-orange-600">{data.summary.uniqueUsers}</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-3xl font-bold text-green-600">{data.summary.resolvedViolations}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quiz-Specific Analysis */}
      {data.quizAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle>Quiz-Specific Analysis: {data.quizAnalysis.quizTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Attempts</p>
                <p className="text-2xl font-bold text-blue-600">{data.quizAnalysis.totalAttempts}</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">Compromised Attempts</p>
                <p className="text-2xl font-bold text-red-600">{data.quizAnalysis.compromisedAttempts}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Quiz Integrity</p>
                <p className="text-2xl font-bold text-green-600">{Math.round(data.quizAnalysis.integrityScore)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            High-Risk Users
          </CardTitle>
          <CardDescription>
            Users with elevated academic integrity concerns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.userRiskAssessment.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600">No high-risk users identified</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.userRiskAssessment.slice(0, 10).map((assessment) => (
                <div key={assessment.user.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{assessment.user.name}</h4>
                      <p className="text-sm text-gray-600">{assessment.user.email}</p>
                    </div>
                    <Badge className={getRiskColor(assessment.riskLevel)}>
                      {assessment.riskLevel} RISK
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">High Severity</p>
                      <p className="font-semibold text-red-600">{assessment.violations.high}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Medium Severity</p>
                      <p className="font-semibold text-yellow-600">{assessment.violations.medium}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Low Severity</p>
                      <p className="font-semibold text-blue-600">{assessment.violations.low}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Risk Score</p>
                      <p className="font-semibold">{assessment.riskScore}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Violation Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Violations by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.patternAnalysis.violationsByType.map((violation) => (
                <div key={violation.type} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{violation.type.replace('_', ' ')}</span>
                  <Badge variant="outline">{violation.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Repeat Offenders</CardTitle>
          </CardHeader>
          <CardContent>
            {data.patternAnalysis.repeatOffenders.length === 0 ? (
              <p className="text-gray-600 text-center py-4">No repeat offenders identified</p>
            ) : (
              <div className="space-y-3">
                {data.patternAnalysis.repeatOffenders.map((offender) => (
                  <div key={offender.userId} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{offender.user.name}</p>
                      <p className="text-xs text-gray-600">{offender.user.email}</p>
                    </div>
                    <Badge variant="destructive">{offender.violationCount} violations</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recommendations
          </CardTitle>
          <CardDescription>
            Suggested actions to improve academic integrity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.recommendations.length === 0 ? (
            <p className="text-gray-600">No specific recommendations at this time</p>
          ) : (
            <div className="space-y-3">
              {data.recommendations.map((recommendation, index) => (
                <Alert key={index}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{recommendation}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Violations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Violations
          </CardTitle>
          <CardDescription>
            Latest academic integrity concerns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.suspiciousActivities.slice(0, 10).map((activity) => (
              <div key={activity.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge className={getSeverityColor(activity.severity)}>
                      {activity.severity}
                    </Badge>
                    <span className="font-medium">{activity.type.replace('_', ' ')}</span>
                    {activity.resolved && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Resolved
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </span>
                </div>
                
                <p className="text-sm text-gray-700 mb-2">{activity.description}</p>
                
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>User: {activity.user.name}</span>
                  <span>Room: {activity.room.name}</span>
                </div>
                
                {activity.message && (
                  <details className="mt-2">
                    <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                      View Message
                    </summary>
                    <div className="text-xs bg-gray-50 p-2 rounded mt-1">
                      {activity.message.content}
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
