import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { filterAccessibleRooms } from '@/lib/chat-access-control'

// GET /api/chat/rooms - Get all rooms or rooms for a user
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const quizId = searchParams.get('quizId')

    let whereClause: any = {
      isActive: true
    }

    // Filter by type if specified
    if (type) {
      whereClause.type = type
    }

    // Filter by quiz if specified
    if (quizId) {
      whereClause.quizId = quizId
    }

    const rooms = await prisma.chatRoom.findMany({
      where: whereClause,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        quiz: {
          select: {
            id: true,
            title: true
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Filter rooms based on user's access permissions
    const filteredRooms = await filterAccessibleRooms(rooms, session.id, session.role)

    return NextResponse.json(filteredRooms)
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    )
  }
}

// POST /api/chat/rooms - Create a new room
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and teachers can create rooms
    if (!['ADMIN', 'TEACHER'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, type, quizId, allowChatDuringQuiz } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }

    const room = await prisma.chatRoom.create({
      data: {
        name,
        type,
        quizId,
        allowChatDuringQuiz: allowChatDuringQuiz || false,
        createdBy: session.id,
        isActive: true
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
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

    return NextResponse.json(room, { status: 201 })
  } catch (error) {
    console.error('Error creating chat room:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
