import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { z } from 'zod'
import { getBroadcastInstance } from '@/lib/realtime-broadcast'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const announcementSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  type: z.string().default('GENERAL'),
  quizId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole('ADMIN')
    const body = await request.json()
    const data = announcementSchema.parse(body)

    // Create announcement in database
    const announcement = await prisma.announcement.create({
      data: {
        message: data.message,
        type: data.type,
        quizId: data.quizId,
        sentBy: session.id,
      },
      include: {
        sender: {
          select: { name: true, role: true }
        },
        quiz: data.quizId ? {
          select: { title: true }
        } : undefined
      }
    })

    // Broadcast announcement to all students
    try {
      const io = (global as any).io
      if (io) {
        const broadcast = getBroadcastInstance(io)
        
        const announcementMessage = data.quizId 
          ? `📢 New announcement about "${announcement.quiz?.title}": ${data.message}`
          : `📢 General announcement: ${data.message}`

        // Broadcast to all connected users
        io.emit('new-announcement', {
          id: announcement.id,
          message: announcementMessage,
          type: data.type,
          quizId: data.quizId,
          sentBy: session.name,
          sentAt: announcement.createdAt
        })
      }
    } catch (error) {
      console.warn('Failed to broadcast announcement:', error)
    }

    return NextResponse.json(announcement)
  } catch (error) {
    console.error('Create announcement error:', error)
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
    const limit = parseInt(searchParams.get('limit') || '10')
    
    const announcements = await prisma.announcement.findMany({
      include: {
        sender: {
          select: { name: true, role: true }
        },
        quiz: {
          select: { title: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return NextResponse.json(announcements)
  } catch (error) {
    console.error('Get announcements error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
