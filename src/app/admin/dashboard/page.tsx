import { redirect } from 'next/navigation'
import { getSession, requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EnhancedAdminDashboard } from '@/components/admin/enhanced-admin-dashboard'
import { UserRole } from '@/types'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  try {
    const session = await requireRole('ADMIN')
    
    // Show all quizzes for admins (not just their own), including isActive status
    const quizzes = await prisma.quiz.findMany({
      include: {
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const totalAttempts = await prisma.quizAttempt.count()

    const averageScore = await prisma.quizAttempt.aggregate({
      _avg: {
        score: true,
      },
    })

    // Get chat statistics
    const totalChatRooms = await prisma.chatRoom.count()
    const flaggedMessages = await prisma.chatMessage.count({
      where: { isSystemMessage: true }
    })
    const activeStudyGroups = await prisma.studyGroup.count()

    return (
      <EnhancedAdminDashboard
        user={session}
        quizzes={quizzes}
        stats={{
          totalQuizzes: quizzes.length,
          totalAttempts,
          averageScore: averageScore._avg.score || 0,
          totalChatRooms,
          flaggedMessages,
          activeStudyGroups,
        }}
      />
    )
  } catch (error) {
    console.error('Authentication error in admin dashboard:', error)
    // Only redirect if it's actually an authentication error
    if (error instanceof Error && error.message.includes('Authentication required')) {
      redirect('/admin')
    }
    // For other errors, redirect to login as fallback
    redirect('/admin')
  }
}
