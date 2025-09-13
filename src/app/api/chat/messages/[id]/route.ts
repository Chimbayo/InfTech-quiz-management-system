import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// PUT /api/chat/messages/[id] - Edit a message or flag it
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const messageId = params.id
    const body = await request.json()
    const { content, reason } = body

    // Check if message exists
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: {
        user: true
      }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // If content is provided, this is an edit operation
    if (content) {
      // Only message owner can edit
      if (message.userId !== session.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      if (!content.trim()) {
        return NextResponse.json(
          { error: 'Message content cannot be empty' },
          { status: 400 }
        )
      }

      // Update the message
      const updatedMessage = await prisma.chatMessage.update({
        where: { id: messageId },
        data: {
          content: content.trim()
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

      return NextResponse.json(updatedMessage)
    }

    // If reason is provided, this is a flag operation
    if (reason) {
      // Only admins and teachers can flag messages
      if (!['ADMIN', 'TEACHER'].includes(session.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      // Flag the message
      const flaggedMessage = await prisma.chatMessage.update({
        where: { id: messageId },
        data: {
          isFlagged: true,
          flaggedReason: reason,
          flaggedAt: new Date(),
          flaggedBy: session.id
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          room: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      return NextResponse.json(flaggedMessage)
    }

    return NextResponse.json(
      { error: 'Either content or reason must be provided' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/chat/messages/[id] - Delete a message
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const messageId = params.id

    // Check if message exists
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: {
        user: true
      }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Only message owner or admins can delete messages
    if (message.userId !== session.id && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Soft delete the message
    const deletedMessage = await prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: session.id
      }
    })

    return NextResponse.json({ message: 'Message deleted successfully' })
  } catch (error) {
    console.error('Error deleting message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
