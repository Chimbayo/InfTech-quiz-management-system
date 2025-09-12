import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// POST /api/chat/announcements - Send announcement to quiz chat room
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and teachers can send announcements
    if (!['ADMIN', 'TEACHER'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { quizId, message } = body

    if (!quizId || !message?.trim()) {
      return NextResponse.json(
        { error: 'Quiz ID and message are required' },
        { status: 400 }
      )
    }

    // Find the quiz and its chat rooms
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        chatRooms: true
      }
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Find the quiz discussion chat room, or create one if it doesn't exist
    let quizChatRoom = quiz.chatRooms.find(room => room.type === 'QUIZ_DISCUSSION')
    
    if (!quizChatRoom) {
      // Create a discussion room for this quiz
      try {
        quizChatRoom = await prisma.chatRoom.create({
          data: {
            name: `${quiz.title} - Discussion`,
            type: 'QUIZ_DISCUSSION',
            quizId: quiz.id,
            createdBy: session.id,
            allowChatDuringQuiz: false,
          }
        })

        // Create welcome system message
        await prisma.chatMessage.create({
          data: {
            roomId: quizChatRoom.id,
            userId: session.id,
            content: `📚 Discussion room created for quiz: ${quiz.title}. Students can join after completing the quiz.`,
            isSystemMessage: true
          }
        })
      } catch (error) {
        console.error('Failed to create discussion room:', error)
        return NextResponse.json(
          { error: 'Failed to create discussion room for this quiz' },
          { status: 500 }
        )
      }
    }

    // Create system announcement message
    const announcement = await prisma.chatMessage.create({
      data: {
        content: `📢 **Announcement from ${session.name}**: ${message.trim()}`,
        userId: session.id,
        roomId: quizChatRoom.id,
        isSystemMessage: true
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

    return NextResponse.json(announcement, { status: 201 })
  } catch (error) {
    console.error('Error sending announcement:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
