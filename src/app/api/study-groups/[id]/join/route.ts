import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// POST /api/study-groups/[id]/join - Join study group
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const groupId = params.id

    // Check if study group exists
    const studyGroup = await prisma.studyGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          where: { userId: session.id }
        }
      }
    })

    if (!studyGroup) {
      return NextResponse.json({ error: 'Study group not found' }, { status: 404 })
    }

    // Check if user is already a member
    if (studyGroup.members.length > 0) {
      return NextResponse.json({ error: 'Already a member of this study group' }, { status: 400 })
    }

    // Add user to study group
    const membership = await prisma.userStudyGroup.create({
      data: {
        userId: session.id,
        groupId: groupId,
        role: 'member'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        group: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(membership, { status: 201 })
  } catch (error) {
    console.error('Error joining study group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
