import { redirect } from 'next/navigation'
import { getSession, requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EnhancedStudentDashboard } from '@/components/student/enhanced-student-dashboard'
import { UserRole } from '@/types'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function StudentDashboardPage() {
  try {
    const session = await requireRole('STUDENT')
    
    const quizzes = await prisma.quiz.findMany({
      where: { isActive: true },
      include: {
        creator: {
          select: { name: true },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const userAttempts = await prisma.quizAttempt.findMany({
      where: { userId: session.id },
      include: {
        quiz: {
          select: {
            title: true,
            passingScore: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    })

    return (
      <EnhancedStudentDashboard
        user={session}
        quizzes={quizzes}
        attempts={userAttempts}
      />
    )
  } catch (error) {
    console.error('Authentication error in student dashboard:', error)
    // Only redirect if it's actually an authentication error
    if (error instanceof Error && error.message.includes('Authentication required')) {
      redirect('/student')
    }
    // For other errors, redirect to login as fallback
    redirect('/student')
  }
}
