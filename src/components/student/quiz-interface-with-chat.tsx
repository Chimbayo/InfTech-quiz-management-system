'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle,
  Loader2,
  AlertTriangle,
  MessageSquare,
  Users,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { QuizWithQuestions, QuestionType } from '@/types'
import { ChatPanel } from '@/components/chat/ChatPanel'

interface QuizInterfaceWithChatProps {
  quiz: QuizWithQuestions & { enableChat?: boolean }
  userId: string
  chatRooms?: Array<{
    id: string
    name: string
    type: string
    isActive: boolean
  }>
}

interface Answer {
  questionId: string
  selectedOptionIds: string[]
}

export function QuizInterfaceWithChat({ quiz, userId, chatRooms = [] }: QuizInterfaceWithChatProps) {
  const router = useRouter()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [startTime] = useState(Date.now())
  const [showChat, setShowChat] = useState(false)
  const [selectedChatRoom, setSelectedChatRoom] = useState<string | null>(null)
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1
  const isFirstQuestion = currentQuestionIndex === 0

  // Chat is disabled during active quiz attempts for academic integrity
  const isChatDisabled = quizStarted && !quizCompleted

  // Initialize answers array
  useEffect(() => {
    const initialAnswers = quiz.questions.map(question => ({
      questionId: question.id,
      selectedOptionIds: [],
    }))
    setAnswers(initialAnswers)
  }, [quiz.questions])

  // Timer setup
  useEffect(() => {
    if (quiz.timeLimit && quizStarted) {
      setTimeRemaining(quiz.timeLimit * 60) // Convert minutes to seconds
      
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            handleSubmitQuiz()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [quiz.timeLimit, quizStarted])

  // Set default chat room if available
  useEffect(() => {
    if (chatRooms.length > 0 && !selectedChatRoom) {
      const quizRoom = chatRooms.find(room => room.type === 'QUIZ')
      setSelectedChatRoom(quizRoom?.id || chatRooms[0].id)
    }
  }, [chatRooms, selectedChatRoom])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleStartQuiz = () => {
    setQuizStarted(true)
    setShowChat(false) // Hide chat when quiz starts
  }

  const handleAnswerChange = (optionId: string, isChecked: boolean) => {
    setAnswers(prev => {
      const newAnswers = [...prev]
      const currentAnswer = newAnswers[currentQuestionIndex]
      
      if (currentQuestion.type === 'MULTIPLE_CHOICE') {
        // For multiple choice, only one option can be selected
        currentAnswer.selectedOptionIds = isChecked ? [optionId] : []
      } else {
        // For true/false, toggle the option
        if (isChecked) {
          currentAnswer.selectedOptionIds = [optionId]
        } else {
          currentAnswer.selectedOptionIds = []
        }
      }
      
      return newAnswers
    })
  }

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmitQuiz = async () => {
    setIsSubmitting(true)
    setError('')

    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000)
      
      const response = await fetch('/api/quiz-attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizId: quiz.id,
          userId,
          answers,
          timeSpent,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit quiz')
      }

      setQuizCompleted(true)
      setShowChat(true) // Enable chat after quiz completion
      
      // Redirect to results after a short delay
      setTimeout(() => {
        router.push(`/student/quiz/${quiz.id}/results`)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCurrentAnswer = () => {
    return answers[currentQuestionIndex]?.selectedOptionIds || []
  }

  const getProgressPercentage = () => {
    return ((currentQuestionIndex + 1) / quiz.questions.length) * 100
  }

  const getAnsweredCount = () => {
    return answers.filter(answer => answer.selectedOptionIds.length > 0).length
  }

  const areAllQuestionsAnswered = () => {
    return answers.every(answer => answer.selectedOptionIds.length > 0)
  }

  const toggleChat = () => {
    if (!isChatDisabled) {
      setShowChat(!showChat)
    }
  }

  // Pre-quiz screen
  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gray-50">
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
                <h1 className="text-xl font-bold text-gray-900">{quiz.title}</h1>
              </div>
              {quiz.enableChat && chatRooms.length > 0 && (
                <Button
                  variant="outline"
                  onClick={toggleChat}
                  className="btn-secondary-professional"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {showChat ? 'Hide Chat' : 'Show Chat'}
                </Button>
              )}
            </div>
          </div>
        </header>

        <div className={`flex ${showChat ? 'h-screen' : ''}`}>
          {/* Main Content */}
          <div className={`${showChat ? 'flex-1' : 'w-full'} overflow-auto`}>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-2xl">Ready to Start?</CardTitle>
                  <CardDescription>
                    Review the quiz details below and click "Start Quiz" when you're ready.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-4">
                      <div>
                        <span className="text-gray-600">Questions:</span>
                        <span className="ml-2 font-medium">{quiz.questions.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Passing Score:</span>
                        <span className="ml-2 font-medium">{quiz.passingScore}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Time Limit:</span>
                        <span className="ml-2 font-medium">
                          {quiz.timeLimit ? `${quiz.timeLimit} minutes` : 'No limit'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <span className="text-gray-600">Created by:</span>
                        <span className="ml-2 font-medium">{quiz.creator.name}</span>
                      </div>
                      {quiz.enableChat && (
                        <div>
                          <span className="text-gray-600">Chat:</span>
                          <Badge variant="default" className="ml-2 bg-green-100 text-green-800">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Available for discussion
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {quiz.enableChat && (
                    <Alert className="mb-6">
                      <MessageSquare className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Academic Integrity Notice:</strong> Chat will be disabled during the quiz attempt 
                        to maintain academic integrity. You can use chat before starting and after completing the quiz 
                        for discussions and questions.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handleStartQuiz}
                    size="lg"
                    className="btn-primary-professional"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Start Quiz
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Chat Sidebar */}
          {showChat && quiz.enableChat && selectedChatRoom && (
            <div className="w-96 border-l bg-white">
              <div className="h-full flex flex-col">
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Quiz Discussion</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowChat(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {chatRooms.length > 1 && (
                    <div className="mt-2">
                      <select
                        value={selectedChatRoom}
                        onChange={(e) => setSelectedChatRoom(e.target.value)}
                        className="w-full text-sm border rounded px-2 py-1"
                      >
                        {chatRooms.map(room => (
                          <option key={room.id} value={room.id}>
                            {room.name} ({room.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <ChatPanel
                    roomId={selectedChatRoom}
                    userId={userId}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Quiz completion screen
  if (quizCompleted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card>
            <CardContent className="text-center py-16">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Quiz Completed!</h2>
              <p className="text-gray-600 mb-6">
                Your answers have been submitted successfully. You'll be redirected to see your results shortly.
              </p>
              {quiz.enableChat && (
                <p className="text-sm text-green-600 mb-4">
                  Chat is now available for post-quiz discussions.
                </p>
              )}
              <Button
                onClick={() => router.push(`/student/quiz/${quiz.id}/results`)}
                className="btn-primary-professional"
              >
                View Results
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Active quiz interface
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">{quiz.title}</h1>
              {isChatDisabled && quiz.enableChat && (
                <Badge variant="secondary" className="ml-4">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Chat Disabled During Quiz
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {timeRemaining !== null && (
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span className={timeRemaining < 300 ? 'text-red-600 font-medium' : ''}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}
              <div className="text-sm text-gray-600">
                {getAnsweredCount()}/{quiz.questions.length} answered
                {areAllQuestionsAnswered() && (
                  <span className="ml-2 text-green-600 font-medium">✓ All answered</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className={`flex ${showChat ? 'h-screen' : ''}`}>
        {/* Main Quiz Content */}
        <div className={`${showChat ? 'flex-1' : 'w-full'} overflow-auto`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
                <span>{Math.round(getProgressPercentage())}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {currentQuestion.text}
                    </CardTitle>
                    <CardDescription>
                      {currentQuestion.type === 'MULTIPLE_CHOICE' 
                        ? 'Select the correct answer'
                        : 'Select True or False'
                      }
                    </CardDescription>
                  </div>
                  {getCurrentAnswer().length > 0 && (
                    <div className="ml-4 flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {currentQuestion.type === 'MULTIPLE_CHOICE' ? (
                  <RadioGroup
                    value={getCurrentAnswer()[0] || ''}
                    onValueChange={(value) => handleAnswerChange(value, true)}
                  >
                    {currentQuestion.options.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.id} id={option.id} />
                        <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                          {option.text}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={option.id}
                          checked={getCurrentAnswer().includes(option.id)}
                          onCheckedChange={(checked) => handleAnswerChange(option.id, !!checked)}
                        />
                        <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                          {option.text}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isFirstQuestion}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex flex-col items-end space-y-2">
                {isLastQuestion && !areAllQuestionsAnswered() && (
                  <div className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                    <AlertTriangle className="h-4 w-4 inline mr-2" />
                    Please answer all {quiz.questions.length} questions before submitting
                    ({getAnsweredCount()}/{quiz.questions.length} answered)
                  </div>
                )}
                <div className="flex space-x-4">
                  {isLastQuestion ? (
                    <Button
                      onClick={handleSubmitQuiz}
                      disabled={isSubmitting || !areAllQuestionsAnswered()}
                    >
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Submit Quiz
                    </Button>
                  ) : (
                    <Button onClick={handleNext}>
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Sidebar - Only shown when not disabled */}
        {showChat && quiz.enableChat && !isChatDisabled && selectedChatRoom && (
          <div className="w-96 border-l bg-white">
            <div className="h-full flex flex-col">
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Quiz Discussion</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowChat(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex-1">
                <ChatPanel
                  roomId={selectedChatRoom}
                  userId={userId}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
