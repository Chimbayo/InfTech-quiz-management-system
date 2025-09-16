import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole('STUDENT')
    const body = await request.json()
    
    const { isActive, title, description, reminderTime } = body

    // Verify reminder belongs to user
    const existingReminder = await prisma.studyReminder.findFirst({
      where: {
        id: params.id,
        userId: session.id,
        deletedAt: null
      }
    })

    if (!existingReminder) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (typeof isActive === 'boolean') updateData.isActive = isActive
    if (title) updateData.title = title
    if (description) updateData.description = description
    if (reminderTime) {
      const reminderDate = new Date(reminderTime)
      if (reminderDate <= new Date()) {
        return NextResponse.json(
          { error: 'Reminder time must be in the future' },
          { status: 400 }
        )
      }
      updateData.reminderTime = reminderDate
    }

    const updatedReminder = await prisma.studyReminder.update({
      where: { id: params.id },
      data: updateData,
      include: {
        quiz: {
          select: {
            title: true
          }
        },
        studySession: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(updatedReminder)
  } catch (error) {
    console.error('Error updating study reminder:', error)
    return NextResponse.json(
      { error: 'Failed to update study reminder' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole('STUDENT')

    // Verify reminder belongs to user
    const existingReminder = await prisma.studyReminder.findFirst({
      where: {
        id: params.id,
        userId: session.id,
        deletedAt: null
      }
    })

    if (!existingReminder) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      )
    }

    // Soft delete the reminder
    await prisma.studyReminder.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date(),
        isActive: false
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting study reminder:', error)
    return NextResponse.json(
      { error: 'Failed to delete study reminder' },
      { status: 500 }
    )
  }
}
