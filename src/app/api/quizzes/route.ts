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
  // Exam-specific fields
  isExam: z.boolean().optional(),
  examEndTime: z.string().optional().refine((val) => {
    if (!val) return true; // Optional field
    // Accept both ISO datetime and datetime-local format
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d{3})?Z?$/;
    const localRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
    return isoRegex.test(val) || localRegex.test(val);
  }, {
    message: "Invalid datetime format"
  }),
  examDuration: z.number().min(1).optional(),
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
        // Exam-specific fields
        isExam: data.isExam ?? false,
        examEndTime: data.examEndTime ? new Date(data.examEndTime) : null,
        examDuration: data.examDuration,
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

    // Handle chat room creation based on quiz/exam type
    if (quiz.isExam) {
      console.log(`📝 Exam created: ${quiz.title} - No chat rooms will be created until exam ends`)
      // For exams, we don't create any chat rooms immediately
      // They will be created after the exam end time via a scheduled job
      
      // Store exam metadata for later processing
      console.log(`Exam end time: ${quiz.examEndTime}`)
      console.log(`Chat rooms will be auto-created after exam ends`)
    } else {
      // Auto-create chat rooms for regular quizzes
      console.log(`Creating chat rooms for quiz: ${quiz.title}`)
      try {
        // Create Pre-Quiz Discussion Room
        console.log('Creating pre-quiz discussion room...')
        const preQuizRoom = await prisma.chatRoom.create({
          data: {
            name: `${quiz.title} - Pre-Quiz Discussion`,
            description: 'Discuss quiz topics and prepare together before attempting',
            type: 'PRE_QUIZ_DISCUSSION',
            quizId: quiz.id,
            createdBy: data.creatorId,
            allowChatDuringQuiz: false,
            isActive: true,
          }
        })

        await prisma.chatMessage.create({
          data: {
            roomId: preQuizRoom.id,
            userId: data.creatorId,
            content: `📚 Pre-Quiz Discussion for "${quiz.title}" is now open! Discuss topics, ask questions, and prepare together before attempting the quiz.`,
            isSystemMessage: true
          }
        })
        console.log('Pre-quiz room created successfully')

        // Create Post-Quiz Review Room (initially inactive)
        console.log('Creating post-quiz review room...')
        const postQuizRoom = await prisma.chatRoom.create({
          data: {
            name: `${quiz.title} - Post-Quiz Review`,
            description: 'Review answers and discuss explanations after completing the quiz',
            type: 'POST_QUIZ_REVIEW',
            quizId: quiz.id,
            createdBy: data.creatorId,
            allowChatDuringQuiz: false,
            isActive: false, // Will be activated when first student completes quiz
          }
        })

        await prisma.chatMessage.create({
          data: {
            roomId: postQuizRoom.id,
            userId: data.creatorId,
            content: `🎯 Post-Quiz Review for "${quiz.title}" will be available after you complete the quiz. Discuss answers, explanations, and learn from each other!`,
            isSystemMessage: true
          }
        })
        console.log('Post-quiz room created successfully')

        // Create General Quiz Discussion Room (always active)
        console.log('Creating general discussion room...')
        const generalRoom = await prisma.chatRoom.create({
          data: {
            name: data.chatRoomName || `${quiz.title} - General Discussion`,
            description: 'General discussion about the quiz topic',
            type: 'QUIZ_DISCUSSION',
            quizId: quiz.id,
            createdBy: data.creatorId,
            allowChatDuringQuiz: data.allowChatDuringQuiz || false,
            isActive: true,
          }
        })

        await prisma.chatMessage.create({
          data: {
            roomId: generalRoom.id,
            userId: data.creatorId,
            content: `💬 General discussion room for "${quiz.title}" is now available! Share insights, ask questions, and collaborate with your peers.`,
            isSystemMessage: true
          }
        })
        console.log('General discussion room created successfully')

        // Create study group if enabled
        if (data.enableStudyGroup) {
          console.log('Creating study group...')
          const studyGroup = await prisma.studyGroup.create({
            data: {
              name: `${quiz.title} - Study Group`,
              description: `Collaborative study group for ${quiz.title}. Join to study together and help each other succeed!`,
              quizId: quiz.id,
              createdBy: data.creatorId,
            }
          })

          // Create study group chat room
          const studyGroupRoom = await prisma.chatRoom.create({
            data: {
              name: `${quiz.title} - Study Group Chat`,
              description: 'Private chat for study group members',
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
              content: `👥 Welcome to the "${quiz.title}" study group! This is your private space to collaborate, share resources, and help each other prepare for the quiz. Good luck!`,
              isSystemMessage: true
            }
          })

          // Auto-add creator as moderator
          await prisma.userStudyGroup.create({
            data: {
              userId: data.creatorId,
              groupId: studyGroup.id,
              role: 'moderator'
            }
          })
          console.log('Study group created successfully')
        }

        console.log(`✅ Auto-created chat rooms for quiz: ${quiz.title}`)
      } catch (error) {
        console.error('❌ Failed to create chat rooms for quiz:', error)
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
