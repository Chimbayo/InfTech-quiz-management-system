'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  Home,
  Clock,
  Target,
  TrendingUp,
  BookOpen,
  MessageSquare,
  X
} from 'lucide-react'
import { QuizAttemptWithDetails } from '@/types'
import { ChatPanel } from '@/components/chat/ChatPanel'

interface QuizResultsProps {
  attempt: QuizAttemptWithDetails
}

export function QuizResults({ attempt }: QuizResultsProps) {
  const router = useRouter()
  const [showChat, setShowChat] = useState(false)
  const [quizChatRoom, setQuizChatRoom] = useState<string | null>(null)

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

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getCorrectAnswersCount = () => {
    return attempt.answers.filter(answer => answer.isCorrect).length
  }

  const getIncorrectAnswersCount = () => {
    return attempt.answers.filter(answer => !answer.isCorrect).length
  }

  // Load quiz chat room
  useEffect(() => {
    const loadQuizChatRoom = async () => {
      try {
        const response = await fetch(`/api/chat/rooms?quizId=${attempt.quiz.id}`)
        if (response.ok) {
          const data = await response.json()
          if (data.rooms && data.rooms.length > 0) {
            // Find the quiz discussion room
            const quizRoom = data.rooms.find((room: any) => room.type === 'QUIZ_DISCUSSION')
            if (quizRoom) {
              setQuizChatRoom(quizRoom.id)
            }
          }
        }
      } catch (error) {
        console.error('Error loading quiz chat room:', error)
      }
    }
    
    loadQuizChatRoom()
  }, [attempt.quiz.id])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <h1 className="text-xl font-bold text-gray-900">Quiz Results</h1>
            </div>
            <div className="flex items-center space-x-4">
              {quizChatRoom && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowChat(!showChat)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {showChat ? 'Hide Discussion' : 'Join Discussion'}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => router.push('/student/dashboard')}
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Summary */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{attempt.quiz.title}</CardTitle>
                <CardDescription>
                  Quiz completed on {new Date(attempt.completedAt || attempt.startedAt).toLocaleDateString()}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-bold ${getScoreColor(attempt.score, attempt.quiz.passingScore)}`}>
                  {attempt.score}%
                </div>
                <Badge variant={getScoreBadgeVariant(attempt.score, attempt.quiz.passingScore)} className="mt-2">
                  {attempt.passed ? 'Passed' : 'Failed'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold">{attempt.quiz.questions.length}</div>
                <div className="text-sm text-gray-600">Total Questions</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-600">{getCorrectAnswersCount()}</div>
                <div className="text-sm text-gray-600">Correct</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-2">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-red-600">{getIncorrectAnswersCount()}</div>
                <div className="text-sm text-gray-600">Incorrect</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-2xl font-bold">{attempt.quiz.passingScore}%</div>
                <div className="text-sm text-gray-600">Passing Score</div>
              </div>
            </div>

            {attempt.timeSpent && (
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-center text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Time taken: {formatTime(attempt.timeSpent)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Results */}
        <Card>
          <CardHeader>
            <CardTitle>Question Review</CardTitle>
            <CardDescription>
              Review your answers and see the correct solutions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {attempt.answers.map((answer, index) => {
              const question = answer.question
              const correctOptions = question.options.filter(option => option.isCorrect)
              const selectedOption = question.options.find(option => option.id === answer.selectedOptionId)

              return (
                <Card key={answer.id} className={`border-l-4 ${
                  answer.isCorrect ? 'border-l-green-500' : 'border-l-red-500'
                }`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          Question {index + 1}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {question.text}
                        </CardDescription>
                      </div>
                      <div className="ml-4">
                        {answer.isCorrect ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-600" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Your Answer:</h4>
                      {selectedOption ? (
                        <div className={`p-3 rounded-lg ${
                          answer.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                        }`}>
                          <span className={answer.isCorrect ? 'text-green-800' : 'text-red-800'}>
                            {selectedOption.text}
                          </span>
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                          <span className="text-gray-600">No answer selected</span>
                        </div>
                      )}
                    </div>

                    {!answer.isCorrect && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Correct Answer:</h4>
                        <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                          <span className="text-green-800">
                            {correctOptions.map(option => option.text).join(', ')}
                          </span>
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">All Options:</h4>
                      <div className="space-y-2">
                        {question.options.map((option) => {
                          const isSelected = option.id === answer.selectedOptionId
                          const isCorrect = option.isCorrect
                          
                          return (
                            <div
                              key={option.id}
                              className={`p-2 rounded border ${
                                isCorrect
                                  ? 'bg-green-50 border-green-200 text-green-800'
                                  : isSelected
                                  ? 'bg-red-50 border-red-200 text-red-800'
                                  : 'bg-gray-50 border-gray-200 text-gray-600'
                              }`}
                            >
                              {option.text}
                              {isCorrect && <span className="ml-2 text-green-600">✓</span>}
                              {isSelected && !isCorrect && <span className="ml-2 text-red-600">✗</span>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-8 flex justify-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push('/student/dashboard')}
          >
            <Home className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button
            onClick={() => router.push('/student/dashboard')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            View All Results
          </Button>
        </div>

        {/* Chat Panel Overlay */}
        {showChat && quizChatRoom && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Quiz Discussion - {attempt.quiz.title}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChat(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatPanel
                  roomId={quizChatRoom}
                  userId={attempt.userId}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
