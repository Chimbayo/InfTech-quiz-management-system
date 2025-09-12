import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getBroadcastInstance } from '@/lib/realtime-broadcast'
import { initializeWebSocket } from '@/lib/websocket'

export async function POST(request: NextRequest) {
  try {
    const { quizId, type, message, sentBy } = await request.json()

    if (!quizId || !type || !message || !sentBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify user has permission to broadcast
    const user = await prisma.user.findUnique({
      where: { id: sentBy },
      select: { role: true }
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Get WebSocket instance (this will be available after initialization)
    const io = (global as any).io
    if (io) {
      const broadcast = getBroadcastInstance(io)
      const result = await broadcast.broadcastQuizStatus({
        quizId,
        type,
        message,
        sentBy
      })

      return NextResponse.json({ success: true, broadcast: result })
    }

    return NextResponse.json(
      { error: 'WebSocket not initialized' },
      { status: 500 }
    )

  } catch (error) {
    console.error('Error in quiz broadcast:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const quizId = searchParams.get('quizId')

    if (!quizId) {
      return NextResponse.json(
        { error: 'Quiz ID required' },
        { status: 400 }
      )
    }

    const broadcasts = await prisma.quizBroadcast.findMany({
      where: { quizId },
      include: {
        sender: {
          select: { name: true, role: true }
        },
        quiz: {
          select: { title: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 20
    })

    return NextResponse.json({ broadcasts })

  } catch (error) {
    console.error('Error fetching quiz broadcasts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
