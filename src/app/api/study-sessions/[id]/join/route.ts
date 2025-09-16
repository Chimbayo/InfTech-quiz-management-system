import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// POST /api/study-sessions/[id]/join - Join study session
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionId = params.id

    // Check if session exists and is not full
    const studySession = await prisma.studySession.findUnique({
      where: { id: sessionId },
      include: {
        _count: {
          select: {
            participants: true
          }
        }
      }
    })

    if (!studySession) {
      return NextResponse.json({ error: 'Study session not found' }, { status: 404 })
    }

    // Check if user is already a participant
    const existingParticipant = await prisma.studySessionParticipant.findFirst({
      where: {
        sessionId: sessionId,
        userId: session.id
      }
    })

    if (existingParticipant) {
      return NextResponse.json({ error: 'Already joined this session' }, { status: 400 })
    }

    // Add user as participant
    await prisma.studySessionParticipant.create({
      data: {
        sessionId: sessionId,
        userId: session.id
      }
    })

    return NextResponse.json({ success: true, message: 'Joined study session successfully' })
  } catch (error) {
    console.error('Error joining study session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
