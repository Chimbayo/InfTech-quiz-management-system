import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { checkChatRoomAccess, getAccessDeniedMessage } from '@/lib/chat-access-control'

// GET /api/chat/rooms/[id] - Get room details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const room = await prisma.chatRoom.findUnique({
      where: { id },
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

    return NextResponse.json(room)
  } catch (error) {
    console.error('Error fetching room:', error)
    return NextResponse.json(
      { error: 'Failed to fetch room' },
      { status: 500 }
    )
  }
}

// PUT /api/chat/rooms/[id] - Update room settings
export async function PUT(
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
    const { name, isActive } = body

    // Check if user has permission to update this room
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: { creator: true }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Only room creator, teachers, or admins can update rooms
    if (
      room.createdBy !== session.id &&
      !['ADMIN', 'TEACHER'].includes(session.role)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updatedRoom = await prisma.chatRoom.update({
      where: { id: roomId },
      data: {
        ...(name && { name }),
        ...(typeof isActive === 'boolean' && { isActive })
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

    return NextResponse.json(updatedRoom)
  } catch (error) {
    console.error('Error updating chat room:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/chat/rooms/[id] - Delete a room (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can delete rooms
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const roomId = params.id

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    await prisma.chatRoom.delete({
      where: { id: roomId }
    })

    return NextResponse.json({ message: 'Room deleted successfully' })
  } catch (error) {
    console.error('Error deleting chat room:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
