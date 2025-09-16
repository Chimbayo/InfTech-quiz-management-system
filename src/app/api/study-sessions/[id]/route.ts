import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionId = params.id

    // Check if the study session exists and if the user is the creator
    const studySession = await prisma.studySession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        createdBy: true,
        name: true
      }
    })

    if (!studySession) {
      return NextResponse.json({ error: 'Study session not found' }, { status: 404 })
    }

    if (studySession.createdBy !== session.id) {
      return NextResponse.json({ error: 'Only the session organizer can delete this session' }, { status: 403 })
    }

    // Delete all participants first (due to foreign key constraints)
    await prisma.studySessionParticipant.deleteMany({
      where: { sessionId: sessionId }
    })

    // Delete the study session
    await prisma.studySession.delete({
      where: { id: sessionId }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Study session deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting study session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
