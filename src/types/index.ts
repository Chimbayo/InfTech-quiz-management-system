import { User, Quiz, Question, QuestionOption, QuizAttempt, Answer } from '@prisma/client'

export type { User, Quiz, Question, QuestionOption, QuizAttempt, Answer }

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT'
export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE'

export interface QuizWithQuestions extends Quiz {
  creator: {
    name: string
  }
  questions: (Question & {
    options: QuestionOption[]
  })[]
}

export interface QuizAttemptWithDetails extends QuizAttempt {
  quiz: Quiz & {
    questions: Question[]
  }
  answers: (Answer & {
    question: Question & {
      options: QuestionOption[]
    }
  })[]
}

export interface CreateQuizData {
  title: string
  description?: string
  passingScore: number
  timeLimit?: number
  questions: {
    text: string
    type: QuestionType
    options: {
      text: string
      isCorrect: boolean
    }[]
  }[]
}

export interface QuizResult {
  score: number
  passed: boolean
  totalQuestions: number
  correctAnswers: number
  timeSpent?: number
}

export interface StudyMilestone {
  id: string
  title: string
  description?: string
  completed: boolean
  completedAt?: Date
  date?: Date
  type?: 'completion' | 'social' | 'achievement'
}
