import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { promises as fs } from 'fs'
import path from 'path'
import { verifyDatabaseAccess } from '@/lib/database-auth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyDatabaseAccess(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    // Get database statistics
    const [users, quizzes, submissions, chatRooms, chatMessages] = await Promise.all([
      prisma.user.count(),
      prisma.quiz.count(),
      prisma.quizAttempt.count(),
      prisma.chatRoom.count(),
      prisma.chatMessage.count()
    ])

    // Get database file size
    let dbSize = 'Unknown'
    try {
      const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
      const stats = await fs.stat(dbPath)
      const fileSizeInBytes = stats.size
      const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2)
      dbSize = `${fileSizeInMB} MB`
    } catch (error) {
      console.error('Error getting database size:', error)
    }

    // Get recent activity
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, createdAt: true }
    })

    const recentQuizzes = await prisma.quiz.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, createdAt: true }
    })

    return NextResponse.json({
      users,
      quizzes,
      submissions,
      chatRooms,
      messages: chatMessages,
      size: dbSize,
      lastBackup: 'Manual', // You can implement automatic backups
      recentActivity: {
        users: recentUsers,
        quizzes: recentQuizzes
      }
    })

  } catch (error) {
    console.error('Database stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch database statistics' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
