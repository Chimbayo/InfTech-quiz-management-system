import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// Achievement types and criteria
const ACHIEVEMENT_DEFINITIONS = {
  STUDY_STREAK: {
    name: 'Study Streak Master',
    description: 'Complete quizzes on consecutive days',
    levels: [
      { level: 1, requirement: 3, badge: '🔥', title: 'Getting Started' },
      { level: 2, requirement: 7, badge: '🌟', title: 'Week Warrior' },
      { level: 3, requirement: 14, badge: '💎', title: 'Fortnight Fighter' },
      { level: 4, requirement: 30, badge: '👑', title: 'Monthly Master' }
    ]
  },
  PEER_HELPER: {
    name: 'Peer Helper',
    description: 'Help other students in chat discussions',
    levels: [
      { level: 1, requirement: 5, badge: '🤝', title: 'Helpful Friend' },
      { level: 2, requirement: 15, badge: '💪', title: 'Study Buddy' },
      { level: 3, requirement: 30, badge: '🎓', title: 'Mentor' },
      { level: 4, requirement: 50, badge: '🏆', title: 'Teaching Assistant' }
    ]
  },
  QUIZ_MASTERY: {
    name: 'Quiz Mastery',
    description: 'Achieve high scores consistently',
    levels: [
      { level: 1, requirement: 5, badge: '📚', title: 'Good Student' },
      { level: 2, requirement: 10, badge: '🎯', title: 'Focused Learner' },
      { level: 3, requirement: 20, badge: '🧠', title: 'Knowledge Seeker' },
      { level: 4, requirement: 30, badge: '🌟', title: 'Quiz Master' }
    ]
  },
  STUDY_GROUP_LEADER: {
    name: 'Study Group Leader',
    description: 'Active participation in study groups',
    levels: [
      { level: 1, requirement: 10, badge: '👥', title: 'Team Player' },
      { level: 2, requirement: 25, badge: '🗣️', title: 'Discussion Leader' },
      { level: 3, requirement: 50, badge: '🎪', title: 'Group Facilitator' },
      { level: 4, requirement: 100, badge: '👨‍🏫', title: 'Study Group Champion' }
    ]
  },
  CHAT_ENGAGEMENT: {
    name: 'Chat Engagement',
    description: 'Active participation in educational discussions',
    levels: [
      { level: 1, requirement: 20, badge: '💬', title: 'Chatty Student' },
      { level: 2, requirement: 50, badge: '🗨️', title: 'Discussion Enthusiast' },
      { level: 3, requirement: 100, badge: '📢', title: 'Communication Expert' },
      { level: 4, requirement: 200, badge: '🎙️', title: 'Chat Champion' }
    ]
  }
}

