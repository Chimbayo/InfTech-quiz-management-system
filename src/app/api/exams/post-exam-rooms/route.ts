import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * API endpoint to create post-exam chat rooms for exams that have ended
 * This should be called by a cron job or scheduled task
 */
export async function POST(request: NextRequest) {
  try {
    // This endpoint should be protected - only allow admin or system calls
    const authHeader = request.headers.get('authorization')
    const isSystemCall = authHeader === `Bearer ${process.env.SYSTEM_API_KEY}`
    
    if (!isSystemCall) {
      // If not a system call, require admin authentication
      await requireRole('ADMIN')
    }

    const now = new Date()
    
    // Find all exams that have ended but don't have post-exam chat rooms yet
    const endedExams = await prisma.quiz.findMany({
      where: {
        ...(({ isExam: true, examEndTime: { lte: now } }) as any),
        chatRooms: {
          none: {
            type: 'POST_EXAM_DISCUSSION'
          }
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    console.log(`Found ${endedExams.length} exams that need post-exam chat rooms`)

    const results = []

    for (const exam of endedExams) {
      try {
        console.log(`Creating post-exam chat room for: ${exam.title}`)

        // Create Post-Exam Discussion Room
        const postExamRoom = await prisma.chatRoom.create({
          data: {
            name: `${exam.title} - Post-Exam Discussion`,
            description: 'Discuss the exam, share insights, and review answers after completion',
            type: 'POST_EXAM_DISCUSSION',
            quizId: exam.id,
            createdBy: exam.creatorId,
            allowChatDuringQuiz: false,
            isActive: true,
          }
        })

        // Auto-submit any incomplete exam attempts when exam ends
        const incompleteAttempts = await prisma.quizAttempt.findMany({
          where: {
            quizId: exam.id,
            completedAt: null
          }
        })

        for (const attempt of incompleteAttempts) {
          try {
            // Calculate score for incomplete attempt
            const answers = await prisma.answer.findMany({
              where: { attemptId: attempt.id },
              include: { question: { include: { options: true } } }
            })

            const totalQuestions = await prisma.question.count({
              where: { quizId: exam.id }
            })

            const correctAnswers = answers.filter(answer => answer.isCorrect).length
            const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
            const passed = score >= exam.passingScore

            // Auto-submit the attempt
            await prisma.quizAttempt.update({
              where: { id: attempt.id },
              data: {
                completedAt: new Date(),
                score,
                passed,
                timeSpent: Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000)
              }
            })

            console.log(`Auto-submitted incomplete exam attempt for user ${attempt.userId} with score ${score}%`)
          } catch (error) {
            console.error(`Failed to auto-submit attempt ${attempt.id}:`, error)
          }
        }

        // Create welcome message
        await prisma.chatMessage.create({
          data: {
            roomId: postExamRoom.id,
            userId: exam.creatorId,
            content: `🎯 Post-Exam Discussion for "${exam.title}" is now open! The exam has ended and you can now discuss questions, share insights, and learn from each other. Please maintain academic integrity and respect your peers.`,
            isSystemMessage: true
          }
        })

        // Emit WebSocket event for real-time updates
        try {
          // Note: In a real implementation, you'd use your WebSocket server here
          console.log(`📡 Broadcasting chat room creation for exam: ${exam.title}`)
          // Example: io.emit('chatRoomCreated', { roomId: postExamRoom.id, examId: exam.id, examTitle: exam.title })
        } catch (wsError) {
          console.error('WebSocket broadcast error:', wsError)
        }

        results.push({
          examId: exam.id,
          examTitle: exam.title,
          status: 'success',
          roomsCreated: 1,
          message: 'Post-exam discussion room created successfully'
        })

        // Create General Discussion Room for the exam
        const generalRoom = await prisma.chatRoom.create({
          data: {
            name: `${exam.title} - General Discussion`,
            description: 'General discussion about the exam topic and related concepts',
            type: 'EXAM_GENERAL_DISCUSSION',
            quizId: exam.id,
            createdBy: exam.creatorId,
            allowChatDuringQuiz: false,
            isActive: true,
          }
        })

        await prisma.chatMessage.create({
          data: {
            roomId: generalRoom.id,
            userId: exam.creatorId,
            content: `💬 General discussion room for "${exam.title}" is now available! Discuss the exam topics, ask questions about concepts, and engage in academic discussions.`,
            isSystemMessage: true
          }
        })

        results.push({
          examId: exam.id,
          examTitle: exam.title,
          roomsCreated: [postExamRoom.id, generalRoom.id],
          status: 'success'
        })

        console.log(`✅ Successfully created post-exam rooms for: ${exam.title}`)

      } catch (error) {
        console.error(`❌ Failed to create post-exam rooms for ${exam.title}:`, error)
        results.push({
          examId: exam.id,
          examTitle: exam.title,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      message: `Processed ${endedExams.length} ended exams`,
      results,
      processedAt: now.toISOString()
    })

  } catch (error) {
    console.error('Post-exam room creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check which exams need post-exam rooms
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole('ADMIN')

    const now = new Date()
    
    // Find all exams that have ended but don't have post-exam chat rooms yet
    const endedExams = await prisma.quiz.findMany({
      where: {
        ...(({ isExam: true, examEndTime: { lte: now } }) as any),
        chatRooms: {
          none: {
            type: 'POST_EXAM_DISCUSSION'
          }
        }
      },
      select: {
        id: true,
        title: true,
        ...(({ examEndTime: true }) as any),
        createdAt: true,
        creator: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        ...(({ examEndTime: 'desc' }) as any)
      }
    })

    return NextResponse.json({
      count: endedExams.length,
      exams: endedExams
    })

  } catch (error) {
    console.error('Get ended exams error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
