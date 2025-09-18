'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Clock,
  BookOpen,
  Award,
  AlertCircle,
  Target,
  CheckCircle,
  XCircle,
  Activity,
  BarChart3,
  Star,
  Zap,
  Download,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { SessionUser } from '@/lib/auth'

interface QuizAttempt {
  id: string
  score: number
  passed: boolean
  completedAt: string | null
  timeSpent: number | null
  quiz: {
    id: string
    title: string
    passingScore: number
    timeLimit: number | null
  }
}

interface StudentStatistics {
  totalAttempts: number
  passedAttempts: number
  failedAttempts: number
  passRate: number
  averageScore: number
  lastActivity: string | null
  improvementTrend: 'up' | 'down' | 'stable'
  streakCount: number
  totalTimeSpent: number
  favoriteSubject: string | null
}

interface StudentWithStats {
  id: string
  name: string
  email: string
  createdAt: string
  updatedAt: string
  _count: {
    attempts: number
  }
  statistics: StudentStatistics
  recentScores: number[]
  performanceLevel: 'excellent' | 'good' | 'average' | 'needs_improvement'
  quizAttempts: QuizAttempt[]
}

interface StudentsManagementProps {
  user: SessionUser
}

export function StudentsManagement({ user }: StudentsManagementProps) {
  const [students, setStudents] = useState<StudentWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterBy, setFilterBy] = useState<'all' | 'active' | 'struggling' | 'excellent'>('all')
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/users/students')
      
      if (!response.ok) {
        throw new Error('Failed to fetch students')
      }
      
      const data = await response.json()
      setStudents(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getPerformanceBadge = (level: string) => {
    switch (level) {
      case 'excellent':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><Star className="h-3 w-3 mr-1" />Excellent</Badge>
      case 'good':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><CheckCircle className="h-3 w-3 mr-1" />Good</Badge>
      case 'average':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Target className="h-3 w-3 mr-1" />Average</Badge>
      case 'needs_improvement':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><AlertCircle className="h-3 w-3 mr-1" />Needs Help</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const handleExportAll = async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/users/students/export?format=csv')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `all-students-results-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Failed to export data')
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export data')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportStudent = async (studentId: string, studentName: string) => {
    setIsExporting(true)
    try {
      const response = await fetch(`/api/users/students/export?format=csv&studentId=${studentId}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${studentName.replace(/\s+/g, '-')}-results-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Failed to export data')
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export data')
    } finally {
      setIsExporting(false)
    }
  }

  const toggleStudentExpansion = (studentId: string) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId)
  }

  const filteredStudents = students.filter(student => {
    switch (filterBy) {
      case 'active':
        return student.statistics.totalAttempts > 0
      case 'struggling':
        return student.statistics.passRate < 50 && student.statistics.totalAttempts > 0
      case 'excellent':
        return student.statistics.averageScore >= 85 && student.statistics.totalAttempts > 0
      default:
        return true
    }
  })

  const totalStudents = students.length
  const activeStudents = students.filter(s => s.statistics.totalAttempts > 0).length
  const strugglingStudents = students.filter(s => s.statistics.passRate < 50 && s.statistics.totalAttempts > 0).length
  const excellentStudents = students.filter(s => s.statistics.averageScore >= 85 && s.statistics.totalAttempts > 0).length
  const averageClassScore = students.length > 0 
    ? Math.round(students.reduce((sum, s) => sum + s.statistics.averageScore, 0) / students.length)
    : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Students</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchStudents} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Students</CardTitle>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalStudents}</div>
            <p className="text-xs text-gray-500 mt-1">Registered students</p>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Learners</CardTitle>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Activity className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{activeStudents}</div>
            <p className="text-xs text-gray-500 mt-1">Students with quiz attempts</p>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Class Average</CardTitle>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{averageClassScore.toFixed(2)}%</div>
            <p className="text-xs text-gray-500 mt-1">Overall performance</p>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Need Support</CardTitle>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{strugglingStudents}</div>
            <p className="text-xs text-gray-500 mt-1">Students below 50% pass rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Card className="card-professional">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Student Performance Overview
              </CardTitle>
              <CardDescription>
                Monitor student progress and identify those who need additional support
              </CardDescription>
            </div>
            <Button
              onClick={handleExportAll}
              disabled={isExporting}
              className="btn-primary-professional"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export All'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={filterBy === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterBy('all')}
              className="btn-secondary-professional"
            >
              All Students ({totalStudents})
            </Button>
            <Button
              variant={filterBy === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterBy('active')}
              className="btn-secondary-professional"
            >
              <Activity className="h-4 w-4 mr-1" />
              Active ({activeStudents})
            </Button>
            <Button
              variant={filterBy === 'excellent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterBy('excellent')}
              className="btn-secondary-professional"
            >
              <Star className="h-4 w-4 mr-1" />
              Excellent ({excellentStudents})
            </Button>
            <Button
              variant={filterBy === 'struggling' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterBy('struggling')}
              className="btn-secondary-professional"
            >
              <AlertCircle className="h-4 w-4 mr-1" />
              Need Support ({strugglingStudents})
            </Button>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Students Found</h3>
              <p className="text-gray-600">
                {filterBy === 'all' 
                  ? 'No students have been registered yet.' 
                  : `No students match the "${filterBy}" filter.`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStudents.map((student) => (
                <Card key={student.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                            <Users className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {student.name}
                            </h3>
                            {getPerformanceBadge(student.performanceLevel)}
                            {student.statistics.improvementTrend !== 'stable' && (
                              <div className="flex items-center gap-1">
                                {getTrendIcon(student.statistics.improvementTrend)}
                                <span className="text-xs text-gray-500">
                                  {student.statistics.improvementTrend === 'up' ? 'Improving' : 'Declining'}
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{student.email}</p>
                          
                          {/* Key Metrics */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Joined:</span>
                              <span className="font-medium">{formatDate(student.createdAt)}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Attempts:</span>
                              <span className="font-medium">{student.statistics.totalAttempts}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Award className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Avg Score:</span>
                              <span className="font-medium">{Math.round(student.statistics.averageScore)}%</span>
                            </div>
                            
                            {student.statistics.lastActivity && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">Last Active:</span>
                                <span className="font-medium">{formatDateTime(student.statistics.lastActivity)}</span>
                              </div>
                            )}
                          </div>

                          {/* Detailed Performance Metrics */}
                          {student.statistics.totalAttempts > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="text-center p-3 bg-green-50 rounded-lg">
                                <div className="text-lg font-bold text-green-600">{student.statistics.passedAttempts}</div>
                                <div className="text-xs text-gray-600">Passed</div>
                              </div>
                              <div className="text-center p-3 bg-red-50 rounded-lg">
                                <div className="text-lg font-bold text-red-600">{student.statistics.failedAttempts}</div>
                                <div className="text-xs text-gray-600">Failed</div>
                              </div>
                              <div className="text-center p-3 bg-blue-50 rounded-lg">
                                <div className="text-lg font-bold text-blue-600">{Math.round(student.statistics.passRate)}%</div>
                                <div className="text-xs text-gray-600">Pass Rate</div>
                              </div>
                              <div className="text-center p-3 bg-purple-50 rounded-lg">
                                <div className="text-lg font-bold text-purple-600">{student.statistics.streakCount}</div>
                                <div className="text-xs text-gray-600">Current Streak</div>
                              </div>
                            </div>
                          )}

                          {/* Recent Performance Trend */}
                          {student.recentScores.length > 1 && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Recent Performance</span>
                                <div className="flex items-center gap-1">
                                  {getTrendIcon(student.statistics.improvementTrend)}
                                  <span className="text-xs text-gray-500">
                                    {student.statistics.improvementTrend === 'up' ? 'Trending Up' : 
                                     student.statistics.improvementTrend === 'down' ? 'Trending Down' : 'Stable'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {student.recentScores.slice(-5).map((score, index) => (
                                  <div key={index} className="flex-1">
                                    <div 
                                      className={`h-8 rounded text-xs flex items-center justify-center font-medium ${
                                        score >= 80 ? 'bg-green-100 text-green-800' :
                                        score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                      }`}
                                    >
                                      {score}%
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleStudentExpansion(student.id)}
                          className="btn-secondary-professional"
                        >
                          {expandedStudent === student.id ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Hide Details
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportStudent(student.id, student.name)}
                          disabled={isExporting}
                          className="btn-secondary-professional"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>

                    {/* Detailed Quiz Performance - Expandable */}
                    {expandedStudent === student.id && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          Quiz Performance Details
                        </h4>
                        
                        {student.quizAttempts.length === 0 ? (
                          <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h5 className="text-lg font-medium text-gray-900 mb-2">No Quiz Attempts</h5>
                            <p className="text-gray-600">This student hasn't attempted any quizzes yet.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Group attempts by quiz */}
                            {Object.entries(
                              student.quizAttempts.reduce((acc, attempt) => {
                                const quizId = attempt.quiz.id
                                if (!acc[quizId]) {
                                  acc[quizId] = {
                                    quiz: attempt.quiz,
                                    attempts: []
                                  }
                                }
                                acc[quizId].attempts.push(attempt)
                                return acc
                              }, {} as Record<string, { quiz: QuizAttempt['quiz'], attempts: QuizAttempt[] }>)
                            ).map(([quizId, { quiz, attempts }]) => (
                              <Card key={quizId} className="border border-gray-200">
                                <CardHeader className="pb-3">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <CardTitle className="text-base">{quiz.title}</CardTitle>
                                      <CardDescription>
                                        Passing Score: {quiz.passingScore}% | 
                                        Time Limit: {quiz.timeLimit ? `${quiz.timeLimit} min` : 'No Limit'}
                                      </CardDescription>
                                    </div>
                                    <Badge variant="outline" className="ml-2">
                                      {attempts.length} attempt{attempts.length !== 1 ? 's' : ''}
                                    </Badge>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-3">
                                    {attempts.map((attempt, index) => (
                                      <div key={attempt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-4">
                                          <div className="text-sm font-medium text-gray-600">
                                            Attempt #{attempts.length - index}
                                          </div>
                                          <div className={`text-lg font-bold ${
                                            attempt.score >= quiz.passingScore 
                                              ? 'text-green-600' 
                                              : 'text-red-600'
                                          }`}>
                                            {attempt.score}%
                                          </div>
                                          <Badge 
                                            variant={attempt.passed ? "default" : "destructive"}
                                            className={attempt.passed ? "bg-green-100 text-green-800" : ""}
                                          >
                                            {attempt.passed ? 'Passed' : 'Failed'}
                                          </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                          {attempt.timeSpent && (
                                            <div className="flex items-center gap-1">
                                              <Clock className="h-4 w-4" />
                                              {Math.round(attempt.timeSpent / 60)} min
                                            </div>
                                          )}
                                          {attempt.completedAt && (
                                            <div className="flex items-center gap-1">
                                              <Calendar className="h-4 w-4" />
                                              {new Date(attempt.completedAt).toLocaleDateString()}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                    
                                    {/* Quiz Summary */}
                                    <div className="mt-4 pt-3 border-t border-gray-200">
                                      <div className="grid grid-cols-3 gap-4 text-center">
                                        <div className="p-2 bg-blue-50 rounded">
                                          <div className="text-lg font-bold text-blue-600">
                                            {Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)}%
                                          </div>
                                          <div className="text-xs text-gray-600">Average Score</div>
                                        </div>
                                        <div className="p-2 bg-green-50 rounded">
                                          <div className="text-lg font-bold text-green-600">
                                            {attempts.filter(a => a.passed).length}
                                          </div>
                                          <div className="text-xs text-gray-600">Passed</div>
                                        </div>
                                        <div className="p-2 bg-purple-50 rounded">
                                          <div className="text-lg font-bold text-purple-600">
                                            {attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0) / attempts.length / 60}
                                          </div>
                                          <div className="text-xs text-gray-600">Avg Time (min)</div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
