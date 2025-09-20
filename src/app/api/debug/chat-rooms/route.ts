import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

/**
 * Debug endpoint to check chat room status
 * GET /api/debug/chat-rooms?quizId=QUIZ_ID (optional)
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole('ADMIN')
    
    const { searchParams } = new URL(request.url)
    const quizId = searchParams.get('quizId')
    
    let whereClause: any = {}
    
    if (quizId) {
      whereClause.quizId = quizId
    }
    
    const rooms = await prisma.chatRoom.findMany({
      where: whereClause,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        quiz: {
          select: {
            id: true,
            title: true
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Group rooms by type for better analysis
    const roomsByType = rooms.reduce((acc, room) => {
      if (!acc[room.type]) {
        acc[room.type] = []
      }
      acc[room.type].push({
        id: room.id,
        name: room.name,
        description: room.description,
        isActive: room.isActive,
        quizTitle: room.quiz?.title || 'No Quiz',
        messageCount: room._count.messages,
        createdAt: room.createdAt,
        allowChatDuringQuiz: room.allowChatDuringQuiz
      })
      return acc
    }, {} as Record<string, any[]>)
    
    // Get quiz completion stats if quizId provided
    let completionStats = null
    if (quizId) {
      const attempts = await prisma.quizAttempt.findMany({
        where: { 
          quizId,
          completedAt: { not: null }
        },
        select: {
          id: true,
          userId: true,
          completedAt: true,
          user: {
            select: { name: true }
          }
        }
      })
      
      completionStats = {
        totalCompletions: attempts.length,
        uniqueStudents: new Set(attempts.map(a => a.userId)).size,
        completions: attempts.map(a => ({
          studentName: a.user.name,
          completedAt: a.completedAt
        }))
      }
    }
    
    return NextResponse.json({
      totalRooms: rooms.length,
      activeRooms: rooms.filter(r => r.isActive).length,
      inactiveRooms: rooms.filter(r => !r.isActive).length,
      roomsByType,
      completionStats,
      summary: {
        hasPostQuizRooms: rooms.some(r => r.type === 'POST_QUIZ_REVIEW'),
        activePostQuizRooms: rooms.filter(r => r.type === 'POST_QUIZ_REVIEW' && r.isActive).length,
        inactivePostQuizRooms: rooms.filter(r => r.type === 'POST_QUIZ_REVIEW' && !r.isActive).length
      }
    })
    
  } catch (error) {
    console.error('Debug chat rooms error:', error)
    return NextResponse.json(
      { error: 'Failed to debug chat rooms' },
      { status: 500 }
    )
  }
}
