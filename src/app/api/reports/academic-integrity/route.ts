import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { generateIntegrityReport } from '@/lib/academic-integrity'

// GET /api/reports/academic-integrity - Generate comprehensive integrity report
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole('ADMIN')
    const { searchParams } = new URL(request.url)
    
    const quizId = searchParams.get('quizId')
    const timeRange = parseInt(searchParams.get('timeRange') || '30') // days
    const userId = searchParams.get('userId')
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - timeRange)

    // Base query conditions
    const whereConditions: any = {
      timestamp: {
        gte: startDate
      }
    }

    if (userId) {
      whereConditions.userId = userId
    }

    if (quizId) {
      // Get room IDs associated with the quiz
      const quizRooms = await prisma.chatRoom.findMany({
        where: { quizId },
        select: { id: true }
      })
      whereConditions.roomId = {
        in: quizRooms.map(room => room.id)
      }
    }

    // Fetch suspicious activities
    const suspiciousActivities = await prisma.suspiciousActivity.findMany({
      where: whereConditions,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        room: {
          select: {
            id: true,
            name: true,
            type: true,
            quiz: {
              select: {
                id: true,
                title: true
              }
            }
          }
        },
        message: {
          select: {
            id: true,
            content: true,
            createdAt: true
          }
        }
      },
      orderBy: { timestamp: 'desc' }
    })

    // Analyze patterns across multiple quizzes
    const patternAnalysis = await analyzeViolationPatterns(whereConditions)
    
    // Generate risk assessment for users
    const userRiskAssessment = await generateUserRiskAssessment(whereConditions)
    
    // Quiz-specific analysis
    const quizAnalysis = quizId ? await analyzeQuizIntegrity(quizId) : null
    
    // Generate recommendations
    const recommendations = generateRecommendations(suspiciousActivities, patternAnalysis)
    
    // Create summary statistics
    const summary = {
      totalViolations: suspiciousActivities.length,
      highSeverityViolations: suspiciousActivities.filter(a => a.severity === 'HIGH').length,
      mediumSeverityViolations: suspiciousActivities.filter(a => a.severity === 'MEDIUM').length,
      lowSeverityViolations: suspiciousActivities.filter(a => a.severity === 'LOW').length,
      resolvedViolations: suspiciousActivities.filter(a => a.resolved).length,
      uniqueUsers: new Set(suspiciousActivities.map(a => a.userId)).size,
      uniqueQuizzes: new Set(suspiciousActivities.map(a => a.room.quiz?.id).filter(Boolean)).size,
      timeRange: timeRange
    }

    // Generate overall integrity score
    const integrityScore = calculateIntegrityScore(summary, patternAnalysis)

    return NextResponse.json({
      summary,
      integrityScore,
      suspiciousActivities: suspiciousActivities.map(activity => ({
        id: activity.id,
        type: activity.type,
        severity: activity.severity,
        description: activity.description,
        evidence: activity.evidence ? JSON.parse(activity.evidence) : null,
        timestamp: activity.timestamp,
        resolved: activity.resolved,
        user: activity.user,
        room: activity.room,
        message: activity.message
      })),
      patternAnalysis,
      userRiskAssessment,
      quizAnalysis,
      recommendations
    })
  } catch (error) {
    console.error('Error generating integrity report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function analyzeViolationPatterns(whereConditions: any) {
  // Analyze patterns by type
  const violationsByType = await prisma.suspiciousActivity.groupBy({
    by: ['type'],
    where: whereConditions,
    _count: {
      id: true
    }
  })

  // Analyze patterns by time (hourly distribution)
  const violationsByHour = await prisma.suspiciousActivity.findMany({
    where: whereConditions,
    select: {
      timestamp: true,
      severity: true
    }
  })

  const hourlyDistribution = violationsByHour.reduce((acc, violation) => {
    const hour = new Date(violation.timestamp).getHours()
    if (!acc[hour]) {
      acc[hour] = { total: 0, high: 0, medium: 0, low: 0 }
    }
    acc[hour].total++
    acc[hour][violation.severity?.toLowerCase() as keyof typeof acc[0]] = 
      (acc[hour][violation.severity?.toLowerCase() as keyof typeof acc[0]] || 0) + 1
    return acc
  }, {} as Record<number, { total: number, high: number, medium: number, low: number }>)

  // Analyze repeat offenders
  const repeatOffenders = await prisma.suspiciousActivity.groupBy({
    by: ['userId'],
    where: whereConditions,
    _count: {
      id: true
    },
    having: {
      id: {
        _count: {
          gt: 3
        }
      }
    }
  })

  // Get user details for repeat offenders
  const offenderDetails = await prisma.user.findMany({
    where: {
      id: {
        in: repeatOffenders.map(offender => offender.userId)
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  })

  return {
    violationsByType: violationsByType.map(item => ({
      type: item.type,
      count: item._count.id
    })),
    hourlyDistribution,
    repeatOffenders: repeatOffenders.map(offender => ({
      ...offender,
      user: offenderDetails.find(user => user.id === offender.userId),
      violationCount: offender._count.id
    }))
  }
}

async function generateUserRiskAssessment(whereConditions: any) {
  const userViolations = await prisma.suspiciousActivity.groupBy({
    by: ['userId', 'severity'],
    where: whereConditions,
    _count: {
      id: true
    }
  })

  // Calculate risk scores for each user
  const userRiskScores = userViolations.reduce((acc, violation) => {
    if (!acc[violation.userId]) {
      acc[violation.userId] = { high: 0, medium: 0, low: 0, total: 0 }
    }
    
    const severity = violation.severity?.toLowerCase() as 'high' | 'medium' | 'low'
    acc[violation.userId][severity] += violation._count.id
    acc[violation.userId].total += violation._count.id
    
    return acc
  }, {} as Record<string, { high: number, medium: number, low: number, total: number }>)

  // Get user details and calculate final risk scores
  const userIds = Object.keys(userRiskScores)
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, role: true }
  })

  return users.map(user => {
    const violations = userRiskScores[user.id]
    const riskScore = (violations.high * 3 + violations.medium * 2 + violations.low * 1) / violations.total
    
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
    if (riskScore >= 2.5 || violations.high >= 3) riskLevel = 'HIGH'
    else if (riskScore >= 1.5 || violations.medium >= 5) riskLevel = 'MEDIUM'
    else riskLevel = 'LOW'

    return {
      user,
      violations,
      riskScore: Math.round(riskScore * 100) / 100,
      riskLevel
    }
  }).sort((a, b) => b.riskScore - a.riskScore)
}

