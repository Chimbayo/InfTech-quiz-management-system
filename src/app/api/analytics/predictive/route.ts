import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

// GET /api/analytics/predictive - Get predictive analytics for student success
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole('ADMIN')
    const { searchParams } = new URL(request.url)
    const timeRange = parseInt(searchParams.get('timeRange') || '90') // days

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - timeRange)

    // Get all students with their engagement and performance data
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: {
        chatMessages: {
          where: {
            createdAt: { gte: startDate },
            isDeleted: false,
            isSystemMessage: false
          },
          select: {
            id: true,
            createdAt: true,
            room: {
              select: {
                type: true,
                quizId: true
              }
            }
          }
        },
        attempts: {
          where: {
            completedAt: { gte: startDate }
          },
          select: {
            id: true,
            score: true,
            passed: true,
            completedAt: true,
            quiz: {
              select: {
                id: true,
                title: true,
                passingScore: true
              }
            }
          }
        },
        studyGroupMemberships: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
                createdAt: true
              }
            }
          }
        }
      }
    })

    // Calculate predictive metrics for each student
    const predictions = students.map(student => {
      const chatEngagement = calculateChatEngagement(student.chatMessages)
      const performanceMetrics = calculatePerformanceMetrics(student.attempts)
      const studyGroupParticipation = calculateStudyGroupParticipation(student.studyGroupMemberships)
      
      // Predict success probability using weighted factors
      const successProbability = predictSuccessProbability({
        chatEngagement,
        performanceMetrics,
        studyGroupParticipation
      })

      // Identify at-risk indicators
      const riskFactors = identifyRiskFactors({
        chatEngagement,
        performanceMetrics,
        studyGroupParticipation,
        student
      })

      // Generate intervention recommendations
      const interventions = generateInterventionRecommendations(riskFactors, {
        chatEngagement,
        performanceMetrics,
        studyGroupParticipation
      })

      return {
        student: {
          id: student.id,
          name: student.name,
          email: student.email
        },
        metrics: {
          chatEngagement,
          performanceMetrics,
          studyGroupParticipation
        },
        predictions: {
          successProbability,
          riskLevel: getRiskLevel(successProbability),
          nextQuizSuccessRate: predictNextQuizSuccess({
            chatEngagement,
            performanceMetrics
          })
        },
        riskFactors,
        interventions
      }
    })

    // Sort by risk level (highest risk first)
    predictions.sort((a, b) => a.predictions.successProbability - b.predictions.successProbability)

    // Generate cohort insights
    const cohortInsights = generateCohortInsights(predictions)

    // Early warning system
    const earlyWarnings = generateEarlyWarnings(predictions)

    return NextResponse.json({
      predictions,
      cohortInsights,
      earlyWarnings,
      summary: {
        totalStudents: students.length,
        highRiskStudents: predictions.filter(p => p.predictions.riskLevel === 'HIGH').length,
        mediumRiskStudents: predictions.filter(p => p.predictions.riskLevel === 'MEDIUM').length,
        lowRiskStudents: predictions.filter(p => p.predictions.riskLevel === 'LOW').length,
        averageSuccessProbability: predictions.reduce((sum, p) => sum + p.predictions.successProbability, 0) / predictions.length
      }
    })
  } catch (error) {
    console.error('Error generating predictive analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateChatEngagement(messages: any[]) {
  const totalMessages = messages.length
  const quizDiscussionMessages = messages.filter(m => m.room.type === 'QUIZ_DISCUSSION').length
  const studyGroupMessages = messages.filter(m => m.room.type === 'STUDY_GROUP').length
  const generalMessages = messages.filter(m => m.room.type === 'GENERAL').length

  // Calculate engagement frequency (messages per day)
  const daysSinceFirstMessage = messages.length > 0 
    ? Math.max(1, Math.ceil((new Date().getTime() - new Date(messages[0].createdAt).getTime()) / (1000 * 60 * 60 * 24)))
    : 1
  
  const engagementFrequency = totalMessages / daysSinceFirstMessage

  // Calculate engagement diversity score
  const engagementTypes = [
    quizDiscussionMessages > 0 ? 1 : 0,
    studyGroupMessages > 0 ? 1 : 0,
    generalMessages > 0 ? 1 : 0
  ].reduce((sum, type) => sum + type, 0)

  const diversityScore = engagementTypes / 3

  return {
    totalMessages,
    quizDiscussionMessages,
    studyGroupMessages,
    generalMessages,
    engagementFrequency,
    diversityScore,
    engagementScore: Math.min(100, (engagementFrequency * 10 + diversityScore * 30))
  }
}

function calculatePerformanceMetrics(attempts: any[]) {
  if (attempts.length === 0) {
    return {
      totalAttempts: 0,
      averageScore: 0,
      passRate: 0,
      improvementTrend: 0,
      consistencyScore: 0,
      recentPerformance: 0
    }
  }

  const totalAttempts = attempts.length
  const averageScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0) / totalAttempts
  const passRate = attempts.filter(attempt => attempt.passed).length / totalAttempts

  // Calculate improvement trend (comparing first half vs second half)
  const midpoint = Math.floor(totalAttempts / 2)
  const firstHalfAvg = attempts.slice(0, midpoint).reduce((sum, attempt) => sum + attempt.score, 0) / Math.max(1, midpoint)
  const secondHalfAvg = attempts.slice(midpoint).reduce((sum, attempt) => sum + attempt.score, 0) / Math.max(1, totalAttempts - midpoint)
  const improvementTrend = secondHalfAvg - firstHalfAvg

  // Calculate consistency (inverse of standard deviation)
  const variance = attempts.reduce((sum, attempt) => sum + Math.pow(attempt.score - averageScore, 2), 0) / totalAttempts
  const standardDeviation = Math.sqrt(variance)
  const consistencyScore = Math.max(0, 100 - standardDeviation)

  // Recent performance (last 3 attempts)
  const recentAttempts = attempts.slice(-3)
  const recentPerformance = recentAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / recentAttempts.length

  return {
    totalAttempts,
    averageScore,
    passRate,
    improvementTrend,
    consistencyScore,
    recentPerformance
  }
}

