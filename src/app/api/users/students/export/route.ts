import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

// GET /api/users/students/export - Export student results to CSV (Admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole('ADMIN')
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const studentId = searchParams.get('studentId')

    if (format !== 'csv') {
      return NextResponse.json({ error: 'Only CSV format is supported' }, { status: 400 })
    }

    let students
    if (studentId) {
      // Export specific student's data
      students = await prisma.user.findMany({
        where: {
          id: studentId,
          role: 'STUDENT'
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        }
      })
    } else {
      // Export all students' data
      students = await prisma.user.findMany({
        where: {
          role: 'STUDENT'
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        }
      })
    }

    if (students.length === 0) {
      return NextResponse.json({ error: 'No students found' }, { status: 404 })
    }

    // Get detailed attempts for all students
    const studentsWithAttempts = await Promise.all(
      students.map(async (student) => {
        const attempts = await prisma.quizAttempt.findMany({
          where: { userId: student.id },
          select: {
            id: true,
            score: true,
            passed: true,
            completedAt: true,
            timeSpent: true,
            quiz: {
              select: {
                id: true,
                title: true,
                passingScore: true,
                timeLimit: true,
              }
            }
          },
          orderBy: { completedAt: 'desc' },
        })

        return {
          ...student,
          attempts
        }
      })
    )

    // Generate CSV content
    const csvHeaders = [
      'Student Name',
      'Student Email',
      'Quiz Title',
      'Score (%)',
      'Passed',
      'Passing Score (%)',
      'Time Spent (minutes)',
      'Completed At',
      'Quiz Time Limit (minutes)'
    ].join(',')

    const csvRows = studentsWithAttempts.flatMap(student => {
      if (student.attempts.length === 0) {
        return [
          `"${student.name}","${student.email}","No Attempts","","","","","",""`
        ]
      }
      
      return student.attempts.map(attempt => {
        const timeSpentMinutes = attempt.timeSpent ? Math.round(attempt.timeSpent / 60) : 0
        const timeLimit = attempt.quiz.timeLimit || 'No Limit'
        const completedAt = attempt.completedAt 
          ? new Date(attempt.completedAt).toLocaleString('en-US')
          : 'Not Completed'
        
        return [
          `"${student.name}"`,
          `"${student.email}"`,
          `"${attempt.quiz.title}"`,
          attempt.score,
          attempt.passed ? 'Yes' : 'No',
          attempt.quiz.passingScore,
          timeSpentMinutes,
          `"${completedAt}"`,
          timeLimit
        ].join(',')
      })
    })

    const csvContent = [csvHeaders, ...csvRows].join('\n')

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="student-results-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })

  } catch (error) {
    console.error('Error exporting student results:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
