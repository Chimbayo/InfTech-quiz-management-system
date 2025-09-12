import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { QuizInterfaceWithChat } from '@/components/student/quiz-interface-with-chat'

export default async function QuizChatPage({ params }: { params: { id: string } }) {
  try {
    const session = await requireRole('STUDENT')
    
    const quiz = await prisma.quiz.findFirst({
      where: { 
        id: params.id,
        OR: [
          { isActive: true },
          { startAt: { lte: new Date() } },
        ],
      },
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: { order: 'asc' },
        },
        creator: {
          select: { name: true },
        },
      },
    })

    if (!quiz) {
      redirect('/student/dashboard')
    }

    // Check if chat is enabled for this quiz
    if (!quiz.enableChat) {
      redirect(`/student/quiz/${params.id}`)
    }

    // Get chat rooms related to this quiz
    const chatRooms = await prisma.chatRoom.findMany({
      where: {
        OR: [
          { quizId: params.id },
          { type: 'GENERAL', isActive: true },
        ],
      },
      select: {
        id: true,
        name: true,
        type: true,
        isActive: true,
      },
      orderBy: [
        { type: 'asc' }, // GENERAL first, then QUIZ, then STUDY
        { createdAt: 'desc' },
      ],
    })

    // Check if user has already completed this quiz
    const existingAttempt = await prisma.quizAttempt.findFirst({
      where: {
        userId: session.id,
        quizId: params.id,
        completedAt: { not: null },
      },
    })

    return (
      <QuizInterfaceWithChat
        quiz={quiz}
        userId={session.id}
        chatRooms={chatRooms}
      />
    )
  } catch (error) {
    console.error('Authentication error in quiz chat page:', error)
    redirect('/student')
  }
}
