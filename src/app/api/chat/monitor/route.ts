import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { detectSuspiciousKeywords, analyzeMessageTiming, generateIntegrityReport, SuspiciousActivity } from '@/lib/academic-integrity'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// POST /api/chat/monitor - Monitor chat messages for academic integrity
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !['ADMIN', 'TEACHER'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId, messageId, content, userId } = await request.json()

    if (!roomId || !content || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const activities: SuspiciousActivity[] = []

    // Check for suspicious keywords
    const keywordAnalysis = detectSuspiciousKeywords(content)
    if (keywordAnalysis.isSuspicious) {
      activities.push({
        type: 'KEYWORD_MATCH',
        severity: keywordAnalysis.severity,
        description: `Suspicious keywords detected: ${keywordAnalysis.matchedKeywords.join(', ')}`,
        evidence: keywordAnalysis.matchedKeywords,
        timestamp: new Date(),
        userId,
        roomId,
        messageId,
      })
    }

    // Get room and check if it's quiz-related
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: { quiz: true }
    })

    if (room?.quiz) {
      // Check for timing violations if there are active quiz attempts
      const activeAttempts = await prisma.quizAttempt.findMany({
        where: {
          quizId: room.quiz.id,
          completedAt: null,
          userId
        }
      })

      if (activeAttempts.length > 0 && !room.allowChatDuringQuiz) {
        activities.push({
          type: 'TIMING_VIOLATION',
          severity: 'HIGH',
          description: 'Chat message sent during active quiz attempt',
          evidence: [`Active quiz attempt: ${activeAttempts[0].id}`],
          timestamp: new Date(),
          userId,
          roomId,
          messageId,
        })
      }
    }

    // Log all suspicious activities
    for (const activity of activities) {
      try {
        await prisma.suspiciousActivity.create({
          data: {
            type: activity.type,
            severity: activity.severity,
            description: activity.description,
            evidence: JSON.stringify(activity.evidence),
            userId: activity.userId,
            roomId: activity.roomId,
            messageId: activity.messageId,
            timestamp: activity.timestamp,
          },
        })
      } catch (error) {
        console.error('Failed to log suspicious activity:', error)
      }
    }

    const report = generateIntegrityReport(activities)

    return NextResponse.json({
      flagged: activities.length > 0,
      activities,
      report,
      keywordAnalysis
    })
  } catch (error) {
    console.error('Error monitoring chat:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/chat/monitor - Get suspicious activities for admin review
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !['ADMIN', 'TEACHER'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')
    const severity = searchParams.get('severity')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (roomId) where.roomId = roomId
    if (severity) where.severity = severity

    const activities = await prisma.suspiciousActivity.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        room: {
          select: { id: true, name: true, type: true }
        },
        message: {
          select: { id: true, content: true, createdAt: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    })

    return NextResponse.json({ activities })
  } catch (error) {
    console.error('Error fetching suspicious activities:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
