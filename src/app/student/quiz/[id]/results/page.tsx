import { redirect } from 'next/navigation'
import { getSession, requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { QuizResults } from '@/components/student/quiz-results'
import { UserRole } from '@/types'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface QuizResultsPageProps {
  params: {
    id: string
  }
}

export default async function QuizResultsPage({ params }: QuizResultsPageProps) {
  try {
    const session = await requireRole('STUDENT')
    
    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        userId: session.id,
        quizId: params.id,
        completedAt: { not: null },
      },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                options: true,
              },
              orderBy: { order: 'asc' },
            },
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

    if (!attempt) {
      redirect('/student/dashboard')
    }

    return (
      <QuizResults attempt={attempt} />
    )
  } catch (error) {
    console.error('Authentication error in quiz results page:', error)
    // Only redirect if it's actually an authentication error
    if (error instanceof Error && error.message.includes('Authentication required')) {
      redirect('/student')
    }
    // For other errors, redirect to login as fallback
    redirect('/student')
  }
}
