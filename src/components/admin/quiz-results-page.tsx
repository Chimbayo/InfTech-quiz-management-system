'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  XCircle,
  BarChart3,
  Clock,
  Target,
  LogOut
} from 'lucide-react'
import { SessionUser } from '@/lib/auth'

interface QuizResults {
  quiz: {
    id: string
    title: string
    description: string | null
    passingScore: number
    createdAt: Date
  }
  statistics: {
    totalAttempts: number
    passedAttempts: number
    failedAttempts: number
    passRate: number
    averageScore: number
  }
  attempts: Array<{
    id: string
    score: number
    passed: boolean
    startedAt: Date
    completedAt: Date | null
    timeSpent: number | null
    user: {
      id: string
      name: string
      email: string
    }
    answers: Array<{
      id: string
      isCorrect: boolean
      question: {
        id: string
        text: string
        options: Array<{
          id: string
          text: string
          isCorrect: boolean
        }>
      }
    }>
  }>
}

interface QuizResultsPageProps {
  user: SessionUser
  results: QuizResults
}

export function QuizResultsPage({ user, results }: QuizResultsPageProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getScoreColor = (score: number, passingScore: number) => {
    if (score >= passingScore) {
      return 'text-green-600'
    }
    return 'text-red-600'
  }

  const getScoreBadgeVariant = (score: number, passingScore: number) => {
    if (score >= passingScore) {
      return 'default' as const
    }
    return 'destructive' as const
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Quiz Results</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quiz Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">{results.quiz.title}</CardTitle>
            <CardDescription>
              {results.quiz.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Passing Score:</span>
                <span className="ml-2 font-medium">{results.quiz.passingScore}%</span>
              </div>
              <div>
                <span className="text-gray-600">Created:</span>
                <span className="ml-2 font-medium">
                  {new Date(results.quiz.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Total Attempts:</span>
                <span className="ml-2 font-medium">{results.statistics.totalAttempts}</span>
              </div>
              <div>
                <span className="text-gray-600">Average Score:</span>
                <span className="ml-2 font-medium">
                  {Math.round(results.statistics.averageScore)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{results.statistics.totalAttempts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Passed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {results.statistics.passedAttempts}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {results.statistics.failedAttempts}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(results.statistics.passRate)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attempts List */}
        <Card>
          <CardHeader>
            <CardTitle>Student Attempts</CardTitle>
            <CardDescription>
              Detailed view of all quiz attempts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.attempts.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No attempts yet</h3>
                <p className="text-gray-600">
                  Students haven't attempted this quiz yet
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.attempts.map((attempt) => (
                  <Card key={attempt.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-2">
                            <h3 className="text-lg font-medium">{attempt.user.name}</h3>
                            <span className="text-sm text-gray-600">{attempt.user.email}</span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {attempt.completedAt 
                                ? new Date(attempt.completedAt).toLocaleDateString()
                                : 'Incomplete'
                              }
                            </div>
                            {attempt.timeSpent && (
                              <div className="flex items-center">
                                <span>Time: {formatTime(attempt.timeSpent)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getScoreColor(attempt.score, results.quiz.passingScore)}`}>
                            {attempt.score}%
                          </div>
                          <Badge variant={getScoreBadgeVariant(attempt.score, results.quiz.passingScore)}>
                            {attempt.passed ? 'Passed' : 'Failed'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
