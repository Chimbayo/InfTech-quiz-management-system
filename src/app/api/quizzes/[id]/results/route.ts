import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { UserRole } from '@/types'
import { calculateQuizStatistics } from '@/lib/quiz-statistics'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface RouteParams {
  params: {
    id: string
  }
}

// GET - Get quiz results and attempts
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole('ADMIN')
    
    // Get the quiz details
    const quiz = await prisma.quiz.findUnique({
      where: { 
        id: params.id,
      },
    })

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    // Get all attempts for this quiz with user details
    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        answers: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    })

    // Calculate comprehensive statistics using the improved utility
    const statistics = await calculateQuizStatistics(params.id)

    const results = {
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        passingScore: quiz.passingScore,
        createdAt: quiz.createdAt,
        isExam: (quiz as any).isExam || false,
        examEndTime: (quiz as any).examEndTime || null,
        examDuration: (quiz as any).examDuration || null,
      },
      statistics: {
        totalAttempts: statistics.totalAttempts,
        completedAttempts: statistics.completedAttempts,
        incompleteAttempts: statistics.incompleteAttempts,
        uniqueStudents: statistics.uniqueStudents,
        passedAttempts: statistics.passedAttempts,
        failedAttempts: statistics.failedAttempts,
        passRate: statistics.passRate,
        averageScore: statistics.averageScore,
        highestScore: statistics.highestScore,
        lowestScore: statistics.lowestScore,
        averageTimeSpent: statistics.averageTimeSpent,
      },
      attempts: attempts.filter(attempt => attempt.completedAt !== null), // Only show completed attempts
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Get quiz results error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
