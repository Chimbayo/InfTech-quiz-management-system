'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Loader2,
  Save,
  BookOpen,
  MessageSquare
} from 'lucide-react'
import { QuestionType } from '@/types'

const optionSchema = z.object({
  text: z.string().min(1, 'Option text is required'),
  isCorrect: z.boolean(),
})

const questionSchema = z.object({
  text: z.string().min(1, 'Question text is required'),
  type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE']),
  options: z.array(optionSchema).min(2, 'At least 2 options are required'),
}).refine((data) => {
  // Ensure exactly one option is marked as correct
  const correctCount = data.options.filter(option => option.isCorrect).length;
  return correctCount === 1;
}, {
  message: 'Exactly one option must be marked as correct',
  path: ['options'],
})

const createQuizSchema = z.object({
  title: z.string().min(1, 'Quiz title is required'),
  description: z.string().optional(),
  passingScore: z.number().min(0).max(100),
  timeLimit: z.number().min(1).optional(),
  isActive: z.boolean().optional(),
  questions: z.array(questionSchema).min(1, 'At least 1 question is required'),
  // Chat settings
  enableChat: z.boolean().optional(),
  chatRoomName: z.string().optional(),
  allowChatDuringQuiz: z.boolean().optional(),
  enableStudyGroup: z.boolean().optional(),
})

type CreateQuizFormData = z.infer<typeof createQuizSchema>

interface CreateQuizFormProps {
  userId: string
}

