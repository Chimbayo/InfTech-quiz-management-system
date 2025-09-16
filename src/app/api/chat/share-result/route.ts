import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// POST /api/chat/share-result - Share quiz result in study groups
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { quizId, score, message } = body

    if (!quizId || !score || !message) {
      return NextResponse.json(
        { error: 'Quiz ID, score, and message are required' },
        { status: 400 }
      )
    }

    // Verify quiz exists and user has completed it
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        attempts: {
          where: {
            userId: session.id,
            completedAt: { not: null }
          }
        }
      }
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    if (quiz.attempts.length === 0) {
      return NextResponse.json({ error: 'Quiz not completed' }, { status: 400 })
    }

    // Find study groups the user belongs to for this quiz
    const userStudyGroups = await prisma.studyGroup.findMany({
      where: {
        quizId: quizId,
        members: {
          some: {
            userId: session.id
          }
        }
      },
      include: {
        chatRooms: {
          where: { isActive: true }
        }
      }
    })

    // Share result in each study group chat room
    const sharedMessages = []
    for (const group of userStudyGroups) {
      for (const chatRoom of group.chatRooms) {
        const sharedMessage = await prisma.chatMessage.create({
          data: {
            roomId: chatRoom.id,
            userId: session.id,
            content: `📊 Quiz Result: ${message}`,
            isSystemMessage: false,
          }
        })
        sharedMessages.push(sharedMessage)
      }
    }

    // Also share in general quiz discussion rooms if available
    const quizChatRooms = await prisma.chatRoom.findMany({
      where: {
        quizId: quizId,
        type: 'POST_QUIZ_REVIEW',
        isActive: true
      }
    })

    for (const chatRoom of quizChatRooms) {
      const sharedMessage = await prisma.chatMessage.create({
        data: {
          roomId: chatRoom.id,
          userId: session.id,
          content: `📊 ${message}`,
          isSystemMessage: false
        }
      })
      sharedMessages.push(sharedMessage)
    }

    return NextResponse.json({ 
      success: true, 
      sharedCount: sharedMessages.length,
      message: 'Result shared successfully'
    })

  } catch (error) {
    console.error('Error sharing quiz result:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
