import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getBroadcastInstance } from '@/lib/realtime-broadcast'

export async function POST(request: NextRequest) {
  try {
    const { action, sessionId, userId, ...data } = await request.json()

    if (!action || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const io = (global as any).io
    if (!io) {
      return NextResponse.json(
        { error: 'WebSocket not initialized' },
        { status: 500 }
      )
    }

    const broadcast = getBroadcastInstance(io)

    switch (action) {
      case 'create':
        const newSession = await prisma.studySession.create({
          data: {
            name: data.name,
            description: data.description,
            studyGroupId: data.studyGroupId,
            quizId: data.quizId,
            createdBy: userId,
            startTime: new Date(data.startTime),
            endTime: data.endTime ? new Date(data.endTime) : null
          }
        })

        await broadcast.broadcastStudySessionUpdate(newSession.id, {
          type: 'SESSION_STARTED',
          message: `Study session "${data.name}" has started`,
          data: { sessionId: newSession.id }
        })

        return NextResponse.json({ success: true, session: newSession })

      case 'join':
        if (!userId) {
          return NextResponse.json(
            { error: 'User ID required' },
            { status: 400 }
          )
        }

        await prisma.studySessionParticipant.upsert({
          where: {
            sessionId_userId: {
              sessionId,
              userId
            }
          },
          update: {
            isActive: true,
            leftAt: null
          },
          create: {
            sessionId,
            userId,
            isActive: true
          }
        })

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true }
        })

        await broadcast.broadcastStudySessionUpdate(sessionId, {
          type: 'PARTICIPANT_JOINED',
          userId,
          message: `${user?.name} joined the study session`,
          data: { userId, userName: user?.name }
        })

        return NextResponse.json({ success: true })

      case 'leave':
        if (!userId) {
          return NextResponse.json(
            { error: 'User ID required' },
            { status: 400 }
          )
        }

        await prisma.studySessionParticipant.updateMany({
          where: {
            sessionId,
            userId
          },
          data: {
            isActive: false,
            leftAt: new Date()
          }
        })

        const leavingUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true }
        })

        await broadcast.broadcastStudySessionUpdate(sessionId, {
          type: 'PARTICIPANT_LEFT',
          userId,
          message: `${leavingUser?.name} left the study session`,
          data: { userId, userName: leavingUser?.name }
        })

        return NextResponse.json({ success: true })

      case 'end':
        await prisma.studySession.update({
          where: { id: sessionId },
          data: {
            isActive: false,
            endTime: new Date()
          }
        })

        await broadcast.broadcastStudySessionUpdate(sessionId, {
          type: 'SESSION_ENDED',
          message: 'Study session has ended',
          data: { sessionId }
        })

        return NextResponse.json({ success: true })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error in study session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const studyGroupId = searchParams.get('studyGroupId')

    if (sessionId) {
      const session = await prisma.studySession.findUnique({
        where: { id: sessionId },
        include: {
          creator: { select: { name: true, role: true } },
          studyGroup: { select: { name: true } },
          quiz: { select: { title: true } },
          participants: {
            where: { isActive: true },
            include: {
              user: { select: { name: true, role: true } }
            }
          }
        }
      })

      return NextResponse.json({ session })
    }

    if (studyGroupId) {
      const sessions = await prisma.studySession.findMany({
        where: { studyGroupId },
        include: {
          creator: { select: { name: true, role: true } },
          participants: {
            where: { isActive: true },
            include: {
              user: { select: { name: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json({ sessions })
    }

    const activeSessions = await prisma.studySession.findMany({
      where: { isActive: true },
      include: {
        creator: { select: { name: true, role: true } },
        studyGroup: { select: { name: true } },
        quiz: { select: { title: true } },
        participants: {
          where: { isActive: true },
          include: {
            user: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ sessions: activeSessions })

  } catch (error) {
    console.error('Error fetching study sessions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
