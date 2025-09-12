import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getBroadcastInstance } from '@/lib/realtime-broadcast'

export async function POST(request: NextRequest) {
  try {
    const { userId, isOnline, roomId } = await request.json()

    if (!userId || typeof isOnline !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Update user presence
    await prisma.userPresence.upsert({
      where: { userId },
      update: {
        isOnline,
        lastSeen: new Date(),
        currentRoom: roomId || null,
        updatedAt: new Date()
      },
      create: {
        userId,
        isOnline,
        lastSeen: new Date(),
        currentRoom: roomId || null
      }
    })

    // Broadcast instructor presence if applicable
    const io = (global as any).io
    if (io) {
      const broadcast = getBroadcastInstance(io)
      await broadcast.broadcastInstructorPresence(userId, isOnline, roomId)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error updating presence:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')
    const role = searchParams.get('role')

    let whereClause: any = {
      isOnline: true
    }

    if (roomId) {
      whereClause.currentRoom = roomId
    }

    if (role) {
      whereClause.user = {
        role: role
      }
    }

    const onlineUsers = await prisma.userPresence.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        lastSeen: 'desc'
      }
    })

    return NextResponse.json({ users: onlineUsers })

  } catch (error) {
    console.error('Error fetching presence:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
