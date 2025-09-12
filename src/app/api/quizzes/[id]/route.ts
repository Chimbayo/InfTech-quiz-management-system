import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { z } from 'zod'
import { UserRole } from '@/types'
import { getBroadcastInstance } from '@/lib/realtime-broadcast'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface RouteParams {
  params: {
    id: string
  }
}

// GET - Get quiz details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole('ADMIN')
    
    const quiz = await prisma.quiz.findUnique({
      where: { 
        id: params.id,
        creatorId: session.id, // Ensure admin can only access their own quizzes
      },
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
    })

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(quiz)
  } catch (error) {
    console.error('Get quiz error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update quiz
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole('ADMIN')
    const body = await request.json()

    const updateQuizSchema = z.object({
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      passingScore: z.number().min(0).max(100).optional(),
      timeLimit: z.number().min(1).optional(),
      isActive: z.boolean().optional(),
      startAt: z.string().datetime().optional(),
      questions: z.array(z.object({
        id: z.string().optional(),
        text: z.string().min(1),
        type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE']),
        options: z.array(z.object({
          id: z.string().optional(),
          text: z.string().min(1),
          isCorrect: z.boolean(),
        })).min(2),
      }).refine((question) => {
        // Ensure exactly one option is marked as correct
        const correctCount = question.options.filter(option => option.isCorrect).length;
        return correctCount === 1;
      }, {
        message: 'Exactly one option must be marked as correct',
      })).optional(),
    })

    const data = updateQuizSchema.parse(body)

    // Check if quiz exists and belongs to the admin
    const existingQuiz = await prisma.quiz.findUnique({
      where: { 
        id: params.id,
        creatorId: session.id,
      },
    })

    if (!existingQuiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {
      title: data.title,
      description: data.description,
      passingScore: data.passingScore,
      timeLimit: data.timeLimit,
      isActive: data.isActive,
      startAt: data.startAt ? new Date(data.startAt) : undefined,
    }

    // If questions are provided, update them
    if (data.questions) {
      // Delete existing questions and options (cascade will handle this)
      await prisma.question.deleteMany({
        where: { quizId: params.id }
      })

      // Create new questions
      updateData.questions = {
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
      }
    }

    const updatedQuiz = await prisma.quiz.update({
      where: { id: params.id },
      data: updateData,
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    })

    // Broadcast quiz status changes
    try {
      const io = (global as any).io
      if (io) {
        const broadcast = getBroadcastInstance(io)
        
        // Check if isActive status changed
        if (data.isActive !== undefined && data.isActive !== existingQuiz.isActive) {
          const broadcastType = data.isActive ? 'PUBLISHED' : 'CLOSED'
          const message = data.isActive 
            ? `Quiz "${updatedQuiz.title}" has been published and is now available!`
            : `Quiz "${updatedQuiz.title}" has been closed and is no longer available.`
          
          await broadcast.broadcastQuizStatus({
            quizId: updatedQuiz.id,
            type: broadcastType,
            message,
            sentBy: session.id
          })
        }
      }
    } catch (error) {
      console.warn('Failed to broadcast quiz status change:', error)
    }

    return NextResponse.json(updatedQuiz)
  } catch (error) {
    console.error('Update quiz error:', error)
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

// DELETE - Delete quiz
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole('ADMIN')

    // Check if quiz exists and belongs to the admin
    const existingQuiz = await prisma.quiz.findUnique({
      where: { 
        id: params.id,
        creatorId: session.id,
      },
    })

    if (!existingQuiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    // Delete the quiz (cascade will handle related records)
    await prisma.quiz.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Quiz deleted successfully' })
  } catch (error) {
    console.error('Delete quiz error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
