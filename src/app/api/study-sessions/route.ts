import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET /api/study-sessions - Get user's study sessions
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studyGroupId = searchParams.get('studyGroupId')

    let whereClause: any = {
      OR: [
        { createdBy: session.id },
        {
          participants: {
            some: {
              userId: session.id
            }
          }
        }
      ]
    }

    if (studyGroupId) {
      whereClause.studyGroupId = studyGroupId
    }

    const studySessions = await prisma.studySession.findMany({
      where: whereClause,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        studyGroup: {
          select: {
            id: true,
            name: true
          }
        },
        quiz: {
          select: {
            id: true,
            title: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            participants: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    return NextResponse.json(studySessions)
  } catch (error) {
    console.error('Error fetching study sessions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/study-sessions - Create study session
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, scheduledAt, duration, studyGroupId, quizId, maxParticipants } = body

    if (!title || !scheduledAt) {
      return NextResponse.json(
        { error: 'Title and scheduled time are required' },
        { status: 400 }
      )
    }

    // Verify study group exists and user is a member
    if (studyGroupId) {
      const studyGroup = await prisma.studyGroup.findFirst({
        where: {
          id: studyGroupId,
          OR: [
            { createdBy: session.id },
            {
              members: {
                some: {
                  userId: session.id
                }
              }
            }
          ]
        }
      })

      if (!studyGroup) {
        return NextResponse.json({ error: 'Study group not found or access denied' }, { status: 404 })
      }
    }

    const studySession = await prisma.studySession.create({
      data: {
        name: title,
        description,
        startTime: new Date(scheduledAt),
        studyGroupId,
        quizId,
        createdBy: session.id
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        studyGroup: {
          select: {
            id: true,
            name: true
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

    // Auto-join creator as participant
    await prisma.studySessionParticipant.create({
      data: {
        sessionId: studySession.id,
        userId: session.id
      }
    })

    // Send notification to study group members
    if (studyGroupId) {
      const studyGroupMembers = await prisma.userStudyGroup.findMany({
        where: {
          groupId: studyGroupId,
          userId: { not: session.id }
        },
        include: {
          user: true
        }
      })

      // Create chat message in study group room
      const studyGroupRoom = await prisma.chatRoom.findFirst({
        where: {
          studyGroupId: studyGroupId,
          type: 'STUDY_GROUP'
        }
      })

      if (studyGroupRoom) {
        await prisma.chatMessage.create({
          data: {
            roomId: studyGroupRoom.id,
            userId: session.id,
            content: `📅 Study Session Scheduled: "${title}" on ${new Date(scheduledAt).toLocaleString()}. Join us to prepare together!`,
            isSystemMessage: false
          }
        })
      }
    }

    return NextResponse.json(studySession, { status: 201 })
  } catch (error) {
    console.error('Error creating study session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