function calculateStudyGroupParticipation(memberships: any[]) {
  const activeGroups = memberships.length
  const participationScore = Math.min(100, activeGroups * 25) // Max 100 for 4+ groups

  return {
    activeGroups,
    participationScore,
    hasStudyGroups: activeGroups > 0
  }
}

function predictSuccessProbability(metrics: any) {
  const { chatEngagement, performanceMetrics, studyGroupParticipation } = metrics

  // Weighted factors for success prediction
  const weights = {
    performance: 0.4,
    chatEngagement: 0.3,
    studyGroup: 0.2,
    consistency: 0.1
  }

  const performanceScore = Math.min(100, performanceMetrics.averageScore)
  const engagementScore = chatEngagement.engagementScore
  const studyGroupScore = studyGroupParticipation.participationScore
  const consistencyScore = performanceMetrics.consistencyScore

  const weightedScore = 
    (performanceScore * weights.performance) +
    (engagementScore * weights.chatEngagement) +
    (studyGroupScore * weights.studyGroup) +
    (consistencyScore * weights.consistency)

  return Math.round(weightedScore)
}

function getRiskLevel(successProbability: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (successProbability >= 75) return 'LOW'
  if (successProbability >= 50) return 'MEDIUM'
  return 'HIGH'
}

function predictNextQuizSuccess(metrics: any) {
  const { chatEngagement, performanceMetrics } = metrics
  
  // Factor in recent performance trend and engagement
  const trendBonus = performanceMetrics.improvementTrend > 0 ? 10 : -5
  const engagementBonus = chatEngagement.engagementScore > 50 ? 5 : -10
  
  const baseRate = performanceMetrics.recentPerformance || performanceMetrics.averageScore
  const predictedRate = Math.max(0, Math.min(100, baseRate + trendBonus + engagementBonus))
  
  return Math.round(predictedRate)
}

