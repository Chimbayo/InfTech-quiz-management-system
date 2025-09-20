import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET - Fetch direct messages for a user
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const otherUserId = searchParams.get('otherUserId')

    if (otherUserId) {
      // Get conversation with specific user
      const messages = await prisma.directMessage.findMany({
        where: {
          OR: [
            { senderId: session.id, recipientId: otherUserId },
            { senderId: otherUserId, recipientId: session.id }
          ],
          isDeleted: false
        },
        include: {
          sender: {
            select: { id: true, name: true, email: true }
          },
          recipient: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      })

      // Mark messages as read
      await prisma.directMessage.updateMany({
        where: {
          senderId: otherUserId,
          recipientId: session.id,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      })

      return NextResponse.json(messages)
    } else {
      // Get all conversations (latest message from each user)
      const conversations = await prisma.$queryRaw`
        SELECT 
          dm.*,
          sender.name as senderName,
          sender.email as senderEmail,
          recipient.name as recipientName,
          recipient.email as recipientEmail
        FROM direct_messages dm
        INNER JOIN users sender ON dm.senderId = sender.id
        INNER JOIN users recipient ON dm.recipientId = recipient.id
        WHERE (dm.senderId = ${session.id} OR dm.recipientId = ${session.id})
          AND dm.isDeleted = false
          AND dm.id IN (
            SELECT MAX(id) 
            FROM direct_messages 
            WHERE (senderId = ${session.id} OR recipientId = ${session.id})
              AND isDeleted = false
            GROUP BY 
              CASE 
                WHEN senderId = ${session.id} THEN recipientId 
                ELSE senderId 
              END
          )
        ORDER BY dm.createdAt DESC
      `

      return NextResponse.json(conversations)
    }
  } catch (error) {
    console.error('Error fetching direct messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Send a direct message
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { recipientId, content } = await request.json()

    if (!recipientId || !content?.trim()) {
      return NextResponse.json({ error: 'Recipient ID and content are required' }, { status: 400 })
    }

    // Verify recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId }
    })

    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
    }

    const message = await prisma.directMessage.create({
      data: {
        content: content.trim(),
        senderId: session.id,
        recipientId
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true }
        },
        recipient: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error sending direct message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
