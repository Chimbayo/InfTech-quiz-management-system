import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET /api/help-requests - Get help requests
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const quizId = searchParams.get('quizId')
    const status = searchParams.get('status')

    let whereClause: any = {}

    if (quizId) {
      whereClause.quizId = quizId
    }

    if (status) {
      whereClause.status = status
    }

    // Students see their own requests, teachers/admins see all
    if (session.role === 'STUDENT') {
      whereClause.userId = session.id
    }

    const helpRequests = await prisma.helpRequest.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        quiz: {
          select: {
            id: true,
            title: true
          }
        },
        responses: {
          include: {
            responder: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(helpRequests)
  } catch (error) {
    console.error('Error fetching help requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/help-requests - Create help request
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { quizId, topic, question, priority } = body

    if (!quizId || !topic || !question) {
      return NextResponse.json(
        { error: 'Quiz ID, topic, and question are required' },
        { status: 400 }
      )
    }

    const helpRequest = await prisma.helpRequest.create({
      data: {
        userId: session.id,
        quizId,
        topic,
        question,
        priority: priority || 'MEDIUM',
        status: 'OPEN'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        quiz: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    // Create notification message in quiz chat rooms
    const quizChatRooms = await prisma.chatRoom.findMany({
      where: {
        quizId: quizId,
        isActive: true
      }
    })

    for (const room of quizChatRooms) {
      await prisma.chatMessage.create({
        data: {
          roomId: room.id,
          userId: session.id,
          content: `❓ Help Request: "${topic}" - ${question}`,
          isSystemMessage: false,
        }
      })
    }

    // Notify teachers/admins
    const teachers = await prisma.user.findMany({
      where: {
        role: { in: ['TEACHER', 'ADMIN'] }
      }
    })

    for (const teacher of teachers) {
      // Skip notification creation as notification model doesn't exist in schema
    }

    return NextResponse.json(helpRequest, { status: 201 })
  } catch (error) {
    console.error('Error creating help request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
