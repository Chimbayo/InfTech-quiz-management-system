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
    <div className="min-h-screen bg-inftech-gradient">
      {/* Responsive Header */}
      <header className="header-inftech-student sticky top-0 z-50">
        <div className="container-wide">
          <div className="header-responsive">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-responsive-lg font-bold text-white">Student Portal</h1>
                  <p className="text-responsive-xs text-blue-100">Learning Dashboard</p>
                </div>
                <div className="sm:hidden">
                  <h1 className="text-responsive-sm font-bold text-white">Portal</h1>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button 
                onClick={() => router.push('/chat')}
                variant="outline"
                size="sm"
                className="btn-inftech-responsive bg-white/10 border-white/20 text-white hover:bg-white/20 hidden sm:flex"
              >
                <MessageSquare className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Chat</span>
              </Button>
              <div className="hidden md:block text-right">
                <p className="text-responsive-sm font-medium text-white">{user.name}</p>
                <p className="text-responsive-xs text-blue-100">Student</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="btn-inftech-responsive bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container-wide padding-responsive">
        {/* Responsive Stats Cards */}
        <div className="grid-responsive-3 gap-responsive mb-6 sm:mb-8">
          <Card className="card-inftech-responsive card-inftech-hover stat-card-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-responsive-xs font-medium text-white/90">Available Quizzes</CardTitle>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="stat-value-responsive text-white">{quizzes.length}</div>
              <p className="stat-label-responsive text-white/70 mt-1">Ready to take</p>
            </CardContent>
          </Card>

          <Card className="card-inftech-responsive card-inftech-hover stat-card-success">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-responsive-xs font-medium text-white/90">Quizzes Attempted</CardTitle>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <History className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="stat-value-responsive text-white">{attempts.length}</div>
              <p className="stat-label-responsive text-white/70 mt-1">Completed assessments</p>
            </CardContent>
          </Card>

          <Card className="card-inftech-responsive card-inftech-hover stat-card-info">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-responsive-xs font-medium text-white/90">Average Score</CardTitle>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="stat-value-responsive text-white">
                {attempts.length > 0 
                  ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length)
                  : 0
                }%
              </div>
              <p className="stat-label-responsive text-white/70 mt-1">Overall performance</p>
            </CardContent>
          </Card>
        </div>

        {/* Available Quizzes */}
        <div className="mb-6 sm:mb-8">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-responsive-xl heading-inftech-primary">Available Quizzes</h2>
            <p className="text-responsive-sm text-gray-600 mt-1">Choose a quiz to test your knowledge</p>
          </div>
          {quizzes.length === 0 ? (
            <Card className="card-inftech-responsive">
              <CardContent className="text-center padding-responsive-lg">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                </div>
                <h3 className="text-responsive-lg font-semibold text-gray-900 mb-2">No quizzes available</h3>
                <p className="text-responsive-sm text-gray-600 max-w-md mx-auto">
                  Check back later for new quizzes from your instructors
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="spacing-responsive">
              {quizzes.map((quiz) => (
                <Card key={quiz.id} className="card-inftech-responsive card-inftech-hover">
                  <CardHeader className="padding-responsive">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div className="flex-1">
                        <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-responsive-base">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                            </div>
                            <span className="font-semibold">{quiz.title}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                            {!quiz.isActive && (
                              <Badge variant="secondary" className="text-xs">Inactive</Badge>
                            )}
                            {quiz.enableChat && (
                              <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                                <MessageSquare className="h-3 w-3 mr-1" />
                                <span className="hidden sm:inline">Chat Available</span>
                                <span className="sm:hidden">Chat</span>
                              </Badge>
                            )}
                          </div>
                        </CardTitle>
                        <CardDescription className="mt-2 text-responsive-sm text-gray-600">
                          {quiz.description || 'No description provided'}
                        </CardDescription>
                        <p className="text-responsive-xs text-gray-500 mt-2">
                          Created by {quiz.creator.name}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 sm:ml-4">
                        {quiz.enableChat && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/student/quiz/${quiz.id}/chat`)}
                            className="btn-inftech-responsive btn-inftech-secondary w-full sm:w-auto"
                          >
                            <MessageSquare className="h-4 w-4 sm:mr-2" />
                            <span className="ml-2 sm:ml-0">Chat</span>
                          </Button>
                        )}
                        <Button
                          onClick={() => handleStartQuiz(quiz.id)}
                          disabled={!quiz.isActive}
                          className="btn-inftech-responsive btn-inftech-primary w-full sm:w-auto"
                        >
                          <Play className="h-4 w-4 sm:mr-2" />
                          <span className="ml-2 sm:ml-0">Start Quiz</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="padding-responsive pt-0">
                    <div className="grid-responsive-4 gap-responsive-sm">
                      <div className="text-center padding-responsive-sm bg-blue-50 rounded-lg">
                        <div className="text-responsive-lg font-bold text-blue-600">{quiz._count.questions}</div>
                        <div className="text-responsive-xs text-gray-600">Questions</div>
                      </div>
                      <div className="text-center padding-responsive-sm bg-purple-50 rounded-lg">
                        <div className="text-responsive-lg font-bold text-purple-600">{quiz.passingScore}%</div>
                        <div className="text-responsive-xs text-gray-600">Passing Score</div>
                      </div>
                      <div className="text-center padding-responsive-sm bg-orange-50 rounded-lg">
                        <div className="text-responsive-lg font-bold text-orange-600">
                          {quiz.timeLimit ? `${quiz.timeLimit}` : '∞'}
                        </div>
                        <div className="text-responsive-xs text-gray-600">
                          {quiz.timeLimit ? 'Minutes' : 'No Limit'}
                        </div>
                      </div>
                      <div className="text-center padding-responsive-sm bg-green-50 rounded-lg">
                        <div className="text-responsive-lg font-bold text-green-600">{quiz._count.attempts}</div>
                        <div className="text-responsive-xs text-gray-600">Total Attempts</div>
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
          <div data-section="history">
            <h2 className="text-responsive-xl heading-inftech-primary mb-4 sm:mb-6">Your Quiz History</h2>
            <div className="spacing-responsive">
              {attempts.map((attempt) => (
                <Card key={attempt.id} className="card-inftech-responsive">
                  <CardContent className="padding-responsive">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="flex-shrink-0">
                          {attempt.passed ? (
                            <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                          ) : (
                            <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-responsive-base font-medium truncate">{attempt.quiz.title}</h3>
                          <p className="text-responsive-xs text-gray-600">
                            Completed on {new Date(attempt.completedAt || attempt.startedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <div className="text-left sm:text-right">
                          <div className={`text-responsive-lg font-bold ${getScoreColor(attempt.score, attempt.quiz.passingScore)}`}>
                            {attempt.score}%
                          </div>
                          <Badge variant={getScoreBadgeVariant(attempt.score, attempt.quiz.passingScore)} className="text-xs">
                            {attempt.passed ? 'Passed' : 'Failed'}
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/student/quiz/${attempt.quizId}/results`)}
                          className="btn-inftech-responsive w-full sm:w-auto"
                        >
                          <span className="text-xs sm:text-sm">View Details</span>
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

      {/* Mobile Navigation */}
      <nav className="nav-mobile">
        <div className="flex justify-around items-center">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="nav-mobile-item text-blue-600"
          >
            <BookOpen className="h-5 w-5 mb-1" />
            <span>Quizzes</span>
          </button>
          <button 
            onClick={() => router.push('/chat')}
            className="nav-mobile-item text-green-600"
          >
            <MessageSquare className="h-5 w-5 mb-1" />
            <span>Chat</span>
          </button>
          <button 
            onClick={() => {
              const historySection = document.querySelector('[data-section="history"]');
              if (historySection) {
                historySection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="nav-mobile-item text-purple-600"
          >
            <History className="h-5 w-5 mb-1" />
            <span>History</span>
          </button>
          <button 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="nav-mobile-item text-red-600"
          >
            <LogOut className="h-5 w-5 mb-1" />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
