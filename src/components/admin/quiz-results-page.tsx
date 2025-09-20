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
  LogOut,
  Download,
  FileText,
  FileSpreadsheet
} from 'lucide-react'
import { SessionUser } from '@/lib/auth'

// Utility function to format time in seconds to readable format
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

interface QuizResults {
  quiz: {
    id: string
    title: string
    description: string | null
    passingScore: number
    createdAt: Date
    isExam?: boolean
    examEndTime?: Date | null
    examDuration?: number | null
  }
  statistics: {
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

  const exportToExcel = () => {
    // Create CSV content (Excel-compatible)
    const headers = ['Rank', 'Student Name', 'Email', 'Score (%)', 'Status', 'Completion Date', 'Time Spent (min)']
    const csvContent = [
      headers.join(','),
      ...results.attempts.map((attempt, index) => [
        index + 1, // Rank (since already sorted by score desc)
        `"${attempt.user.name}"`,
        attempt.user.email,
        attempt.score,
        attempt.passed ? 'Passed' : 'Failed',
        attempt.completedAt ? new Date(attempt.completedAt).toLocaleDateString() : 'Incomplete',
        attempt.timeSpent ? Math.round(attempt.timeSpent / 60) : 'N/A'
      ].join(','))
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${results.quiz.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_results.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToPDF = () => {
    // Create a printable version
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${results.quiz.title} - Results Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
            .stat-card { border: 1px solid #ddd; padding: 15px; text-align: center; }
            .stat-value { font-size: 24px; font-weight: bold; color: #333; }
            .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .passed { color: #16a34a; font-weight: bold; }
            .failed { color: #dc2626; font-weight: bold; }
            .exam-badge { background: #dc2626; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${results.quiz.title} ${results.quiz.isExam ? '<span class="exam-badge">EXAM</span>' : ''}</h1>
            <p>${results.quiz.description || ''}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleDateString()} | <strong>Passing Score:</strong> ${results.quiz.passingScore}%</p>
          </div>
          
          <div class="stats">
            <div class="stat-card">
              <div class="stat-value">${results.statistics.totalAttempts}</div>
              <div class="stat-label">Total Attempts</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${results.statistics.passedAttempts}</div>
              <div class="stat-label">Passed</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${results.statistics.failedAttempts}</div>
              <div class="stat-label">Failed</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${Math.round(results.statistics.passRate)}%</div>
              <div class="stat-label">Pass Rate</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student Name</th>
                <th>Email</th>
                <th>Score</th>
                <th>Status</th>
                <th>Completion Date</th>
                <th>Time Spent</th>
              </tr>
            </thead>
            <tbody>
              ${results.attempts.map((attempt, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${attempt.user.name}</td>
                  <td>${attempt.user.email}</td>
                  <td><strong>${attempt.score}%</strong></td>
                  <td class="${attempt.passed ? 'passed' : 'failed'}">${attempt.passed ? 'Passed' : 'Failed'}</td>
                  <td>${attempt.completedAt ? new Date(attempt.completedAt).toLocaleDateString() : 'Incomplete'}</td>
                  <td>${attempt.timeSpent ? formatTime(attempt.timeSpent) : 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
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
              <Button
                variant="outline"
                size="sm"
                onClick={exportToExcel}
                className="btn-inftech-success"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToPDF}
                className="btn-inftech-secondary"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
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
            <CardTitle className="text-2xl flex items-center gap-3">
              {results.quiz.title}
              {results.quiz.isExam && (
                <Badge className="badge-inftech badge-inftech-error">
                  <Target className="h-3 w-3 mr-1" />
                  EXAM
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {results.quiz.description}
              {results.quiz.isExam && (
                <div className="mt-2 text-amber-600 font-medium">
                  📊 Results are ranked by score in descending order (highest to lowest)
                </div>
              )}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="stat-card-inftech stat-card-blue">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {results.statistics.totalAttempts}
              </div>
              <div className="text-blue-100 text-sm font-medium">
                Total Attempts
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card-inftech stat-card-green">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {results.statistics.passedAttempts}
              </div>
              <div className="text-green-100 text-sm font-medium">
                Passed
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card-inftech stat-card-red">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {results.statistics.failedAttempts}
              </div>
              <div className="text-red-100 text-sm font-medium">
                Failed
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card-inftech stat-card-purple">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {Math.round(results.statistics.passRate)}%
              </div>
              <div className="text-purple-100 text-sm font-medium">
                Pass Rate
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Student Attempts */}
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
                {results.attempts.map((attempt, index) => (
                  <Card key={attempt.id} className={`border-l-4 ${
                    index === 0 ? 'border-l-yellow-500 bg-yellow-50' : 
                    index === 1 ? 'border-l-gray-400 bg-gray-50' : 
                    index === 2 ? 'border-l-amber-600 bg-amber-50' : 
                    'border-l-blue-500'
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              index === 0 ? 'bg-yellow-500 text-white' :
                              index === 1 ? 'bg-gray-400 text-white' :
                              index === 2 ? 'bg-amber-600 text-white' :
                              'bg-blue-500 text-white'
                            }`}>
                              {index + 1}
                            </div>
                            <h3 className="text-lg font-medium">{attempt.user.name}</h3>
                            <span className="text-sm text-gray-600">{attempt.user.email}</span>
                            {index < 3 && (
                              <Badge className={`${
                                index === 0 ? 'bg-yellow-500 text-white' :
                                index === 1 ? 'bg-gray-400 text-white' :
                                'bg-amber-600 text-white'
                              }`}>
                                {index === 0 ? '🥇 1st Place' : index === 1 ? '🥈 2nd Place' : '🥉 3rd Place'}
                              </Badge>
                            )}
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
