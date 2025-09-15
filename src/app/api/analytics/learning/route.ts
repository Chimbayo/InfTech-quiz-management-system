import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

// GET /api/analytics/learning - Get learning analytics data
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole('ADMIN')
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30' // days
    const quizId = searchParams.get('quizId')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(timeRange))

    // Base query conditions
    const whereConditions: any = {
      createdAt: {
        gte: startDate
      }
    }

    if (quizId) {
      whereConditions.roomId = {
        in: await prisma.chatRoom.findMany({
          where: { quizId },
          select: { id: true }
        }).then(rooms => rooms.map(r => r.id))
      }
    }

    // 1. Chat Engagement vs Quiz Performance Correlation
    const chatEngagementData = await prisma.chatMessage.groupBy({
      by: ['userId'],
      where: whereConditions,
      _count: {
        id: true
      }
    })

    const userIds = chatEngagementData.map(d => d.userId)
    
    const quizPerformanceData = await prisma.quizAttempt.groupBy({
      by: ['userId'],
      where: {
        userId: { in: userIds },
        completedAt: {
          gte: startDate
        },
        ...(quizId && { quizId })
      },
      _avg: {
        score: true
      },
      _count: {
        id: true
      }
    })

    // Correlate chat engagement with quiz performance
    const engagementCorrelation = chatEngagementData.map(chat => {
      const performance = quizPerformanceData.find(p => p.userId === chat.userId)
      return {
        userId: chat.userId,
        messageCount: chat._count.id,
        averageScore: performance?._avg.score || 0,
        quizAttempts: performance?._count.id || 0
      }
    })

    // 2. Study Pattern Analysis
    const studyPatterns = await prisma.chatMessage.findMany({
      where: {
        ...whereConditions,
        room: {
          type: { in: ['QUIZ_DISCUSSION', 'STUDY_GROUP'] }
        }
      },
      select: {
        userId: true,
        createdAt: true,
        room: {
          select: {
            type: true,
            quizId: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Group by user and analyze patterns
    const userStudyPatterns = studyPatterns.reduce((acc, message) => {
      if (!acc[message.userId]) {
        acc[message.userId] = {
          totalMessages: 0,
          quizDiscussionMessages: 0,
          studyGroupMessages: 0,
          studySessions: [],
          peakHours: {}
        }
      }

      acc[message.userId].totalMessages++
      
      if (message.room.type === 'QUIZ_DISCUSSION') {
        acc[message.userId].quizDiscussionMessages++
      } else if (message.room.type === 'STUDY_GROUP') {
        acc[message.userId].studyGroupMessages++
      }

      // Track peak study hours
      const hour = new Date(message.createdAt).getHours()
      acc[message.userId].peakHours[hour] = (acc[message.userId].peakHours[hour] || 0) + 1

      return acc
    }, {} as Record<string, any>)

    // 3. Peer Learning Metrics
    const peerLearningData = await prisma.chatMessage.findMany({
      where: {
        ...whereConditions,
        content: {
          contains: '?'
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        room: {
          select: {
            type: true,
            name: true
          }
        }
      }
    })

    // Analyze questions asked vs answers provided
    const peerInteractions = peerLearningData.reduce((acc, message) => {
      const isQuestion = message.content.includes('?')
      const userId = message.userId

      if (!acc[userId]) {
        acc[userId] = {
          questionsAsked: 0,
          helpProvided: 0,
          userName: message.user.name,
          userRole: message.user.role
        }
      }

      if (isQuestion) {
        acc[userId].questionsAsked++
      }

      return acc
    }, {} as Record<string, any>)

    // 4. Teacher Intervention Tracking
    const teacherInterventions = await prisma.chatMessage.findMany({
      where: {
        ...whereConditions,
        user: {
          role: { in: ['ADMIN', 'TEACHER'] }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        room: {
          select: {
            type: true,
            name: true,
            quiz: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      }
    })

    // 5. Study Group Effectiveness
    const studyGroupEffectiveness = await prisma.studyGroup.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      include: {
        members: {
          include: {
            user: {
              include: {
                attempts: {
                  where: {
                    completedAt: {
                      gte: startDate
                    }
                  },
                  select: {
                    score: true,
                    passed: true,
                    quiz: {
                      select: {
                        id: true,
                        title: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        chatRooms: {
          include: {
            _count: {
              select: {
                messages: true
              }
            }
          }
        }
      }
    })

    // Calculate group performance metrics
    const groupMetrics = studyGroupEffectiveness.map(group => {
      const memberScores = group.members.flatMap(member => 
        member.user.attempts.map(attempt => attempt.score)
      )
      
      const averageScore = memberScores.length > 0 
        ? memberScores.reduce((sum, score) => sum + score, 0) / memberScores.length 
        : 0

      const passRate = group.members.length > 0
        ? group.members.filter(member => 
            member.user.attempts.some(attempt => attempt.passed)
          ).length / group.members.length
        : 0

      const totalMessages = group.chatRooms.reduce((sum, room) => 
        sum + room._count.messages, 0
      )

      return {
        groupId: group.id,
        groupName: group.name,
        memberCount: group.members.length,
        averageScore,
        passRate,
        totalMessages,
        messagesPerMember: group.members.length > 0 ? totalMessages / group.members.length : 0
      }
    })

    // 6. Time-based Analysis
    const timeBasedAnalysis = await prisma.chatMessage.groupBy({
      by: ['createdAt'],
      where: whereConditions,
      _count: {
        id: true
      }
    })

    // Group by day for trend analysis
    const dailyActivity = timeBasedAnalysis.reduce((acc, item) => {
      const date = new Date(item.createdAt).toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + item._count.id
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      engagementCorrelation,
      userStudyPatterns,
      peerInteractions,
      teacherInterventions: {
        total: teacherInterventions.length,
        byTeacher: teacherInterventions.reduce((acc, intervention) => {
          const teacherId = intervention.user.id
          if (!acc[teacherId]) {
            acc[teacherId] = {
              name: intervention.user.name,
              interventions: 0,
              rooms: new Set()
            }
          }
          acc[teacherId].interventions++
          acc[teacherId].rooms.add(intervention.room.name)
          return acc
        }, {} as Record<string, any>)
      },
      studyGroupEffectiveness: groupMetrics,
      dailyActivity,
      summary: {
        totalUsers: Object.keys(userStudyPatterns).length,
        totalMessages: Object.values(userStudyPatterns).reduce((sum: number, pattern: any) => sum + pattern.totalMessages, 0),
        averageEngagement: engagementCorrelation.length > 0 
          ? engagementCorrelation.reduce((sum, item) => sum + item.messageCount, 0) / engagementCorrelation.length 
          : 0,
        correlationStrength: calculateCorrelation(engagementCorrelation)
      }
    })
  } catch (error) {
    console.error('Error fetching learning analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateCorrelation(data: Array<{messageCount: number, averageScore: number}>) {
  if (data.length < 2) return 0

  const n = data.length
  const sumX = data.reduce((sum, item) => sum + item.messageCount, 0)
  const sumY = data.reduce((sum, item) => sum + item.averageScore, 0)
  const sumXY = data.reduce((sum, item) => sum + (item.messageCount * item.averageScore), 0)
  const sumX2 = data.reduce((sum, item) => sum + (item.messageCount * item.messageCount), 0)
  const sumY2 = data.reduce((sum, item) => sum + (item.averageScore * item.averageScore), 0)

  const numerator = (n * sumXY) - (sumX * sumY)
  const denominator = Math.sqrt(((n * sumX2) - (sumX * sumX)) * ((n * sumY2) - (sumY * sumY)))

  return denominator === 0 ? 0 : numerator / denominator
}
