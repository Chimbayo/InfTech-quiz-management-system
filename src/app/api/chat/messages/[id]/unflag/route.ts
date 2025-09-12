import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const messageId = params.id

    // Unflag the message
    await prisma.chatMessage.update({
      where: { id: messageId },
      data: { 
        isFlagged: false,
        flaggedReason: null,
        flaggedAt: null,
        flaggedBy: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error unflagging message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
