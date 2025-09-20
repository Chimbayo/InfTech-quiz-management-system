import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET /api/help-requests/[id] - Get specific help request
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
        },
        responses: {
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
        }
      }
    })

    if (!helpRequest) {
      return NextResponse.json(
        { error: 'Help request not found' },
        { status: 404 }
      )
    }

    // Students can only see their own requests
    // Teachers and admins can see all requests
    if (session.role === 'STUDENT' && helpRequest.userId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(helpRequest)
  } catch (error) {
    console.error('Error fetching help request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/help-requests/[id] - Update help request status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const helpRequestId = params.id
    const body = await request.json()
    const { status } = body

    if (!status || !['OPEN', 'IN_PROGRESS', 'RESOLVED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be OPEN, IN_PROGRESS, or RESOLVED' },
        { status: 400 }
      )
    }

    // Check if help request exists
    const helpRequest = await prisma.helpRequest.findUnique({
      where: { id: helpRequestId }
    })

    if (!helpRequest) {
      return NextResponse.json(
        { error: 'Help request not found' },
        { status: 404 }
      )
    }

    // Only the original requester, teachers, or admins can update status
    if (
      session.role === 'STUDENT' && 
      helpRequest.userId !== session.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updatedRequest = await prisma.helpRequest.update({
      where: { id: helpRequestId },
      data: { status },
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
        },
        responses: {
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
        }
      }
    })

    return NextResponse.json(updatedRequest)
  } catch (error) {
    console.error('Error updating help request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/help-requests/[id] - Delete help request (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can delete help requests
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const helpRequestId = params.id

    const helpRequest = await prisma.helpRequest.findUnique({
      where: { id: helpRequestId }
    })

    if (!helpRequest) {
      return NextResponse.json(
        { error: 'Help request not found' },
        { status: 404 }
      )
    }

    // Delete all responses first (cascade should handle this, but being explicit)
    await prisma.helpResponse.deleteMany({
      where: { helpRequestId }
    })

    // Delete the help request
    await prisma.helpRequest.delete({
      where: { id: helpRequestId }
    })

    return NextResponse.json({ message: 'Help request deleted successfully' })
  } catch (error) {
    console.error('Error deleting help request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
