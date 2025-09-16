import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// POST /api/quizzes/[id]/complete - Handle quiz completion and activate post-quiz rooms
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const quizId = params.id

    // Verify quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        chatRooms: {
          where: { type: 'POST_QUIZ_REVIEW' }
        }
      }
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Check if user has completed the quiz
    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        userId: session.id,
        quizId: quizId,
        completedAt: { not: null }
      }
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Quiz not completed' }, { status: 400 })
    }

    // Activate post-quiz review room if it exists and is not already active
    const postQuizRoom = quiz.chatRooms.find(room => room.type === 'POST_QUIZ_REVIEW')
    
    if (postQuizRoom && !postQuizRoom.isActive) {
      await prisma.chatRoom.update({
        where: { id: postQuizRoom.id },
        data: { isActive: true }
      })

      // Add activation message
      await prisma.chatMessage.create({
        data: {
          roomId: postQuizRoom.id,
          userId: session.id,
          content: `🎉 Post-Quiz Review is now active! The first student has completed "${quiz.title}". Feel free to discuss answers, ask questions, and learn together!`,
          isSystemMessage: true
        }
      })

      console.log(`Activated post-quiz review room for: ${quiz.title}`)
    }

    // Deactivate pre-quiz discussion for this user (they can no longer access it)
    const preQuizRoom = await prisma.chatRoom.findFirst({
      where: {
        quizId: quizId,
        type: 'PRE_QUIZ_DISCUSSION'
      }
    })

    return NextResponse.json({ 
      success: true, 
      postQuizRoomActivated: postQuizRoom && !postQuizRoom.isActive,
      postQuizRoomId: postQuizRoom?.id
    })

  } catch (error) {
    console.error('Error handling quiz completion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
