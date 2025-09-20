import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { validateQuizStatistics, calculateQuizStatistics } from '@/lib/quiz-statistics'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    await requireRole('ADMIN')
    
    const { searchParams } = new URL(request.url)
    const quizId = searchParams.get('quizId')
    
    if (quizId) {
      // Debug specific quiz
      const validation = await validateQuizStatistics(quizId)
      const statistics = await calculateQuizStatistics(quizId)
      
      return NextResponse.json({
        validation,
        statistics,
        quizId
      })
    }
    
    // Debug all quizzes
    const quizzes = await prisma.quiz.findMany({
      include: {
        _count: {
          select: {
            attempts: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    const debugResults = await Promise.all(
      quizzes.map(async (quiz) => {
        const validation = await validateQuizStatistics(quiz.id)
        return {
          quizId: quiz.id,
          title: quiz.title,
          isExam: (quiz as any).isExam || false, // Type assertion for exam field
          attemptCount: quiz._count.attempts,
          validation
        }
      })
    )
    
    return NextResponse.json({
      totalQuizzes: quizzes.length,
      results: debugResults,
      summary: {
        quizzesWithIssues: debugResults.filter(r => r.validation.issues.length > 0).length,
        totalAttempts: debugResults.reduce((sum, r) => sum + r.attemptCount, 0)
      }
    })
    
  } catch (error) {
    console.error('Quiz stats debug error:', error)
    return NextResponse.json(
      { error: 'Failed to debug quiz statistics' },
      { status: 500 }
    )
  }
}
