import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MessageModerationDashboard } from '@/components/admin/message-moderation-dashboard'

export default async function MessageModerationPage() {
  try {
    const session = await requireRole('ADMIN')
    
    // Fetch flagged messages with user and room information
    const flaggedMessagesRaw = await prisma.chatMessage.findMany({
      where: { 
        isFlagged: true,
        isDeleted: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        },
        room: {
          select: {
            id: true,
            name: true,
            type: true,
            quiz: {
              select: {
                id: true,
                title: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    })

    // Transform flagged messages to match expected interface
    const flaggedMessages = flaggedMessagesRaw.map(message => ({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      isFlagged: message.isFlagged,
      flaggedReason: message.flaggedReason,
      user: message.user,
      chatRoom: message.room
    }))

    // Fetch recent messages for context (last 100 messages)
    const recentMessagesRaw = await prisma.chatMessage.findMany({
      where: {
        isDeleted: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          }
        },
        room: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // Transform recent messages to match expected interface
    const recentMessages = recentMessagesRaw.map(message => ({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      user: message.user,
      chatRoom: message.room
    }))

    // Get moderation statistics
    const stats = {
      totalFlagged: flaggedMessages.length,
      totalMessages: await prisma.chatMessage.count({ where: { isDeleted: false } }),
      totalDeleted: await prisma.chatMessage.count({ where: { isDeleted: true } }),
      flaggedToday: await prisma.chatMessage.count({
        where: {
          isFlagged: true,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    }

    return (
      <MessageModerationDashboard
        user={session}
        flaggedMessages={flaggedMessages}
        recentMessages={recentMessages}
        stats={stats}
      />
    )
  } catch (error) {
    console.error('Authentication error in message moderation:', error)
    redirect('/admin')
  }
}
