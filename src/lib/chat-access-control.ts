import { prisma } from '@/lib/prisma'

/**
 * Check if a user has access to a post-quiz or post-exam chat room
 * @param userId - The user's ID
 * @param userRole - The user's role
 * @param roomType - The chat room type
 * @param quizId - The quiz ID associated with the room
 * @returns Promise<boolean> - Whether the user has access
 */
export async function checkChatRoomAccess(
  userId: string,
  userRole: string,
  roomType: string,
  quizId: string | null
): Promise<boolean> {
  // Admins always have access
  if (userRole === 'ADMIN') {
    return true
  }

  // For post-quiz review rooms, check if user completed the quiz
  if (roomType === 'POST_QUIZ_REVIEW' && quizId) {
    const userCompletedQuiz = await prisma.quizAttempt.findFirst({
      where: {
        userId,
        quizId,
        completedAt: { not: null }
      }
    })
    
    return !!userCompletedQuiz
  }
  
  // For post-exam discussion rooms, check if user completed the exam
  if (roomType === 'POST_EXAM_DISCUSSION' && quizId) {
    const userCompletedExam = await prisma.quizAttempt.findFirst({
      where: {
        userId,
        quizId,
        completedAt: { not: null }
      }
    })
    
    return !!userCompletedExam
  }
  
  // For all other room types, allow access
  return true
}

/**
 * Get access denied message for specific room types
 * @param roomType - The chat room type
 * @returns string - The access denied message
 */
export function getAccessDeniedMessage(roomType: string): string {
  switch (roomType) {
    case 'POST_QUIZ_REVIEW':
      return 'Access denied. You must complete the quiz first to join the post-quiz discussion.'
    case 'POST_EXAM_DISCUSSION':
      return 'Access denied. You must complete the exam first to join the post-exam discussion.'
    default:
      return 'Access denied.'
  }
}

/**
 * Filter chat rooms based on user's completion status
 * @param rooms - Array of chat rooms
 * @param userId - The user's ID
 * @param userRole - The user's role
 * @returns Promise<ChatRoom[]> - Filtered rooms the user can access
 */
export async function filterAccessibleRooms(
  rooms: any[],
  userId: string,
  userRole: string
): Promise<any[]> {
  const accessibleRooms = []
  
  for (const room of rooms) {
    const hasAccess = await checkChatRoomAccess(userId, userRole, room.type, room.quizId)
    if (hasAccess) {
      accessibleRooms.push(room)
    }
  }
  
  return accessibleRooms
}
