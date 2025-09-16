import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole('STUDENT')
    
    const reminders = await prisma.studyReminder.findMany({
      where: {
        userId: session.id,
        deletedAt: null
      },
      include: {
        quiz: {
          select: {
            title: true
          }
        },
        studySession: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        reminderTime: 'asc'
      }
    })

    return NextResponse.json(reminders)
  } catch (error) {
    console.error('Error fetching study reminders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch study reminders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole('STUDENT')
    const body = await request.json()
    
    const { title, description, type, reminderTime, quizId, studySessionId } = body

    // Validate required fields
    if (!title || !reminderTime || !type) {
      return NextResponse.json(
        { error: 'Title, reminder time, and type are required' },
        { status: 400 }
      )
    }

    // Validate reminder time is in the future
    const reminderDate = new Date(reminderTime)
    if (reminderDate <= new Date()) {
      return NextResponse.json(
        { error: 'Reminder time must be in the future' },
        { status: 400 }
      )
    }

    // Validate quiz exists if quizId provided
    if (quizId) {
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId }
      })
      if (!quiz) {
        return NextResponse.json(
          { error: 'Quiz not found' },
          { status: 404 }
        )
      }
    }

    // Validate study session exists if studySessionId provided
    if (studySessionId) {
      const studySession = await prisma.studySession.findUnique({
        where: { id: studySessionId }
      })
      if (!studySession) {
        return NextResponse.json(
          { error: 'Study session not found' },
          { status: 404 }
        )
      }
    }

    const reminder = await prisma.studyReminder.create({
      data: {
        title,
        description: description || '',
        type,
        reminderTime: new Date(reminderTime),
        userId: session.id,
        quizId: quizId || null,
        studySessionId: studySessionId || null,
        isActive: true
      },
      include: {
        quiz: {
          select: {
            title: true
          }
        },
        studySession: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Skip notification creation as notification model doesn't exist in schema

    return NextResponse.json(reminder, { status: 201 })
  } catch (error) {
    console.error('Error creating study reminder:', error)
    return NextResponse.json(
      { error: 'Failed to create study reminder' },
      { status: 500 }
    )
  }
}