// GET /api/gamification/achievements - Get user achievements
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || session.id

    // Calculate achievements based on user activity
    const achievements = await calculateUserAchievements(userId)
    
    return NextResponse.json(achievements)
  } catch (error) {
    console.error('Error fetching achievements:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function calculateUserAchievements(userId: string) {
  const achievements = []

  // 1. Study Streak Achievement
  const studyStreak = await calculateStudyStreak(userId)
  const streakAchievement = getAchievementLevel('STUDY_STREAK', studyStreak)
  if (streakAchievement) {
    achievements.push({
      type: 'STUDY_STREAK',
      ...streakAchievement,
      currentValue: studyStreak,
      earnedAt: new Date()
    })
  }

  // 2. Peer Helper Achievement
  const helpfulMessages = await countHelpfulMessages(userId)
  const helperAchievement = getAchievementLevel('PEER_HELPER', helpfulMessages)
  if (helperAchievement) {
    achievements.push({
      type: 'PEER_HELPER',
      ...helperAchievement,
      currentValue: helpfulMessages,
      earnedAt: new Date()
    })
  }

  // 3. Quiz Mastery Achievement
  const highScoreCount = await countHighScoreQuizzes(userId)
  const masteryAchievement = getAchievementLevel('QUIZ_MASTERY', highScoreCount)
  if (masteryAchievement) {
    achievements.push({
      type: 'QUIZ_MASTERY',
      ...masteryAchievement,
      currentValue: highScoreCount,
      earnedAt: new Date()
    })
  }

  // 4. Study Group Leader Achievement
  const studyGroupMessages = await countStudyGroupMessages(userId)
  const leaderAchievement = getAchievementLevel('STUDY_GROUP_LEADER', studyGroupMessages)
  if (leaderAchievement) {
    achievements.push({
      type: 'STUDY_GROUP_LEADER',
      ...leaderAchievement,
      currentValue: studyGroupMessages,
      earnedAt: new Date()
    })
  }

  // 5. Chat Engagement Achievement
  const totalMessages = await countTotalMessages(userId)
  const chatAchievement = getAchievementLevel('CHAT_ENGAGEMENT', totalMessages)
  if (chatAchievement) {
    achievements.push({
      type: 'CHAT_ENGAGEMENT',
      ...chatAchievement,
      currentValue: totalMessages,
      earnedAt: new Date()
    })
  }

  return {
    achievements,
    totalPoints: achievements.reduce((sum, ach) => sum + (ach.level * 10), 0),
    nextAchievements: getNextAchievements(userId)
  }
}

async function calculateStudyStreak(userId: string) {
  const attempts = await prisma.quizAttempt.findMany({
    where: { 
      userId,
      completedAt: { not: null }
    },
    orderBy: { completedAt: 'desc' },
    select: { completedAt: true }
  })

  if (attempts.length === 0) return 0

  let streak = 0
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)

  for (const attempt of attempts) {
    const attemptDate = new Date(attempt.completedAt!)
    attemptDate.setHours(0, 0, 0, 0)
    
    const daysDiff = Math.floor((currentDate.getTime() - attemptDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff === streak) {
      streak++
    } else if (daysDiff > streak) {
      break
    }
  }
  
  return streak
}

async function countHelpfulMessages(userId: string) {
  // Count messages that contain helpful keywords or are responses to questions
  const helpfulMessages = await prisma.chatMessage.count({
    where: {
      userId,
      OR: [
        { content: { contains: 'help' } },
        { content: { contains: 'explain' } },
        { content: { contains: 'answer' } },
        { content: { contains: 'solution' } },
        { replyToId: { not: null } }
      ],
      isDeleted: false
    }
  })

  return helpfulMessages
}

async function countHighScoreQuizzes(userId: string) {
  const highScoreAttempts = await prisma.quizAttempt.count({
    where: {
      userId,
      score: { gte: 80 },
      completedAt: { not: null }
    }
  })

  return highScoreAttempts
}

async function countStudyGroupMessages(userId: string) {
  const studyGroupMessages = await prisma.chatMessage.count({
    where: {
      userId,
      room: {
        type: 'STUDY_GROUP'
      },
      isDeleted: false
    }
  })

  return studyGroupMessages
}

async function countTotalMessages(userId: string) {
  const totalMessages = await prisma.chatMessage.count({
    where: {
      userId,
      isDeleted: false,
      isSystemMessage: false
    }
  })

  return totalMessages
}

function getAchievementLevel(type: keyof typeof ACHIEVEMENT_DEFINITIONS, value: number) {
  const definition = ACHIEVEMENT_DEFINITIONS[type]
  const levels = definition.levels.filter(level => value >= level.requirement)
  
  if (levels.length === 0) return null
  
  const highestLevel = levels[levels.length - 1]
  
  return {
    ...definition,
    level: highestLevel.level,
    badge: highestLevel.badge,
    title: highestLevel.title,
    requirement: highestLevel.requirement
  }
}

async function getNextAchievements(userId: string) {
  const nextAchievements = []
  
  for (const [type, definition] of Object.entries(ACHIEVEMENT_DEFINITIONS)) {
    let currentValue = 0
    
    switch (type) {
      case 'STUDY_STREAK':
        currentValue = await calculateStudyStreak(userId)
        break
      case 'PEER_HELPER':
        currentValue = await countHelpfulMessages(userId)
        break
      case 'QUIZ_MASTERY':
        currentValue = await countHighScoreQuizzes(userId)
        break
      case 'STUDY_GROUP_LEADER':
        currentValue = await countStudyGroupMessages(userId)
        break
      case 'CHAT_ENGAGEMENT':
        currentValue = await countTotalMessages(userId)
        break
    }
    
    const nextLevel = definition.levels.find(level => currentValue < level.requirement)
    
    if (nextLevel) {
      nextAchievements.push({
        type,
        name: definition.name,
        description: definition.description,
        nextLevel: nextLevel.level,
        nextBadge: nextLevel.badge,
        nextTitle: nextLevel.title,
        requirement: nextLevel.requirement,
        currentValue,
        progress: (currentValue / nextLevel.requirement) * 100
      })
    }
  }
  
  return nextAchievements
}
