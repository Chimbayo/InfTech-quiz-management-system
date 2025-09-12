import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// DELETE /api/study-groups/[id]/leave - Leave study group
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const groupId = params.id

    // Check if user is a member of this study group
    const membership = await prisma.userStudyGroup.findUnique({
      where: {
        userId_groupId: {
          userId: session.id,
          groupId: groupId
        }
      },
      include: {
        group: {
          include: {
            creator: true,
            members: true
          }
        }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this study group' }, { status: 400 })
    }

    // Check if user is the creator and there are other members
    if (membership.group.createdBy === session.id && membership.group.members.length > 1) {
      // Transfer ownership to another moderator or the first member
      const newOwner = membership.group.members.find(
        member => member.userId !== session.id && member.role === 'moderator'
      ) || membership.group.members.find(
        member => member.userId !== session.id
      )

      if (newOwner) {
        await prisma.studyGroup.update({
          where: { id: groupId },
          data: { createdBy: newOwner.userId }
        })

        // Make the new owner a moderator if they weren't already
        await prisma.userStudyGroup.update({
          where: {
            userId_groupId: {
              userId: newOwner.userId,
              groupId: groupId
            }
          },
          data: { role: 'moderator' }
        })
      }
    }

    // Remove user from study group
    await prisma.userStudyGroup.delete({
      where: {
        userId_groupId: {
          userId: session.id,
          groupId: groupId
        }
      }
    })

    // If this was the last member and creator, delete the group
    const remainingMembers = await prisma.userStudyGroup.count({
      where: { groupId }
    })

    if (remainingMembers === 0) {
      await prisma.studyGroup.delete({
        where: { id: groupId }
      })
    }

    return NextResponse.json({ message: 'Successfully left study group' })
  } catch (error) {
    console.error('Error leaving study group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
