import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyDatabaseAccess } from '@/lib/database-auth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyDatabaseAccess(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    // Get data from all tables
    const [users, quizzes, quizAttempts, chatRooms, chatMessages, questions, questionOptions, answers] = await Promise.all([
      prisma.user.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.quiz.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          timeLimit: true,
          isActive: true,
          createdAt: true,
          creatorId: true
        }
      }),
      prisma.quizAttempt.findMany({
        take: 20,
        orderBy: { startedAt: 'desc' },
        select: {
          id: true,
          score: true,
          passed: true,
          startedAt: true,
          completedAt: true,
          userId: true,
          quizId: true
        }
      }),
      prisma.chatRoom.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true,
          createdAt: true
        }
      }),
      prisma.chatMessage.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          content: true,
          userId: true,
          roomId: true,
          createdAt: true,
          isSystemMessage: true
        }
      }),
      prisma.question.findMany({
        take: 20,
        orderBy: { order: 'asc' },
        select: {
          id: true,
          text: true,
          type: true,
          quizId: true,
          order: true
        }
      }),
      prisma.questionOption.findMany({
        take: 20,
        select: {
          id: true,
          text: true,
          isCorrect: true,
          order: true,
          questionId: true
        }
      }),
      prisma.answer.findMany({
        take: 20,
        select: {
          id: true,
          questionId: true,
          attemptId: true,
          selectedOptionId: true,
          isCorrect: true
        }
      })
    ])

    // Get counts for each table
    const [userCount, quizCount, attemptCount, roomCount, messageCount, questionCount, optionCount, answerCount] = await Promise.all([
      prisma.user.count(),
      prisma.quiz.count(),
      prisma.quizAttempt.count(),
      prisma.chatRoom.count(),
      prisma.chatMessage.count(),
      prisma.question.count(),
      prisma.questionOption.count(),
      prisma.answer.count()
    ])

    const tables = [
      {
        name: 'users',
        count: userCount,
        records: users
      },
      {
        name: 'quizzes',
        count: quizCount,
        records: quizzes
      },
      {
        name: 'quizAttempts',
        count: attemptCount,
        records: quizAttempts
      },
      {
        name: 'chatRooms',
        count: roomCount,
        records: chatRooms
      },
      {
        name: 'chatMessages',
        count: messageCount,
        records: chatMessages
      },
      {
        name: 'questions',
        count: questionCount,
        records: questions
      },
      {
        name: 'questionOptions',
        count: optionCount,
        records: questionOptions
      },
      {
        name: 'answers',
        count: answerCount,
        records: answers
      }
    ]

    return NextResponse.json({ tables })

  } catch (error) {
    console.error('Database viewer error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch database data' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
