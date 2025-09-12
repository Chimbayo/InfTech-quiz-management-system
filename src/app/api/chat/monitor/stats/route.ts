import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET /api/chat/monitor/stats - Get academic integrity statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and teachers can view integrity stats
    if (!['ADMIN', 'TEACHER'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get total flags
    const totalFlags = await prisma.suspiciousActivity.count()

    // Get high severity flags
    const highSeverityFlags = await prisma.suspiciousActivity.count({
      where: { severity: 'HIGH' }
    })

    // Get resolved flags (temporarily disabled until schema sync)
    const resolvedFlags = 0

    // Get active quiz violations (activities during active quiz attempts)
    const activeQuizViolations = await prisma.suspiciousActivity.count({
      where: {
        type: 'TIMING_VIOLATION'
      }
    })

    const stats = {
      totalFlags,
      highSeverityFlags,
      resolvedFlags,
      activeQuizViolations
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching integrity stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
