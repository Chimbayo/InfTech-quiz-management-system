'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, AlertTriangle, BarChart3 } from 'lucide-react'

interface TestResult {
  quiz: {
    id: string
    title: string
    passingScore: number
    createdAt: string
  }
  rawData: {
    totalAttempts: number
    completedAttempts: number
    incompleteAttempts: number
    uniqueStudents: number
    attemptsWithTimeSpent: number
  }
  basicStatistics: {
    totalAttempts: number
    completedAttempts: number
    passedAttempts: number
    averageScore: number
  }
  enhancedStatistics: {
    totalAttempts: number
    completedAttempts: number
    incompleteAttempts: number
    uniqueStudents: number
    passedAttempts: number
    failedAttempts: number
    passRate: number
    averageScore: number
    highestScore: number
    lowestScore: number
    averageTimeSpent: number
  }
  comparison: {
    [key: string]: {
      basic: number
      enhanced: number
      match: boolean
    }
  }
  validation: {
    quizTitle: string
    totalAttempts: number
    completedAttempts: number
    uniqueUsers: number
    issues: string[]
  }
  summary: {
    allComparisonsMatch: boolean
    hasDataIssues: boolean
    dataQuality: string
  }
}

export function QuizStatsTester() {
  const [quizId, setQuizId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [error, setError] = useState('')

  const testQuizStats = async () => {
    if (!quizId.trim()) {
      setError('Please enter a quiz ID')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch(`/api/admin/test-quiz-stats?quizId=${encodeURIComponent(quizId)}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to test quiz statistics')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number): string => {
    if (!seconds || seconds === 0) return '0s'
    
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    } else {
      return `${remainingSeconds}s`
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Quiz Statistics Tester
          </CardTitle>
          <CardDescription>
            Test and validate quiz statistics calculations for accuracy and data integrity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Enter Quiz ID to test..."
              value={quizId}
              onChange={(e) => setQuizId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && testQuizStats()}
            />
            <Button 
              onClick={testQuizStats} 
              disabled={loading}
              className="btn-inftech-primary"
            >
              {loading ? 'Testing...' : 'Test Statistics'}
            </Button>
          </div>
          
          {error && (
            <Alert className="mt-4 border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6">
          {/* Quiz Info */}
          <Card>
            <CardHeader>
              <CardTitle>Quiz Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Title</div>
                  <div className="font-medium">{result.quiz.title}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Passing Score</div>
                  <div className="font-medium">{result.quiz.passingScore}%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Created</div>
                  <div className="font-medium">{new Date(result.quiz.createdAt).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Data Quality</div>
                  <Badge variant={result.summary.dataQuality === 'Good' ? 'default' : 'destructive'}>
                    {result.summary.dataQuality}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Status */}
          <Card>
            <CardHeader>
              <CardTitle>Test Results Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  {result.summary.allComparisonsMatch ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <div className="font-medium">Statistics Match</div>
                    <div className="text-sm text-gray-600">
                      {result.summary.allComparisonsMatch ? 'All calculations match' : 'Discrepancies found'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {!result.summary.hasDataIssues ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  )}
                  <div>
                    <div className="font-medium">Data Integrity</div>
                    <div className="text-sm text-gray-600">
                      {!result.summary.hasDataIssues ? 'No issues found' : `${result.validation.issues.length} issues`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Enhanced Stats</div>
                    <div className="text-sm text-gray-600">
                      {result.enhancedStatistics.uniqueStudents} unique students
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Raw Data */}
          <Card>
            <CardHeader>
              <CardTitle>Raw Data Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{result.rawData.totalAttempts}</div>
                  <div className="text-sm text-gray-600">Total Attempts</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{result.rawData.completedAttempts}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{result.rawData.incompleteAttempts}</div>
                  <div className="text-sm text-gray-600">Incomplete</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{result.rawData.uniqueStudents}</div>
                  <div className="text-sm text-gray-600">Unique Students</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-indigo-600">{result.rawData.attemptsWithTimeSpent}</div>
                  <div className="text-sm text-gray-600">With Time Data</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Enhanced Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-lg font-bold">{result.enhancedStatistics.averageScore}%</div>
                  <div className="text-sm text-gray-600">Average Score</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{result.enhancedStatistics.passRate}%</div>
                  <div className="text-sm text-gray-600">Pass Rate</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{result.enhancedStatistics.lowestScore}% - {result.enhancedStatistics.highestScore}%</div>
                  <div className="text-sm text-gray-600">Score Range</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{formatTime(result.enhancedStatistics.averageTimeSpent)}</div>
                  <div className="text-sm text-gray-600">Avg Time</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comparison Results */}
          <Card>
            <CardHeader>
              <CardTitle>Basic vs Enhanced Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(result.comparison).map(([key, comp]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm">Basic: {comp.basic}</span>
                      <span className="text-sm">Enhanced: {comp.enhanced}</span>
                      {comp.match ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Data Issues */}
          {result.validation.issues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Data Issues Found</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.validation.issues.map((issue, index) => (
                    <Alert key={index} className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">{issue}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
