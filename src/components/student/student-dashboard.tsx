'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Clock, 
  Users, 
  TrendingUp,
  Play,
  History,
  LogOut,
  CheckCircle,
  XCircle,
  MessageSquare
} from 'lucide-react'
import { SessionUser } from '@/lib/auth'
import { Quiz, QuizAttempt } from '@prisma/client'

interface QuizWithCounts extends Omit<Quiz, 'enableChat'> {
  enableChat?: boolean
  creator: {
    name: string
  }
  _count: {
    questions: number
    attempts: number
  }
  enableStudyGroup?: boolean
}

interface AttemptWithQuiz extends QuizAttempt {
  quiz: {
    title: string
    passingScore: number
  }
}

interface StudentDashboardProps {
  user: SessionUser
  quizzes: QuizWithCounts[]
  attempts: AttemptWithQuiz[]
}

export function StudentDashboard({ user, quizzes, attempts }: StudentDashboardProps) {
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

  const handleStartQuiz = (quizId: string) => {
    router.push(`/student/quiz/${quizId}`)
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
    <div className="min-h-screen">
      {/* Professional Header */}
      <header className="header-professional sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-green-700 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Student Portal</h1>
                  <p className="text-xs text-gray-500">Learning Dashboard</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => router.push('/chat')}
                variant="outline"
                size="sm"
                className="btn-secondary-professional"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </Button>
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">Student</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="btn-secondary-professional"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Professional Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="card-professional card-professional-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Available Quizzes</CardTitle>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{quizzes.length}</div>
              <p className="text-xs text-gray-500 mt-1">Ready to take</p>
            </CardContent>
          </Card>

          <Card className="card-professional card-professional-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Quizzes Attempted</CardTitle>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <History className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{attempts.length}</div>
              <p className="text-xs text-gray-500 mt-1">Completed assessments</p>
            </CardContent>
          </Card>

          <Card className="card-professional card-professional-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Average Score</CardTitle>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {attempts.length > 0 
                  ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length)
                  : 0
                }%
              </div>
              <p className="text-xs text-gray-500 mt-1">Overall performance</p>
            </CardContent>
          </Card>
        </div>

        {/* Available Quizzes */}
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Available Quizzes</h2>
            <p className="text-gray-600 mt-1">Choose a quiz to test your knowledge</p>
          </div>
          {quizzes.length === 0 ? (
            <Card className="card-professional">
              <CardContent className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No quizzes available</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Check back later for new quizzes from your instructors
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {quizzes.map((quiz) => (
                <Card key={quiz.id} className="card-professional card-professional-hover">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-3 text-lg">
                          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                            <BookOpen className="h-4 w-4 text-white" />
                          </div>
                          {quiz.title}
                          {!quiz.isActive && (
                            <Badge variant="secondary" className="ml-2">Inactive</Badge>
                          )}
                          {quiz.enableChat && (
                            <Badge variant="default" className="ml-2 bg-green-100 text-green-800">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Chat Available
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-2 text-gray-600">
                          {quiz.description || 'No description provided'}
                        </CardDescription>
                        <p className="text-sm text-gray-500 mt-2">
                          Created by {quiz.creator.name}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {quiz.enableChat && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/student/quiz/${quiz.id}/chat`)}
                            className="btn-secondary-professional"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Chat
                          </Button>
                        )}
                        <Button
                          onClick={() => handleStartQuiz(quiz.id)}
                          disabled={!quiz.isActive}
                          className="btn-primary-professional"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start Quiz
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{quiz._count.questions}</div>
                        <div className="text-sm text-gray-600">Questions</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{quiz.passingScore}%</div>
                        <div className="text-sm text-gray-600">Passing Score</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {quiz.timeLimit ? `${quiz.timeLimit}` : '∞'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {quiz.timeLimit ? 'Minutes' : 'No Limit'}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{quiz._count.attempts}</div>
                        <div className="text-sm text-gray-600">Total Attempts</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quiz History */}
        {attempts.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Your Quiz History</h2>
            <div className="grid gap-4">
              {attempts.map((attempt) => (
                <Card key={attempt.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {attempt.passed ? (
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          ) : (
                            <XCircle className="h-8 w-8 text-red-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-medium">{attempt.quiz.title}</h3>
                          <p className="text-sm text-gray-600">
                            Completed on {new Date(attempt.completedAt || attempt.startedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getScoreColor(attempt.score, attempt.quiz.passingScore)}`}>
                            {attempt.score}%
                          </div>
                          <Badge variant={getScoreBadgeVariant(attempt.score, attempt.quiz.passingScore)}>
                            {attempt.passed ? 'Passed' : 'Failed'}
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/student/quiz/${attempt.quizId}/results`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
