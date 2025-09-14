import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

// GET /api/users/students - Get all registered students with detailed statistics (Admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole('ADMIN')

    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT'
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            attempts: true,
            studyGroupMemberships: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Get detailed statistics for each student
    const studentsWithStats = await Promise.all(
      students.map(async (student) => {
        const attempts = await prisma.quizAttempt.findMany({
          where: { userId: student.id },
          select: {
            id: true,
            score: true,
            passed: true,
            completedAt: true,
            timeSpent: true,
            quiz: {
              select: {
                id: true,
                title: true,
                passingScore: true,
                timeLimit: true,
              }
            }
          },
          orderBy: { completedAt: 'desc' },
        })

        const totalAttempts = attempts.length
        const passedAttempts = attempts.filter(attempt => attempt.passed).length
        const failedAttempts = totalAttempts - passedAttempts
        const averageScore = totalAttempts > 0 
          ? attempts.reduce((sum, attempt) => sum + attempt.score, 0) / totalAttempts 
          : 0
        const passRate = totalAttempts > 0 ? (passedAttempts / totalAttempts) * 100 : 0
        
        // Calculate improvement trend
        let improvementTrend: 'up' | 'down' | 'stable' = 'stable'
        if (attempts.length >= 3) {
          const recentScores = attempts.slice(0, 3).map(a => a.score)
          const olderScores = attempts.slice(3, 6).map(a => a.score)
          if (recentScores.length >= 2 && olderScores.length >= 2) {
            const recentAvg = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length
            const olderAvg = olderScores.reduce((sum, score) => sum + score, 0) / olderScores.length
            if (recentAvg > olderAvg + 5) improvementTrend = 'up'
            else if (recentAvg < olderAvg - 5) improvementTrend = 'down'
          }
        }

        // Calculate streak count
        let streakCount = 0
        if (attempts.length > 0) {
          for (let i = 0; i < attempts.length; i++) {
            if (attempts[i].passed) {
              streakCount++
            } else {
              break
            }
          }
        }

        // Calculate total time spent
        const totalTimeSpent = attempts.reduce((sum, attempt) => sum + (attempt.timeSpent || 0), 0)

        // Determine performance level
        let performanceLevel: 'excellent' | 'good' | 'average' | 'needs_improvement' = 'needs_improvement'
        if (totalAttempts > 0) {
          if (averageScore >= 85 && passRate >= 80) performanceLevel = 'excellent'
          else if (averageScore >= 70 && passRate >= 60) performanceLevel = 'good'
          else if (averageScore >= 50 && passRate >= 40) performanceLevel = 'average'
        }

        // Get recent scores for trend visualization
        const recentScores = attempts.slice(0, 5).map(attempt => attempt.score)

        return {
          ...student,
          statistics: {
            totalAttempts,
            passedAttempts,
            failedAttempts,
            passRate: Math.round(passRate),
            averageScore: Math.round(averageScore),
            lastActivity: attempts.length > 0 ? attempts[0].completedAt : null,
            improvementTrend,
            streakCount,
            totalTimeSpent,
            favoriteSubject: null, // Could be implemented with quiz categories
          },
          recentScores,
          performanceLevel,
          quizAttempts: attempts, // Include detailed quiz attempts
        }
      })
    )

    return NextResponse.json(studentsWithStats)
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
