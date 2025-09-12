'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  BarChart3, 
  BookOpen, 
  Users, 
  TrendingUp,
  Edit,
  Trash2,
  Eye,
  LogOut,
  MessageSquare,
  Shield
} from 'lucide-react'
import { SessionUser } from '@/lib/auth'
import { Quiz } from '@prisma/client'

interface QuizWithCounts extends Omit<Quiz, 'enableChat'> {
  enableChat?: boolean
  _count: {
    questions: number
    attempts: number
  }
  enableStudyGroup?: boolean
}

interface AdminDashboardProps {
  user: SessionUser
  quizzes: QuizWithCounts[]
  stats: {
    totalQuizzes: number
    totalAttempts: number
    averageScore: number
  }
}

export function AdminDashboard({ user, quizzes, stats }: AdminDashboardProps) {
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

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Failed to delete quiz')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete quiz')
    }
  }

  return (
    <div className="min-h-screen">
      {/* Professional Header */}
      <header className="header-professional sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Quiz Management</h1>
                  <p className="text-xs text-gray-500">Admin Dashboard</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">Administrator</p>
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
              <CardTitle className="text-sm font-medium text-gray-600">Total Quizzes</CardTitle>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalQuizzes}</div>
              <p className="text-xs text-gray-500 mt-1">Active quizzes created</p>
            </CardContent>
          </Card>

          <Card className="card-professional card-professional-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Attempts</CardTitle>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalAttempts}</div>
              <p className="text-xs text-gray-500 mt-1">Student submissions</p>
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
                {Math.round(stats.averageScore)}%
              </div>
              <p className="text-xs text-gray-500 mt-1">Across all attempts</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Quizzes</h2>
            <p className="text-gray-600 mt-1">Manage and monitor your quiz collection</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => router.push('/admin/users')}
              variant="outline"
              className="btn-secondary-professional"
            >
              <Users className="h-4 w-4 mr-2" />
              View Users
            </Button>
            <Button 
              onClick={() => router.push('/admin/chat')}
              variant="outline"
              className="btn-secondary-professional"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat Management
            </Button>
            <Button 
              onClick={() => router.push('/chat')}
              variant="outline"
              className="btn-secondary-professional"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Open Chat
            </Button>
            <Button 
              onClick={() => router.push('/admin/quizzes/create')}
              className="btn-primary-professional"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Quiz
            </Button>
          </div>
        </div>

        {/* Quizzes List */}
        {quizzes.length === 0 ? (
          <Card className="card-professional">
            <CardContent className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No quizzes yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Create your first quiz to start engaging with students and track their progress
              </p>
              <Button 
                onClick={() => router.push('/admin/quizzes/create')}
                className="btn-primary-professional"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Quiz
              </Button>
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
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-white" />
                        </div>
                        {quiz.title}
                        {!quiz.isActive && (
                          <Badge variant="secondary" className="ml-2">Inactive</Badge>
                        )}
                        {quiz.enableChat && (
                          <Badge variant="default" className="ml-2 bg-green-100 text-green-800">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Chat Enabled
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-2 text-gray-600">
                        {quiz.description || 'No description provided'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/quizzes/${quiz.id}/results`)}
                        className="btn-secondary-professional"
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Results
                      </Button>
                      {quiz.enableChat && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/quizzes/${quiz.id}/chat`)}
                          className="btn-secondary-professional"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Chat
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/quizzes/${quiz.id}/edit`)}
                        className="btn-secondary-professional"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
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
                      <div className="text-2xl font-bold text-green-600">{quiz._count.attempts}</div>
                      <div className="text-sm text-gray-600">Attempts</div>
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
