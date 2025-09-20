import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { QuizResultsPage } from '@/components/admin/quiz-results-page'
import { calculateQuizStatistics } from '@/lib/quiz-statistics'
import { UserRole } from '@/types'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface QuizResultsPageProps {
  params: {
    id: string
  }
}

export default async function AdminQuizResultsPage({ params }: QuizResultsPageProps) {
  try {
    const session = await requireRole('ADMIN')
    
    // Get the quiz details
    const quiz = await prisma.quiz.findUnique({
      where: { 
        id: params.id,
      },
    })

    if (!quiz) {
      redirect('/admin/dashboard')
    }

    // Get all attempts for this quiz with user details - sorted by score descending
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
      orderBy: [
        { score: 'desc' }, // Primary sort by score (highest first)
        { completedAt: 'asc' } // Secondary sort by completion time (earliest first for same scores)
      ],
    })

    // Calculate comprehensive statistics using the enhanced utility
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

    return (
      <QuizResultsPage
        user={session}
        results={results}
      />
    )
  } catch (error) {
    redirect('/admin')
  }
}
