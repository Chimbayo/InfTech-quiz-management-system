import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

// GET /api/chat/discussion-schedule/[roomId] - Get discussion schedule for a room
export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await requireRole('ADMIN')
    const { roomId } = params

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            chatSettings: true,
            startAt: true,
            timeLimit: true
          }
        }
      }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Parse chat settings if available
    let chatSettings = null
    if (room.quiz?.chatSettings) {
      try {
        chatSettings = JSON.parse(room.quiz.chatSettings)
      } catch (error) {
        console.error('Error parsing chat settings:', error)
      }
    }

    return NextResponse.json({
      room,
      chatSettings,
      currentMode: getCurrentChatMode(room.quiz, chatSettings)
    })
  } catch (error) {
    console.error('Error fetching discussion schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/chat/discussion-schedule/[roomId] - Update discussion schedule
export async function PUT(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await requireRole('ADMIN')
    const { roomId } = params
    const body = await request.json()

    const {
      preQuizDiscussion,
      postQuizDiscussion,
      duringQuizRestriction,
      allowedDiscussionTopics
    } = body

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: { quiz: true }
    })

    if (!room || !room.quiz) {
      return NextResponse.json({ error: 'Quiz room not found' }, { status: 404 })
    }

    const chatSettings = {
      preQuizDiscussion: {
        enabled: preQuizDiscussion?.enabled || false,
        startTime: preQuizDiscussion?.startTime || null,
        endTime: preQuizDiscussion?.endTime || null,
        topics: preQuizDiscussion?.topics || []
      },
      postQuizDiscussion: {
        enabled: postQuizDiscussion?.enabled || false,
        startTime: postQuizDiscussion?.startTime || null,
        endTime: postQuizDiscussion?.endTime || null,
        allowAnswerSharing: postQuizDiscussion?.allowAnswerSharing || false
      },
      duringQuizRestriction: {
        enabled: duringQuizRestriction?.enabled || true,
        allowedMessageTypes: duringQuizRestriction?.allowedMessageTypes || [],
        emergencyContactAllowed: duringQuizRestriction?.emergencyContactAllowed || true
      },
      allowedDiscussionTopics: allowedDiscussionTopics || []
    }

    await prisma.quiz.update({
      where: { id: room.quiz.id },
      data: {
        chatSettings: JSON.stringify(chatSettings)
      }
    })

    return NextResponse.json({ 
      success: true, 
      chatSettings,
      currentMode: getCurrentChatMode(room.quiz, chatSettings)
    })
  } catch (error) {
    console.error('Error updating discussion schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getCurrentChatMode(quiz: any, chatSettings: any) {
  if (!quiz || !chatSettings) return 'normal'

  const now = new Date()
  const quizStart = quiz.startAt ? new Date(quiz.startAt) : null
  const quizEnd = quizStart && quiz.timeLimit 
    ? new Date(quizStart.getTime() + quiz.timeLimit * 60000) 
    : null

  // Check if we're in quiz time
  if (quizStart && quizEnd && now >= quizStart && now <= quizEnd) {
    return chatSettings.duringQuizRestriction?.enabled ? 'exam' : 'normal'
  }

  // Check if we're in pre-quiz discussion time
  if (chatSettings.preQuizDiscussion?.enabled) {
    const preStart = chatSettings.preQuizDiscussion.startTime 
      ? new Date(chatSettings.preQuizDiscussion.startTime) 
      : null
    const preEnd = chatSettings.preQuizDiscussion.endTime 
      ? new Date(chatSettings.preQuizDiscussion.endTime) 
      : quizStart

    if (preStart && preEnd && now >= preStart && now <= preEnd) {
      return 'pre-quiz'
    }
  }

  // Check if we're in post-quiz discussion time
  if (chatSettings.postQuizDiscussion?.enabled && quizEnd) {
    const postStart = chatSettings.postQuizDiscussion.startTime 
      ? new Date(chatSettings.postQuizDiscussion.startTime) 
      : quizEnd
    const postEnd = chatSettings.postQuizDiscussion.endTime 
      ? new Date(chatSettings.postQuizDiscussion.endTime) 
      : null

    if (postStart && now >= postStart && (!postEnd || now <= postEnd)) {
      return 'post-quiz'
    }
  }

  return 'normal'
}
