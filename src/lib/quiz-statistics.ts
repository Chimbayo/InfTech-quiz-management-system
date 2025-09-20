/**
 * Quiz Statistics Utility
 * Provides robust and accurate statistics calculations for quiz attempts
 */

import { prisma } from './prisma'

export interface QuizStatistics {
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

export interface StudentStatistics {
  totalQuizzesTaken: number
  uniqueQuizzesCompleted: number
  totalAttempts: number
  passedQuizzes: number
  failedQuizzes: number
  averageScore: number
  bestScore: number
  studyStreak: number
  weeklyProgress: number
  totalTimeSpent: number
}

/**
 * Calculate comprehensive statistics for a specific quiz
 */
export async function calculateQuizStatistics(quizId: string): Promise<QuizStatistics> {
  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId },
    select: {
      id: true,
      userId: true,
      score: true,
      passed: true,
      timeSpent: true,
      completedAt: true,
      startedAt: true
    }
  })

  const completedAttempts = attempts.filter(attempt => attempt.completedAt !== null)
  const incompleteAttempts = attempts.filter(attempt => attempt.completedAt === null)
  const uniqueStudents = new Set(attempts.map(attempt => attempt.userId)).size
  const passedAttempts = completedAttempts.filter(attempt => attempt.passed)
  const failedAttempts = completedAttempts.filter(attempt => !attempt.passed)

  // Calculate scores only from completed attempts
  const scores = completedAttempts.map(attempt => attempt.score)
  const averageScore = scores.length > 0 
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : 0
  
  const highestScore = scores.length > 0 ? Math.max(...scores) : 0
  const lowestScore = scores.length > 0 ? Math.min(...scores) : 0

  // Calculate average time spent (only for completed attempts with time data)
  const timesSpent = completedAttempts
    .filter(attempt => attempt.timeSpent !== null)
    .map(attempt => attempt.timeSpent!)
  
  const averageTimeSpent = timesSpent.length > 0
    ? Math.round(timesSpent.reduce((sum, time) => sum + time, 0) / timesSpent.length)
    : 0

  return {
    totalAttempts: attempts.length,
    completedAttempts: completedAttempts.length,
    incompleteAttempts: incompleteAttempts.length,
    uniqueStudents,
    passedAttempts: passedAttempts.length,
    failedAttempts: failedAttempts.length,
    passRate: completedAttempts.length > 0 
      ? Math.round((passedAttempts.length / completedAttempts.length) * 100)
      : 0,
    averageScore,
    highestScore,
    lowestScore,
    averageTimeSpent
  }
}

/**
 * Calculate comprehensive statistics for a student
 */
export async function calculateStudentStatistics(userId: string): Promise<StudentStatistics> {
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId },
    include: {
      quiz: {
        select: {
          id: true,
          title: true,
          isExam: true
        }
      }
    },
    orderBy: { completedAt: 'desc' }
  })

  const completedAttempts = attempts.filter(attempt => attempt.completedAt !== null)
  
  // Get unique quizzes completed (best attempt per quiz)
  const quizBestAttempts = new Map<string, typeof attempts[0]>()
  
  for (const attempt of completedAttempts) {
    const quizId = attempt.quizId
    const existing = quizBestAttempts.get(quizId)
    
    if (!existing || attempt.score > existing.score) {
      quizBestAttempts.set(quizId, attempt)
    }
  }

  const bestAttempts = Array.from(quizBestAttempts.values())
  const passedQuizzes = bestAttempts.filter(attempt => attempt.passed)
  const failedQuizzes = bestAttempts.filter(attempt => !attempt.passed)

  // Calculate average score from best attempts
  const scores = bestAttempts.map(attempt => attempt.score)
  const averageScore = scores.length > 0
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : 0

  const bestScore = scores.length > 0 ? Math.max(...scores) : 0

  // Calculate study streak
  const studyStreak = calculateStudyStreakFromAttempts(completedAttempts)

  // Calculate weekly progress
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const weeklyProgress = completedAttempts.filter(attempt => 
    attempt.completedAt && new Date(attempt.completedAt) > oneWeekAgo
  ).length

  // Calculate total time spent
  const totalTimeSpent = completedAttempts
    .filter(attempt => attempt.timeSpent !== null)
    .reduce((sum, attempt) => sum + (attempt.timeSpent || 0), 0)

  return {
    totalQuizzesTaken: bestAttempts.length,
    uniqueQuizzesCompleted: bestAttempts.length,
    totalAttempts: attempts.length,
    passedQuizzes: passedQuizzes.length,
    failedQuizzes: failedQuizzes.length,
    averageScore,
    bestScore,
    studyStreak,
    weeklyProgress,
    totalTimeSpent
  }
}

