import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

/**
 * Debug endpoint to manually activate post-quiz rooms
 * POST /api/debug/activate-post-quiz-rooms?quizId=QUIZ_ID (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole('ADMIN')
    
    const { searchParams } = new URL(request.url)
    const quizId = searchParams.get('quizId')
    const roomId = searchParams.get('roomId')
    
    let whereClause: any = {
      type: 'POST_QUIZ_REVIEW',
      isActive: false
    }
    
    if (roomId) {
      whereClause = { id: roomId, isActive: false }
    } else if (quizId) {
      whereClause.quizId = quizId
    }
    
    // Find inactive post-quiz rooms
    const inactiveRooms = await prisma.chatRoom.findMany({
      where: whereClause,
      include: {
        quiz: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })
    
    if (inactiveRooms.length === 0) {
      return NextResponse.json({
        message: 'No inactive post-quiz rooms found',
        activated: 0
      })
    }
    
    // Activate all found rooms
    const activatedRooms = []
    
    for (const room of inactiveRooms) {
      await prisma.chatRoom.update({
        where: { id: room.id },
        data: { isActive: true }
      })
      
      // Add activation message
      await prisma.chatMessage.create({
        data: {
          roomId: room.id,
          userId: session.id,
          content: `🔧 Post-Quiz Review room manually activated by admin for "${room.quiz?.title}". Students can now discuss answers and explanations!`,
          isSystemMessage: true
        }
      })
      
      activatedRooms.push({
        id: room.id,
        name: room.name,
        quizTitle: room.quiz?.title
      })
      
      console.log(`Manually activated post-quiz room: ${room.name}`)
    }
    
    return NextResponse.json({
      message: `Successfully activated ${activatedRooms.length} post-quiz room(s)`,
      activated: activatedRooms.length,
      rooms: activatedRooms
    })
    
  } catch (error) {
    console.error('Activate post-quiz rooms error:', error)
    return NextResponse.json(
      { error: 'Failed to activate post-quiz rooms' },
      { status: 500 }
    )
  }
}
