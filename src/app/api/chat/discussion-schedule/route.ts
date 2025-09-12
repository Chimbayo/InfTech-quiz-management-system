import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// POST /api/chat/discussion-schedule - Set discussion time windows for quiz
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and teachers can set discussion schedules
    if (!['ADMIN', 'TEACHER'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { quizId, discussionStartTime, discussionEndTime, allowChatDuringQuiz } = body

    if (!quizId) {
      return NextResponse.json(
        { error: 'Quiz ID is required' },
        { status: 400 }
      )
    }

    // Update quiz chat settings
    const updatedQuiz = await prisma.quiz.update({
      where: { id: quizId },
      data: {
        chatSettings: JSON.stringify({
          discussionStartTime,
          discussionEndTime,
          allowChatDuringQuiz: allowChatDuringQuiz || false
        })
      }
    })

    // Update associated chat room settings
    if (updatedQuiz.enableChat) {
      await prisma.chatRoom.updateMany({
        where: { quizId: quizId },
        data: {
          allowChatDuringQuiz: allowChatDuringQuiz || false
        }
      })
    }

    return NextResponse.json(updatedQuiz)
  } catch (error) {
    console.error('Error setting discussion schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/chat/discussion-schedule - Get discussion schedule for quiz
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const quizId = searchParams.get('quizId')

    if (!quizId) {
      return NextResponse.json(
        { error: 'Quiz ID is required' },
        { status: 400 }
      )
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        title: true,
        enableChat: true,
        chatSettings: true
      }
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    return NextResponse.json(quiz)
  } catch (error) {
    console.error('Error fetching discussion schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
