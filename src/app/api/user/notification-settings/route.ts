import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole('STUDENT')
    
    let settings = await prisma.userNotificationSettings.findUnique({
      where: {
        userId: session.id
      }
    })

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.userNotificationSettings.create({
        data: {
          userId: session.id,
          emailNotifications: true,
          pushNotifications: true,
          reminderFrequency: '1_HOUR',
          autoReminders: true
        }
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching notification settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireRole('STUDENT')
    const body = await request.json()
    
    const { emailNotifications, pushNotifications, reminderFrequency, autoReminders } = body

    const settings = await prisma.userNotificationSettings.upsert({
      where: {
        userId: session.id
      },
      update: {
        emailNotifications: emailNotifications ?? undefined,
        pushNotifications: pushNotifications ?? undefined,
        reminderFrequency: reminderFrequency ?? undefined,
        autoReminders: autoReminders ?? undefined,
        updatedAt: new Date()
      },
      create: {
        userId: session.id,
        emailNotifications: emailNotifications ?? true,
        pushNotifications: pushNotifications ?? true,
        reminderFrequency: reminderFrequency ?? '1_HOUR',
        autoReminders: autoReminders ?? true
      }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating notification settings:', error)
    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    )
  }
}