export function CreateQuizForm({ userId }: CreateQuizFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateQuizFormData>({
    resolver: zodResolver(createQuizSchema),
    defaultValues: {
      title: '',
      description: '',
      passingScore: 60,
      timeLimit: undefined,
      isActive: true,
      enableChat: false,
      chatRoomName: '',
      allowChatDuringQuiz: false,
      enableStudyGroup: false,
      questions: [
        {
          text: '',
          type: 'MULTIPLE_CHOICE',
          options: [
            { text: '', isCorrect: true },
            { text: '', isCorrect: false },
          ],
        },
      ],
    },
  })

  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control,
    name: 'questions',
  })

  const watchedQuestions = watch('questions')
  const watchedEnableChat = watch('enableChat')

  const addQuestion = () => {
    appendQuestion({
      text: '',
      type: 'MULTIPLE_CHOICE',
      options: [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
      ],
    })
  }

  const addOption = (questionIndex: number) => {
    const currentOptions = watchedQuestions[questionIndex]?.options || []
    setValue(`questions.${questionIndex}.options`, [
      ...currentOptions,
      { text: '', isCorrect: false },
    ])
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const currentOptions = watchedQuestions[questionIndex]?.options || []
    if (currentOptions.length > 2) {
      setValue(`questions.${questionIndex}.options`, 
        currentOptions.filter((_, index) => index !== optionIndex)
      )
    }
  }

  const onSubmit = async (data: CreateQuizFormData) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          creatorId: userId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create quiz')
      }

      router.push('/admin/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Professional Header */}
      <header className="header-professional sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="mr-4 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-green-700 rounded-lg flex items-center justify-center">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Create New Quiz</h1>
                  <p className="text-xs text-gray-500">Design your assessment</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Quiz Basic Info */}
          <Card className="card-professional">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                Quiz Information
              </CardTitle>
              <CardDescription className="text-gray-600">
                Provide basic information about your quiz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Quiz Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter quiz title"
                  {...register('title')}
                  className="input-professional"
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Enter quiz description (optional)"
                  {...register('description')}
                  className="input-professional"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="passingScore">Passing Score (%) *</Label>
                  <Input
                    id="passingScore"
                    type="number"
                    min="0"
                    max="100"
                    {...register('passingScore', { valueAsNumber: true })}
                    className="input-professional"
                  />
                  {errors.passingScore && (
                    <p className="text-sm text-destructive">{errors.passingScore.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    min="1"
                    placeholder="No time limit"
                    {...register('timeLimit', { valueAsNumber: true })}
                    className="input-professional"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isActive">Quiz Status</Label>
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="isActive"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="isActive"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="isActive" className="cursor-pointer">Active (visible to students)</Label>
                  </div>
                  <p className="text-sm text-gray-600">
                    Check this box to make the quiz immediately available to students
                  </p>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Chat Settings */}
          <Card className="card-professional">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                Chat & Discussion Settings
              </CardTitle>
              <CardDescription className="text-gray-600">
                Configure chat rooms and discussion options for this quiz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enableChat"
                    {...register('enableChat')}
                  />
                  <Label htmlFor="enableChat" className="text-sm font-medium">
                    Enable chat room for this quiz
                  </Label>
                </div>

                {watchedEnableChat && (
                  <div className="ml-6 space-y-4 border-l-2 border-gray-200 pl-4">
                    <div className="space-y-2">
                      <Label htmlFor="chatRoomName">Chat Room Name</Label>
                      <Input
                        id="chatRoomName"
                        placeholder="Enter custom chat room name (optional)"
                        {...register('chatRoomName')}
                        className="input-professional"
                      />
                      <p className="text-xs text-gray-500">
                        If left empty, will use quiz title as room name
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="allowChatDuringQuiz"
                          {...register('allowChatDuringQuiz')}
                        />
                        <Label htmlFor="allowChatDuringQuiz" className="text-sm">
                          Allow chat during quiz attempts
                        </Label>
                      </div>
                      <p className="text-xs text-gray-500 ml-6">
                        ⚠️ Warning: Enabling chat during quiz may compromise academic integrity
                      </p>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="enableStudyGroup"
                          {...register('enableStudyGroup')}
                        />
                        <Label htmlFor="enableStudyGroup" className="text-sm">
                          Create study group for collaborative learning
                        </Label>
                      </div>
                      <p className="text-xs text-gray-500 ml-6">
                        Students can form study groups and discuss quiz topics
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card className="card-professional">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-white" />
                    </div>
                    Questions
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Add questions to your quiz
                  </CardDescription>
                </div>
                <Button 
                  type="button" 
                  onClick={addQuestion}
                  className="btn-primary-professional"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {questionFields.map((question, questionIndex) => (
                <Card key={question.id} className="card-professional border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <Label>Question {questionIndex + 1} *</Label>
                        <Input
                          placeholder="Enter your question"
                          {...register(`questions.${questionIndex}.text`)}
                          className="mt-1 input-professional"
                        />
                        {errors.questions?.[questionIndex]?.text && (
                          <p className="text-sm text-destructive mt-1">
                            {errors.questions[questionIndex]?.text?.message}
                          </p>
                        )}
                      </div>
                      {questionFields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeQuestion(questionIndex)}
                          className="ml-4"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Question Type</Label>
                      <div className="flex space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            value="MULTIPLE_CHOICE"
                            {...register(`questions.${questionIndex}.type`)}
                          />
                          <span>Multiple Choice</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            value="TRUE_FALSE"
                            {...register(`questions.${questionIndex}.type`)}
                          />
                          <span>True/False</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <Label>Options</Label>
                          <p className="text-sm text-gray-600 mt-1">
                            Select the "Correct Answer" radio button for the right answer
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addOption(questionIndex)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Option
                        </Button>
                      </div>

                      {watchedQuestions[questionIndex]?.options?.map((_, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2 p-3 border rounded-lg">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id={`correct-${questionIndex}-${optionIndex}`}
                              name={`correct-${questionIndex}`}
                              value={optionIndex}
                              checked={watchedQuestions[questionIndex]?.options?.[optionIndex]?.isCorrect || false}
                              onChange={(e) => {
                                // Uncheck all other options in this question
                                const currentOptions = watchedQuestions[questionIndex]?.options || []
                                currentOptions.forEach((_, idx) => {
                                  setValue(`questions.${questionIndex}.options.${idx}.isCorrect`, idx === optionIndex)
                                })
                              }}
                              className="h-4 w-4 text-green-600 focus:ring-green-500"
                            />
                            <Label 
                              htmlFor={`correct-${questionIndex}-${optionIndex}`}
                              className="text-sm font-medium text-green-600"
                            >
                              Correct Answer
                            </Label>
                          </div>
                          <Input
                            placeholder={`Option ${optionIndex + 1}`}
                            {...register(`questions.${questionIndex}.options.${optionIndex}.text`)}
                            className="flex-1 input-professional"
                          />
                          {watchedQuestions[questionIndex]?.options?.length > 2 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeOption(questionIndex, optionIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {errors.questions && (
                <p className="text-sm text-destructive">{errors.questions.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end space-x-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="btn-secondary-professional"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="btn-primary-professional"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Create Quiz
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
