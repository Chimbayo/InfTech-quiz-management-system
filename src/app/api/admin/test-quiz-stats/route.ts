import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { calculateQuizStatistics, validateQuizStatistics } from '@/lib/quiz-statistics'
import { prisma } from '@/lib/prisma'

/**
 * Simple test endpoint to verify quiz statistics calculations
 * GET /api/admin/test-quiz-stats?quizId=QUIZ_ID
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole('ADMIN')
    
    const { searchParams } = new URL(request.url)
    const quizId = searchParams.get('quizId')
    
    if (!quizId) {
      return NextResponse.json(
        { error: 'quizId parameter is required' },
        { status: 400 }
      )
    }
    
    // Get quiz basic info
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        title: true,
        passingScore: true,
        createdAt: true
      }
    })
    
    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }
    
    // Get raw attempts data
    const rawAttempts = await prisma.quizAttempt.findMany({
      where: { quizId },
      select: {
        id: true,
        userId: true,
        score: true,
        passed: true,
        completedAt: true,
        startedAt: true,
        timeSpent: true
      },
      orderBy: { startedAt: 'desc' }
    })
    
    // Calculate enhanced statistics
    const enhancedStats = await calculateQuizStatistics(quizId)
    
    // Validate data integrity
    const validation = await validateQuizStatistics(quizId)
    
    // Calculate basic statistics (old method)
    const basicStats = {
      totalAttempts: rawAttempts.length,
      completedAttempts: rawAttempts.filter(a => a.completedAt).length,
      passedAttempts: rawAttempts.filter(a => a.passed).length,
      averageScore: rawAttempts.length > 0 
        ? Math.round(rawAttempts.reduce((sum, a) => sum + a.score, 0) / rawAttempts.length)
        : 0
    }
    
    // Compare results
    const comparison = {
      totalAttempts: {
        basic: basicStats.totalAttempts,
        enhanced: enhancedStats.totalAttempts,
        match: basicStats.totalAttempts === enhancedStats.totalAttempts
      },
      completedAttempts: {
        basic: basicStats.completedAttempts,
        enhanced: enhancedStats.completedAttempts,
        match: basicStats.completedAttempts === enhancedStats.completedAttempts
      },
      passedAttempts: {
        basic: basicStats.passedAttempts,
        enhanced: enhancedStats.passedAttempts,
        match: basicStats.passedAttempts === enhancedStats.passedAttempts
      },
      averageScore: {
        basic: basicStats.averageScore,
        enhanced: enhancedStats.averageScore,
        match: Math.abs(basicStats.averageScore - enhancedStats.averageScore) < 1
      }
    }
    
    // Get unique students
    const uniqueStudents = new Set(rawAttempts.map(a => a.userId)).size
    
    return NextResponse.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        passingScore: quiz.passingScore,
        createdAt: quiz.createdAt
      },
      rawData: {
        totalAttempts: rawAttempts.length,
        completedAttempts: rawAttempts.filter(a => a.completedAt).length,
        incompleteAttempts: rawAttempts.filter(a => !a.completedAt).length,
        uniqueStudents,
        attemptsWithTimeSpent: rawAttempts.filter(a => a.timeSpent).length
      },
      basicStatistics: basicStats,
      enhancedStatistics: enhancedStats,
      comparison,
      validation,
      summary: {
        allComparisonsMatch: Object.values(comparison).every(c => c.match),
        hasDataIssues: validation.issues.length > 0,
        dataQuality: validation.issues.length === 0 ? 'Good' : 'Issues Found'
      }
    })
    
  } catch (error) {
    console.error('Test quiz stats error:', error)
    return NextResponse.json(
      { error: 'Failed to test quiz statistics' },
      { status: 500 }
    )
  }
}
