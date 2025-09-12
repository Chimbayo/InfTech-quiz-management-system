import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET /api/study-groups/[id] - Get specific study group
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const studyGroup = await prisma.studyGroup.findUnique({
      where: { id: params.id },
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
      }
    })

    if (!studyGroup) {
      return NextResponse.json({ error: 'Study group not found' }, { status: 404 })
    }

    // Check if user has access to this study group
    const hasAccess = studyGroup.createdBy === session.id || 
                     studyGroup.members.some(member => member.userId === session.id) ||
                     ['ADMIN', 'TEACHER'].includes(session.role)

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(studyGroup)
  } catch (error) {
    console.error('Error fetching study group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/study-groups/[id] - Update study group
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and teachers can update study groups
    if (!['ADMIN', 'TEACHER'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, quizId, memberIds } = body

    // Verify the study group exists
    const existingGroup = await prisma.studyGroup.findUnique({
      where: { id: params.id },
      include: {
        members: true
      }
    })

    if (!existingGroup) {
      return NextResponse.json({ error: 'Study group not found' }, { status: 404 })
    }

    // Only creator or admin can update
    if (existingGroup.createdBy !== session.id && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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

    // Update the study group
    const updatedGroup = await prisma.studyGroup.update({
      where: { id: params.id },
      data: {
        name: name || existingGroup.name,
        description: description !== undefined ? description : existingGroup.description,
        quizId: quizId !== undefined ? quizId : existingGroup.quizId
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
      }
    })

    // Update memberships if memberIds is provided
    if (memberIds !== undefined) {
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

      // Remove existing memberships (except creator)
      await prisma.userStudyGroup.deleteMany({
        where: {
          groupId: params.id,
          userId: { not: session.id }
        }
      })

      // Add new memberships
      if (memberIds.length > 0) {
        await prisma.userStudyGroup.createMany({
          data: memberIds.map((userId: string) => ({
            userId,
            groupId: params.id,
            role: 'member'
          }))
        })
      }
    }

    return NextResponse.json(updatedGroup)
  } catch (error) {
    console.error('Error updating study group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/study-groups/[id] - Delete study group
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and teachers can delete study groups
    if (!['ADMIN', 'TEACHER'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify the study group exists
    const studyGroup = await prisma.studyGroup.findUnique({
      where: { id: params.id }
    })

    if (!studyGroup) {
      return NextResponse.json({ error: 'Study group not found' }, { status: 404 })
    }

    // Only creator or admin can delete
    if (studyGroup.createdBy !== session.id && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete related chat rooms and messages first
    await prisma.chatMessage.deleteMany({
      where: {
        room: {
          studyGroupId: params.id
        }
      }
    })

    await prisma.chatRoom.deleteMany({
      where: { studyGroupId: params.id }
    })

    // Delete user-study group relationships
    await prisma.userStudyGroup.deleteMany({
      where: { groupId: params.id }
    })

    // Delete the study group
    await prisma.studyGroup.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Study group deleted successfully' })
  } catch (error) {
    console.error('Error deleting study group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}