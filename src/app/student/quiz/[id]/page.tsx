import { redirect } from 'next/navigation'
import { getSession, requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { QuizInterface } from '@/components/student/quiz-interface'
import { UserRole } from '@/types'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface QuizPageProps {
  params: {
    id: string
  }
}

export default async function QuizPage({ params }: QuizPageProps) {
  let session: any
  
  try {
    session = await requireRole('STUDENT')
  } catch (error) {
    console.error('Authentication error in quiz page:', error)
    // Only redirect if it's actually an authentication error
    if (error instanceof Error && error.message.includes('Authentication required')) {
      redirect('/student')
    }
    // For other errors, redirect to login as fallback
    redirect('/student')
  }

  const quiz = await prisma.quiz.findFirst({
    where: { 
      id: params.id,
      OR: [
        { isActive: true },
        { startAt: { lte: new Date() } },
      ],
    },
    include: {
      questions: {
        include: {
          options: true,
        },
        orderBy: { order: 'asc' },
      },
      creator: {
        select: { name: true },
      },
    },
  })

  if (!quiz) {
    redirect('/student/dashboard')
  }

  // Allow retakes - get previous attempt information for better UX
  const previousAttempts = await prisma.quizAttempt.findMany({
    where: {
      userId: session.id,
      quizId: params.id,
      completedAt: { not: null },
    },
    orderBy: { completedAt: 'desc' },
  })

  const isRetake = previousAttempts.length > 0
  const bestScore = isRetake ? Math.max(...previousAttempts.map(attempt => attempt.score)) : undefined

  return (
    <QuizInterface
      quiz={quiz}
      userId={session.id}
      isRetake={isRetake}
      previousAttempts={previousAttempts.length}
      bestScore={bestScore}
    />
  )
}
