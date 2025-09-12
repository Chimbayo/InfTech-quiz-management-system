import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { QuizResultsPage } from '@/components/admin/quiz-results-page'
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
    
    // Verify the quiz belongs to the admin
    const quiz = await prisma.quiz.findUnique({
      where: { 
        id: params.id,
        creatorId: session.id,
      },
    })

    if (!quiz) {
      redirect('/admin/dashboard')
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

    // Calculate statistics
    const totalAttempts = attempts.length
    const passedAttempts = attempts.filter(attempt => attempt.passed).length
    const averageScore = totalAttempts > 0 
      ? attempts.reduce((sum, attempt) => sum + attempt.score, 0) / totalAttempts 
      : 0

    const results = {
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        passingScore: quiz.passingScore,
        createdAt: quiz.createdAt,
      },
      statistics: {
        totalAttempts,
        passedAttempts,
        failedAttempts: totalAttempts - passedAttempts,
        passRate: totalAttempts > 0 ? (passedAttempts / totalAttempts) * 100 : 0,
        averageScore,
      },
      attempts,
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
