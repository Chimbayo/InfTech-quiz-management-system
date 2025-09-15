import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EditQuizForm } from '@/components/admin/edit-quiz-form'
import { UserRole } from '@/types'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface EditQuizPageProps {
  params: {
    id: string
  }
}

export default async function EditQuizPage({ params }: EditQuizPageProps) {
  try {
    const session = await requireRole('ADMIN')
    
    // Get the quiz with questions and options
    const quiz = await prisma.quiz.findUnique({
      where: { 
        id: params.id,
      },
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!quiz) {
      redirect('/admin/dashboard')
    }

    return (
      <EditQuizForm
        userId={session.id}
        quiz={quiz}
      />
    )
  } catch (error) {
    redirect('/admin')
  }
}
