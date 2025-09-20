import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// POST /api/help-requests/[id]/responses - Add response to help request
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only teachers, admins, and students can respond
    if (!['TEACHER', 'ADMIN', 'STUDENT'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const helpRequestId = params.id
    const body = await request.json()
    const { response } = body

    if (!response || !response.trim()) {
      return NextResponse.json(
        { error: 'Response content is required' },
        { status: 400 }
      )
    }

    // Check if help request exists
    const helpRequest = await prisma.helpRequest.findUnique({
      where: { id: helpRequestId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        quiz: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    if (!helpRequest) {
      return NextResponse.json(
        { error: 'Help request not found' },
        { status: 404 }
      )
    }

    // Create the response
    const helpResponse = await prisma.helpResponse.create({
      data: {
        helpRequestId,
        responderId: session.id,
        response: response.trim()
      },
      include: {
        responder: {
          select: {
            id: true,
            name: true,
            role: true,
            email: true
          }
        }
      }
    })

    // Update help request status to IN_PROGRESS if it was OPEN
    if (helpRequest.status === 'OPEN') {
      await prisma.helpRequest.update({
        where: { id: helpRequestId },
        data: { status: 'IN_PROGRESS' }
      })
    }

    // TODO: Send notification to the student who asked for help
    // This could be an email notification or real-time notification

    return NextResponse.json(helpResponse, { status: 201 })
  } catch (error) {
    console.error('Error creating help response:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/help-requests/[id]/responses - Get responses for a help request
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const helpRequestId = params.id

    // Check if help request exists and user has access
    const helpRequest = await prisma.helpRequest.findUnique({
      where: { id: helpRequestId }
    })

    if (!helpRequest) {
      return NextResponse.json(
        { error: 'Help request not found' },
        { status: 404 }
      )
    }

    // Students can only see responses to their own requests
    // Teachers and admins can see all responses
    if (session.role === 'STUDENT' && helpRequest.userId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const responses = await prisma.helpResponse.findMany({
      where: { helpRequestId },
      include: {
        responder: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(responses)
  } catch (error) {
    console.error('Error fetching help responses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
