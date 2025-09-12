import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET /api/study-groups - Get user's study groups
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const studyGroups = await prisma.studyGroup.findMany({
      where: {
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
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        quiz: {
          select: {
            id: true,
            title: true,
            description: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        },
        chatRooms: {
          select: {
            id: true,
            name: true,
            type: true,
            isActive: true
          }
        },
        _count: {
          select: {
            members: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(studyGroups)
  } catch (error) {
    console.error('Error fetching study groups:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/study-groups - Create study group
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and teachers can create study groups
    if (!['ADMIN', 'TEACHER'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, quizId, memberIds = [] } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Verify quiz exists if quizId is provided
    if (quizId) {
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId }
      })

      if (!quiz) {
        return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
      }
    }

    // Verify all member IDs exist and are students
    if (memberIds.length > 0) {
      const validMembers = await prisma.user.findMany({
        where: {
          id: { in: memberIds },
          role: 'STUDENT'
        }
      })

      if (validMembers.length !== memberIds.length) {
        return NextResponse.json({ error: 'Some selected users are invalid or not students' }, { status: 400 })
      }
    }

    const studyGroup = await prisma.studyGroup.create({
      data: {
        name,
        description,
        quizId,
        createdBy: session.id
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        quiz: {
          select: {
            id: true,
            title: true,
            description: true
          }
        }
      }
    })

    // Add selected members to the study group
    if (memberIds.length > 0) {
      await prisma.userStudyGroup.createMany({
        data: memberIds.map((userId: string) => ({
          userId,
          groupId: studyGroup.id,
          role: 'member'
        }))
      })
    }

    // Automatically add creator as moderator
    await prisma.userStudyGroup.create({
      data: {
        userId: session.id,
        groupId: studyGroup.id,
        role: 'moderator'
      }
    })

    // Create chat room for the study group
    try {
      const chatRoom = await prisma.chatRoom.create({
        data: {
          name: `${name} - Chat`,
          type: 'STUDY_GROUP',
          studyGroupId: studyGroup.id,
          createdBy: session.id,
          allowChatDuringQuiz: true,
        }
      })

      // Create welcome system message
      await prisma.chatMessage.create({
        data: {
          roomId: chatRoom.id,
          userId: session.id,
          content: `👥 Welcome to the ${name} study group! Collaborate and help each other learn.`,
          isSystemMessage: true
        }
      })
    } catch (error) {
      console.warn('Failed to create chat room for study group:', error)
      // Don't fail study group creation if chat room creation fails
    }

    return NextResponse.json(studyGroup, { status: 201 })
  } catch (error) {
    console.error('Error creating study group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