function identifyRiskFactors(data: any) {
  const { chatEngagement, performanceMetrics, studyGroupParticipation, student } = data
  const riskFactors = []

  // Performance-based risks
  if (performanceMetrics.averageScore < 60) {
    riskFactors.push({
      type: 'LOW_PERFORMANCE',
      severity: 'HIGH',
      description: 'Consistently low quiz scores',
      value: performanceMetrics.averageScore
    })
  }

  if (performanceMetrics.improvementTrend < -10) {
    riskFactors.push({
      type: 'DECLINING_PERFORMANCE',
      severity: 'HIGH',
      description: 'Performance declining over time',
      value: performanceMetrics.improvementTrend
    })
  }

  // Engagement-based risks
  if (chatEngagement.totalMessages < 5) {
    riskFactors.push({
      type: 'LOW_ENGAGEMENT',
      severity: 'MEDIUM',
      description: 'Very low chat participation',
      value: chatEngagement.totalMessages
    })
  }

  if (chatEngagement.engagementFrequency < 0.1) {
    riskFactors.push({
      type: 'INFREQUENT_PARTICIPATION',
      severity: 'MEDIUM',
      description: 'Infrequent learning activities',
      value: chatEngagement.engagementFrequency
    })
  }

  // Study group risks
  if (!studyGroupParticipation.hasStudyGroups) {
    riskFactors.push({
      type: 'NO_STUDY_GROUPS',
      severity: 'LOW',
      description: 'Not participating in study groups',
      value: 0
    })
  }

  // Consistency risks
  if (performanceMetrics.consistencyScore < 30) {
    riskFactors.push({
      type: 'INCONSISTENT_PERFORMANCE',
      severity: 'MEDIUM',
      description: 'Highly variable quiz performance',
      value: performanceMetrics.consistencyScore
    })
  }

  return riskFactors
}

interface Intervention {
  type: string
  priority: string
  action: string
  description: string
}

function generateInterventionRecommendations(riskFactors: any[], metrics: any): Intervention[] {
  const interventions: Intervention[] = []

  riskFactors.forEach(risk => {
    switch (risk.type) {
      case 'LOW_PERFORMANCE':
        interventions.push({
          type: 'ACADEMIC_SUPPORT',
          priority: 'HIGH',
          action: 'Schedule one-on-one tutoring session',
          description: 'Provide additional academic support and review study strategies'
        })
        break

      case 'DECLINING_PERFORMANCE':
        interventions.push({
          type: 'EARLY_WARNING',
          priority: 'HIGH',
          action: 'Immediate instructor meeting',
          description: 'Address declining performance before it becomes critical'
        })
        break

      case 'LOW_ENGAGEMENT':
        interventions.push({
          type: 'ENGAGEMENT_BOOST',
          priority: 'MEDIUM',
          action: 'Encourage chat participation',
          description: 'Send personalized messages to increase discussion involvement'
        })
        break

      case 'NO_STUDY_GROUPS':
        interventions.push({
          type: 'SOCIAL_LEARNING',
          priority: 'LOW',
          action: 'Invite to study group',
          description: 'Connect with peers for collaborative learning'
        })
        break

      case 'INCONSISTENT_PERFORMANCE':
        interventions.push({
          type: 'STUDY_HABITS',
          priority: 'MEDIUM',
          action: 'Study skills workshop',
          description: 'Help develop consistent study routines and time management'
        })
        break
    }
  })

  return interventions
}

