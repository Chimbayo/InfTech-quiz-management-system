import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const messageId = params.id

    // Soft delete the message
    await prisma.chatMessage.update({
      where: { id: messageId },
      data: { 
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: session.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const messageId = params.id
    const { isFlagged, flaggedReason } = await request.json()

    await prisma.chatMessage.update({
      where: { id: messageId },
      data: { 
        isFlagged,
        flaggedReason,
        flaggedAt: isFlagged ? new Date() : null,
        flaggedBy: isFlagged ? session.id : null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating message flag:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
