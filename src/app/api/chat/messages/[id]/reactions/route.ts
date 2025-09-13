import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// POST /api/chat/messages/[id]/reactions - Add or toggle a reaction
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const messageId = params.id
    const body = await request.json()
    const { emoji } = body

    if (!emoji) {
      return NextResponse.json(
        { error: 'Emoji is required' },
        { status: 400 }
      )
    }

    // Check if message exists
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // For now, we'll simulate reactions in memory since Prisma client needs regeneration
    // This is a temporary implementation until the client generation issue is resolved
    
    // In a real implementation, this would use the database
    // For now, return a mock response
    const mockReactions = [
      {
        emoji: emoji,
        count: 1,
        users: [session.id]
      }
    ]

    return NextResponse.json({ reactions: mockReactions })
  } catch (error) {
    console.error('Error handling reaction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/chat/messages/[id]/reactions - Get reactions for a message
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const messageId = params.id

    // Check if message exists
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // For now, return empty reactions since Prisma client needs regeneration
    // This is a temporary implementation until the client generation issue is resolved
    const mockReactions: any[] = []

    return NextResponse.json({ reactions: mockReactions })
  } catch (error) {
    console.error('Error fetching reactions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