function generateCohortInsights(predictions: any[]) {
  const totalStudents = predictions.length
  
  // Performance distribution
  const performanceDistribution = {
    excellent: predictions.filter(p => p.metrics.performanceMetrics.averageScore >= 90).length,
    good: predictions.filter(p => p.metrics.performanceMetrics.averageScore >= 80 && p.metrics.performanceMetrics.averageScore < 90).length,
    average: predictions.filter(p => p.metrics.performanceMetrics.averageScore >= 70 && p.metrics.performanceMetrics.averageScore < 80).length,
    belowAverage: predictions.filter(p => p.metrics.performanceMetrics.averageScore < 70).length
  }

  // Engagement patterns
  const engagementPatterns = {
    highEngagement: predictions.filter(p => p.metrics.chatEngagement.engagementScore >= 70).length,
    moderateEngagement: predictions.filter(p => p.metrics.chatEngagement.engagementScore >= 40 && p.metrics.chatEngagement.engagementScore < 70).length,
    lowEngagement: predictions.filter(p => p.metrics.chatEngagement.engagementScore < 40).length
  }

  // Success correlation
  const chatEngagementScores = predictions.map(p => p.metrics.chatEngagement.engagementScore)
  const performanceScores = predictions.map(p => p.metrics.performanceMetrics.averageScore)
  const correlation = calculateCorrelation(chatEngagementScores, performanceScores)

  return {
    performanceDistribution,
    engagementPatterns,
    correlation: {
      chatEngagementVsPerformance: correlation,
      strength: getCorrelationStrength(correlation)
    },
    trends: {
      averageImprovement: predictions.reduce((sum, p) => sum + p.metrics.performanceMetrics.improvementTrend, 0) / totalStudents,
      studyGroupParticipation: predictions.filter(p => p.metrics.studyGroupParticipation.hasStudyGroups).length / totalStudents
    }
  }
}

function generateEarlyWarnings(predictions: any[]) {
  const warnings = []

  // Critical risk students
  const criticalRiskStudents = predictions.filter(p => 
    p.predictions.riskLevel === 'HIGH' && 
    p.riskFactors.some((rf: any) => rf.severity === 'HIGH')
  )

  if (criticalRiskStudents.length > 0) {
    warnings.push({
      type: 'CRITICAL_RISK',
      severity: 'HIGH',
      count: criticalRiskStudents.length,
      message: `${criticalRiskStudents.length} students require immediate intervention`,
      students: criticalRiskStudents.map(s => s.student.name)
    })
  }

  // Declining performance trend
  const decliningStudents = predictions.filter(p => 
    p.metrics.performanceMetrics.improvementTrend < -15
  )

  if (decliningStudents.length > 0) {
    warnings.push({
      type: 'DECLINING_TREND',
      severity: 'MEDIUM',
      count: decliningStudents.length,
      message: `${decliningStudents.length} students showing significant performance decline`,
      students: decliningStudents.map(s => s.student.name)
    })
  }

  // Low engagement alert
  const lowEngagementStudents = predictions.filter(p => 
    p.metrics.chatEngagement.totalMessages < 3 && 
    p.metrics.performanceMetrics.totalAttempts > 0
  )

  if (lowEngagementStudents.length > 0) {
    warnings.push({
      type: 'LOW_ENGAGEMENT',
      severity: 'LOW',
      count: lowEngagementStudents.length,
      message: `${lowEngagementStudents.length} students with very low engagement`,
      students: lowEngagementStudents.map(s => s.student.name)
    })
  }

  return warnings
}

function calculateCorrelation(x: number[], y: number[]) {
  const n = x.length
  if (n === 0) return 0

  const sumX = x.reduce((sum, val) => sum + val, 0)
  const sumY = y.reduce((sum, val) => sum + val, 0)
  const sumXY = x.reduce((sum, val, i) => sum + (val * y[i]), 0)
  const sumX2 = x.reduce((sum, val) => sum + (val * val), 0)
  const sumY2 = y.reduce((sum, val) => sum + (val * val), 0)

  const numerator = (n * sumXY) - (sumX * sumY)
  const denominator = Math.sqrt(((n * sumX2) - (sumX * sumX)) * ((n * sumY2) - (sumY * sumY)))

  return denominator === 0 ? 0 : numerator / denominator
}

function getCorrelationStrength(correlation: number) {
  const abs = Math.abs(correlation)
  if (abs >= 0.7) return 'Strong'
  if (abs >= 0.3) return 'Moderate'
  return 'Weak'
}
