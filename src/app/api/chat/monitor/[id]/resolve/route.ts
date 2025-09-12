import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// POST /api/chat/monitor/[id]/resolve - Resolve a suspicious activity
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and teachers can resolve activities
    if (!['ADMIN', 'TEACHER'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const activityId = params.id

    const activity = await prisma.suspiciousActivity.findUnique({
      where: { id: activityId }
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    const resolvedActivity = await prisma.suspiciousActivity.update({
      where: { id: activityId },
      data: {
        resolved: true,
        resolvedBy: session.id,
        resolvedAt: new Date()
      }
    })

    return NextResponse.json(resolvedActivity)
  } catch (error) {
    console.error('Error resolving activity:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
