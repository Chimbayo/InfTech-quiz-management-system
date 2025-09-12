import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { z } from 'zod'
import { UserRole, QuestionType } from '@/types'
import { getBroadcastInstance } from '@/lib/realtime-broadcast'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const createQuizSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  passingScore: z.number().min(0).max(100),
  timeLimit: z.number().min(1).optional(),
  isActive: z.boolean().optional(),
  startAt: z.string().datetime().optional(),
  creatorId: z.string(),
  enableChat: z.boolean().optional(),
  chatRoomName: z.string().optional(),
  allowChatDuringQuiz: z.boolean().optional(),
  enableStudyGroup: z.boolean().optional(),
  questions: z.array(z.object({
    text: z.string().min(1),
    type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE']),
    options: z.array(z.object({
      text: z.string().min(1),
      isCorrect: z.boolean(),
    })).min(2),
  }).refine((question) => {
    // Ensure exactly one option is marked as correct
    const correctCount = question.options.filter(option => option.isCorrect).length;
    return correctCount === 1;
  }, {
    message: 'Exactly one option must be marked as correct',
  })).min(1),
})

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole('ADMIN')
    const body = await request.json()
    const data = createQuizSchema.parse(body)

    // Verify the creator is the authenticated user
    if (data.creatorId !== session.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const quiz = await prisma.quiz.create({
      data: {
        title: data.title,
        description: data.description,
        passingScore: data.passingScore,
        timeLimit: data.timeLimit,
        isActive: data.isActive ?? false,
        enableChat: data.enableChat ?? false,
        startAt: data.startAt ? new Date(data.startAt) : null,
        creatorId: data.creatorId,
        questions: {
          create: data.questions.map((question, index) => ({
            text: question.text,
            type: question.type,
            order: index + 1,
            options: {
              create: question.options.map((option, optionIndex) => ({
                text: option.text,
                isCorrect: option.isCorrect,
                order: optionIndex + 1,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    })

    // Auto-create chat room if enabled
    if (data.enableChat) {
      try {
        const roomName = data.chatRoomName || `${quiz.title} - Discussion`
        
        const chatRoom = await prisma.chatRoom.create({
          data: {
            name: roomName,
            type: 'QUIZ_DISCUSSION',
            quizId: quiz.id,
            createdBy: data.creatorId,
            allowChatDuringQuiz: data.allowChatDuringQuiz || false,
            isActive: true,
          }
        })

        // Create system message
        await prisma.chatMessage.create({
          data: {
            roomId: chatRoom.id,
            userId: data.creatorId,
            content: `📚 Discussion room created for quiz: ${quiz.title}. Students can join after completing the quiz.`,
            isSystemMessage: true
          }
        })

        // Create study group if enabled
        if (data.enableStudyGroup) {
          const studyGroup = await prisma.studyGroup.create({
            data: {
              name: `${quiz.title} - Study Group`,
              description: `Collaborative study group for ${quiz.title}`,
              quizId: quiz.id,
              createdBy: data.creatorId,
            }
          })

          // Create study group chat room
          const studyGroupRoom = await prisma.chatRoom.create({
            data: {
              name: `${quiz.title} - Study Group`,
              type: 'STUDY_GROUP',
              studyGroupId: studyGroup.id,
              createdBy: data.creatorId,
              allowChatDuringQuiz: true, // Study groups can chat during quiz
              isActive: true,
            }
          })

          await prisma.chatMessage.create({
            data: {
              roomId: studyGroupRoom.id,
              userId: data.creatorId,
              content: `👥 Study group created! Collaborate and help each other learn about: ${quiz.title}`,
              isSystemMessage: true
            }
          })
        }

        console.log(`Auto-created chat room for quiz: ${quiz.title}`)
      } catch (error) {
        console.warn('Failed to create chat room for quiz:', error)
        // Don't fail quiz creation if chat room creation fails
      }
    }

    // Broadcast quiz creation if active
    if (quiz.isActive) {
      try {
        // Initialize WebSocket if not already done
        const initResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/socketio`, {
          method: 'POST'
        })
        
        const io = (global as any).io
        if (io) {
          const broadcast = getBroadcastInstance(io)
          await broadcast.broadcastQuizStatus({
            quizId: quiz.id,
            type: 'PUBLISHED',
            message: `New quiz "${quiz.title}" has been published and is now available!`,
            sentBy: data.creatorId
          })

          // Also broadcast as a general notification to all students
          io.emit('new-quiz-notification', {
            id: `quiz-${quiz.id}`,
            message: `📚 New quiz available: "${quiz.title}"`,
            quizId: quiz.id,
            quizTitle: quiz.title,
            createdAt: quiz.createdAt
          })
          
          console.log('Quiz creation notification sent:', quiz.title)
        } else {
          console.warn('WebSocket IO not available for broadcasting')
        }
      } catch (error) {
        console.warn('Failed to broadcast quiz creation:', error)
      }
    }

    return NextResponse.json(quiz)
  } catch (error) {
    console.error('Create quiz error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')

    let quizzes

    if (role === 'student') {
      // Visible to students if active
      quizzes = await prisma.quiz.findMany({
        where: {
          isActive: true,
        },
        include: {
          creator: {
            select: { name: true },
          },
          chatRooms: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          _count: {
            select: {
              questions: true,
              attempts: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    } else {
      // Get quizzes for admin (requires authentication)
      const session = await requireRole('ADMIN')
      quizzes = await prisma.quiz.findMany({
        where: { creatorId: session.id },
        include: {
          _count: {
            select: {
              questions: true,
              attempts: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    }

    return NextResponse.json(quizzes)
  } catch (error) {
    console.error('Get quizzes error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
