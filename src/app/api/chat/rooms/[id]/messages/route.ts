import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { monitorMessage } from '@/lib/academic-integrity'
import { checkChatRoomAccess, getAccessDeniedMessage } from '@/lib/chat-access-control'

// GET /api/chat/rooms/[id]/messages - Get messages for a room
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roomId = params.id
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Check if room exists and user has access
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        quiz: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Check access permissions
    const hasAccess = await checkChatRoomAccess(session.id, session.role, room.type, room.quizId)
    if (!hasAccess) {
      return NextResponse.json({ 
        error: getAccessDeniedMessage(room.type) 
      }, { status: 403 })
    }

    const messages = await prisma.chatMessage.findMany({
      where: { roomId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    return NextResponse.json(messages.reverse())
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST /api/chat/rooms/[id]/messages - Send a message to a room
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roomId = params.id
    const body = await request.json()
    const { content, replyToId } = body

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    // Check if room exists and is active
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        quiz: true
      }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (!room.isActive) {
      return NextResponse.json({ error: 'Room is not active' }, { status: 403 })
    }

    // Check access permissions
    const hasAccess = await checkChatRoomAccess(session.id, session.role, room.type, room.quizId)
    if (!hasAccess) {
      return NextResponse.json({ 
        error: getAccessDeniedMessage(room.type) 
      }, { status: 403 })
    }

    // Academic integrity check - monitor the message
    const monitoringResult = await monitorMessage(content, session.id, roomId)

    // Create the message
    const message = await prisma.chatMessage.create({
      data: {
        roomId,
        userId: session.id,
        content: content.trim(),
        replyToId: replyToId || undefined
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
