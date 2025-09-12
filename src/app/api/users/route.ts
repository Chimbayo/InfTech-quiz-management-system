import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { UserRole } from '@/types'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Only admins can access this endpoint
    const session = await requireRole('ADMIN')
    
    // Get all users with their quiz attempt statistics
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            attempts: true,
            createdQuizzes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get additional statistics for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const attempts = await prisma.quizAttempt.findMany({
          where: { userId: user.id },
          select: {
            score: true,
            passed: true,
            completedAt: true,
          },
        })

        const totalAttempts = attempts.length
        const passedAttempts = attempts.filter(attempt => attempt.passed).length
        const averageScore = totalAttempts > 0 
          ? attempts.reduce((sum, attempt) => sum + attempt.score, 0) / totalAttempts 
          : 0

        return {
          ...user,
          statistics: {
            totalAttempts,
            passedAttempts,
            failedAttempts: totalAttempts - passedAttempts,
            passRate: totalAttempts > 0 ? (passedAttempts / totalAttempts) * 100 : 0,
            averageScore: Math.round(averageScore),
            lastActivity: attempts.length > 0 
              ? attempts.sort((a, b) => 
                  new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime()
                )[0].completedAt
              : null,
          },
        }
      })
    )

    return NextResponse.json(usersWithStats)
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