/**
 * Calculate study streak from attempts
 */
function calculateStudyStreakFromAttempts(attempts: any[]): number {
  if (attempts.length === 0) return 0
  
  const sortedAttempts = attempts
    .filter(attempt => attempt.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
  
  let streak = 0
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)
  
  for (const attempt of sortedAttempts) {
    const attemptDate = new Date(attempt.completedAt!)
    attemptDate.setHours(0, 0, 0, 0)
    
    const daysDiff = Math.floor((currentDate.getTime() - attemptDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff === streak) {
      streak++
    } else if (daysDiff > streak) {
      break
    }
  }
  
  return streak
}

/**
 * Get quiz leaderboard (best attempt per student)
 */
export async function getQuizLeaderboard(quizId: string, limit: number = 10) {
  const attempts = await prisma.quizAttempt.findMany({
    where: { 
      quizId,
      completedAt: { not: null }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  })

  // Get best attempt per student
  const studentBestAttempts = new Map<string, typeof attempts[0]>()
  
  for (const attempt of attempts) {
    const userId = attempt.userId
    const existing = studentBestAttempts.get(userId)
    
    if (!existing || attempt.score > existing.score || 
        (attempt.score === existing.score && attempt.completedAt! < existing.completedAt!)) {
      studentBestAttempts.set(userId, attempt)
    }
  }

  // Sort by score (descending) then by completion time (ascending)
  return Array.from(studentBestAttempts.values())
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime()
    })
    .slice(0, limit)
}

/**
 * Validate quiz attempt statistics for debugging
 */
export async function validateQuizStatistics(quizId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { title: true, isExam: true }
  })

  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId },
    select: {
      id: true,
      userId: true,
      score: true,
      passed: true,
      completedAt: true,
      startedAt: true
    }
  })

  const issues: string[] = []

  // Check for incomplete attempts
  const incompleteAttempts = attempts.filter(a => !a.completedAt)
  if (incompleteAttempts.length > 0) {
    issues.push(`${incompleteAttempts.length} incomplete attempts found`)
  }

  // Check for exam multiple attempts (if it's an exam)
  if (quiz?.isExam) {
    const userAttemptCounts = new Map<string, number>()
    attempts.forEach(attempt => {
      const count = userAttemptCounts.get(attempt.userId) || 0
      userAttemptCounts.set(attempt.userId, count + 1)
    })

    const multipleAttemptUsers = Array.from(userAttemptCounts.entries())
      .filter(([_, count]) => count > 1)
    
    if (multipleAttemptUsers.length > 0) {
      issues.push(`${multipleAttemptUsers.length} users have multiple exam attempts`)
    }
  }

  // Check for invalid scores
  const invalidScores = attempts.filter(a => a.score < 0 || a.score > 100)
  if (invalidScores.length > 0) {
    issues.push(`${invalidScores.length} attempts with invalid scores`)
  }

  return {
    quizTitle: quiz?.title,
    totalAttempts: attempts.length,
    completedAttempts: attempts.filter(a => a.completedAt).length,
    uniqueUsers: new Set(attempts.map(a => a.userId)).size,
    issues
  }
}