async function analyzeQuizIntegrity(quizId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      chatRooms: {
        include: {
          suspiciousActivities: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        }
      },
      attempts: {
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      }
    }
  })

  if (!quiz) return null

  const violations = quiz.chatRooms.flatMap(room => room.suspiciousActivities)
  const attemptUsers = quiz.attempts.map(attempt => attempt.user.id)
  const violationUsers = violations.map(violation => violation.userId)
  
  // Users who had violations and took the quiz
  const compromisedAttempts = attemptUsers.filter(userId => violationUsers.includes(userId))
  
  return {
    quizTitle: quiz.title,
    totalAttempts: quiz.attempts.length,
    totalViolations: violations.length,
    compromisedAttempts: compromisedAttempts.length,
    integrityScore: Math.max(0, 100 - (compromisedAttempts.length / quiz.attempts.length) * 100),
    violationsByType: violations.reduce((acc, violation) => {
      acc[violation.type] = (acc[violation.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }
}

function generateRecommendations(
  activities: any[], 
  patterns: any
): string[] {
  const recommendations: string[] = []

  // High severity violations
  const highSeverityCount = activities.filter(a => a.severity === 'HIGH').length
  if (highSeverityCount > 5) {
    recommendations.push('Immediate review required: High number of severe violations detected')
    recommendations.push('Consider implementing stricter chat monitoring during quiz periods')
  }

  // Repeat offenders
  if (patterns.repeatOffenders.length > 0) {
    recommendations.push(`Monitor ${patterns.repeatOffenders.length} repeat offenders closely`)
    recommendations.push('Consider individual meetings with students showing repeated violations')
  }

  // Time-based patterns
  const peakViolationHour = Object.entries(patterns.hourlyDistribution)
    .sort(([,a], [,b]) => (b as any).total - (a as any).total)[0]

  if (peakViolationHour && (peakViolationHour[1] as any).total > 5) {
    recommendations.push(`Increase monitoring during ${peakViolationHour[0]}:00 - peak violation time`)
  }

  // Violation types
  const keywordViolations = patterns.violationsByType.find((v: any) => v.type === 'KEYWORD_MATCH')
  if (keywordViolations && keywordViolations.count > 10) {
    recommendations.push('Review and update suspicious keyword detection rules')
    recommendations.push('Provide clearer guidelines on acceptable chat behavior during quizzes')
  }

  const timingViolations = patterns.violationsByType.find((v: any) => v.type === 'TIMING_VIOLATION')
  if (timingViolations && timingViolations.count > 5) {
    recommendations.push('Enforce stricter chat restrictions during active quiz periods')
    recommendations.push('Consider disabling chat completely during quiz attempts')
  }

  // General recommendations
  if (activities.length > 20) {
    recommendations.push('Conduct academic integrity workshop for students')
    recommendations.push('Review quiz security measures and chat policies')
  }

  return recommendations
}

function calculateIntegrityScore(
  summary: any, 
  patterns: any
): { score: number, level: string, description: string } {
  let score = 100

  // Deduct points based on violations
  score -= summary.highSeverityViolations * 5
  score -= summary.mediumSeverityViolations * 2
  score -= summary.lowSeverityViolations * 0.5

  // Deduct points for repeat offenders
  score -= patterns.repeatOffenders.length * 3

  // Ensure score doesn't go below 0
  score = Math.max(0, Math.round(score))

  let level: string
  let description: string

  if (score >= 90) {
    level = 'EXCELLENT'
    description = 'Very high academic integrity with minimal violations'
  } else if (score >= 75) {
    level = 'GOOD'
    description = 'Good academic integrity with some minor concerns'
  } else if (score >= 60) {
    level = 'FAIR'
    description = 'Moderate integrity concerns requiring attention'
  } else if (score >= 40) {
    level = 'POOR'
    description = 'Significant integrity issues requiring immediate action'
  } else {
    level = 'CRITICAL'
    description = 'Critical integrity violations requiring urgent intervention'
  }

  return { score, level, description }
}
