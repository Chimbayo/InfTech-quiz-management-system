'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Clock, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle,
  Loader2,
  AlertTriangle,
  MessageSquare,
  X,
  HelpCircle
} from 'lucide-react'
import { QuizWithQuestions, QuestionType } from '@/types'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { HelpRequestPanel } from '@/components/student/help-request-panel'

interface QuizInterfaceProps {
  quiz: QuizWithQuestions
  userId: string
  isRetake?: boolean
  previousAttempts?: number
  bestScore?: number
}

interface Answer {
  questionId: string
  selectedOptionIds: string[]
}

export function QuizInterface({ quiz, userId, isRetake = false, previousAttempts = 0, bestScore }: QuizInterfaceProps) {
  const router = useRouter()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [startTime] = useState(Date.now())
  const [showChat, setShowChat] = useState(false)
  const [quizChatRoom, setQuizChatRoom] = useState<string | null>(null)
  const [isQuizActive, setIsQuizActive] = useState(true)
  const [showHelpRequest, setShowHelpRequest] = useState(false)

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1
  const isFirstQuestion = currentQuestionIndex === 0

  // Initialize answers array
  useEffect(() => {
    const initialAnswers = quiz.questions.map(question => ({
      questionId: question.id,
      selectedOptionIds: [],
    }))
    setAnswers(initialAnswers)
  }, [quiz.questions])

  // Load quiz chat room
  useEffect(() => {
    const loadQuizChatRoom = async () => {
      try {
        const response = await fetch(`/api/chat/rooms?quizId=${quiz.id}`)
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
  }, [quiz.id])

  // Timer setup
  useEffect(() => {
    if (quiz.timeLimit) {
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
  }, [quiz.timeLimit])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
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

      // Quiz is now completed, enable chat
      setIsQuizActive(false)
      router.push(`/student/quiz/${quiz.id}/results`)
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
              <h1 className="text-xl font-bold text-gray-900">{quiz.title}</h1>
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
              {quizChatRoom && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowChat(!showChat)}
                  className={isQuizActive ? 'opacity-50 cursor-not-allowed' : ''}
                  disabled={isQuizActive}
                  title={isQuizActive ? 'Chat will be available after quiz completion' : 'Toggle quiz discussion'}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {showChat ? 'Hide Chat' : 'Show Chat'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Retake Information Banner */}
        {isRetake && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <strong>Quiz Retake</strong> - This is attempt #{previousAttempts + 1}
                  {bestScore !== undefined && (
                    <span className="ml-2">
                      Your best score: <span className="font-semibold">{bestScore}%</span>
                    </span>
                  )}
                </div>
                <div className="text-sm">
                  💪 Aim to improve your understanding and score!
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

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
          <div className="flex justify-between text-xs text-gray-500">
            <span>Progress: {currentQuestionIndex + 1}/{quiz.questions.length}</span>
            <span>Answered: {getAnsweredCount()}/{quiz.questions.length}</span>
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
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={isFirstQuestion}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowHelpRequest(true)}
              className="border-orange-200 text-orange-700 hover:bg-orange-50"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Ask Help
            </Button>
          </div>

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

        {/* Quiz Info */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Questions:</span>
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
              <div>
                <span className="text-gray-600">Created by:</span>
                <span className="ml-2 font-medium">{quiz.creator.name}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Panel Overlay */}
      {showChat && quizChatRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Quiz Discussion - {quiz.title}</h3>
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
                userId={userId}
              />
            </div>
          </div>
        </div>
      )}

      {/* Help Request Panel Overlay */}
      {showHelpRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Ask for Help - {quiz.title}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHelpRequest(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <HelpRequestPanel 
                userId={userId}
                selectedQuizId={quiz.id}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
