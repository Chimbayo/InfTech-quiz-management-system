import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET - Get unread message count
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const unreadCount = await prisma.directMessage.count({
      where: {
        recipientId: session.id,
        isRead: false,
        isDeleted: false
      }
    })

    return NextResponse.json({ unreadCount })
  } catch (error) {
    console.error('Error fetching unread count:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
