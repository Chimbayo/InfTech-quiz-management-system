import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET /api/progress - Get user progress milestones
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const progress = await prisma.studyMilestone.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(progress)
  } catch (error) {
    console.error('Error fetching progress:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/progress - Share progress milestone
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, description, value, studyGroupIds } = body

    if (!type || !description) {
      return NextResponse.json(
        { error: 'Type and description are required' },
        { status: 400 }
      )
    }

    // Create milestone
    const milestone = await prisma.studyMilestone.create({
      data: {
        userId: session.id,
        type,
        description,
        value: value || 0,
      }
    })

    // Share with study groups if specified
    if (studyGroupIds && studyGroupIds.length > 0) {
      const studyGroups = await prisma.studyGroup.findMany({
        where: {
          id: { in: studyGroupIds },
          members: {
            some: {
              userId: session.id
            }
          }
        },
        include: {
          chatRooms: {
            where: { isActive: true }
          }
        }
      })

      for (const group of studyGroups) {
        for (const room of group.chatRooms) {
          await prisma.chatMessage.create({
            data: {
              roomId: room.id,
              userId: session.id,
              content: `🎯 Progress Update: ${description} ${getProgressEmoji(type)}`,
              isSystemMessage: false
            }
          })
        }
      }
    }

    return NextResponse.json(milestone, { status: 201 })
  } catch (error) {
    console.error('Error sharing progress:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getProgressEmoji(type: string): string {
  switch (type) {
    case 'QUIZ_COMPLETED': return '✅'
    case 'STREAK_ACHIEVED': return '🔥'
    case 'SCORE_IMPROVED': return '📈'
    case 'STUDY_GOAL_MET': return '🎯'
    case 'BADGE_EARNED': return '🏆'
    default: return '⭐'
  }
}
