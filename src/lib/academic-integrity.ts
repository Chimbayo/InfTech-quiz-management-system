// Academic integrity monitoring utilities
export const SUSPICIOUS_KEYWORDS = [
  // Direct cheating terms
  'answer', 'answers', 'solution', 'solutions', 'cheat', 'cheating',
  'copy', 'copying', 'share', 'sharing', 'help me', 'give me',
  
  // Question-specific terms
  'question', 'questions', 'what is', 'which one', 'correct answer',
  'right answer', 'wrong answer', 'option a', 'option b', 'option c', 'option d',
  'choice a', 'choice b', 'choice c', 'choice d',
  
  // Academic dishonesty
  'plagiarize', 'plagiarism', 'steal', 'stolen', 'fake', 'fabricate',
  'lie', 'lying', 'dishonest', 'fraud', 'fraudulent',
  
  // Collaboration during individual work
  'together', 'collaborate', 'work together', 'team up', 'group work',
  'split up', 'divide', 'you do', 'i do', 'take turns',
  
  // Technology misuse
  'google', 'search', 'look up', 'find online', 'internet', 'website',
  'chatgpt', 'ai', 'artificial intelligence', 'bot', 'automated',
  
  // Time manipulation
  'more time', 'extra time', 'extend', 'extension', 'pause', 'stop timer',
  'reset', 'restart', 'technical issue', 'computer problem'
]

export const QUIZ_RELATED_KEYWORDS = [
  'quiz', 'test', 'exam', 'assessment', 'grade', 'score', 'points',
  'pass', 'fail', 'submit', 'submission', 'attempt', 'try again'
]

export interface SuspiciousActivity {
  type: 'KEYWORD_MATCH' | 'EXCESSIVE_MESSAGING' | 'TIMING_VIOLATION' | 'PATTERN_DETECTION'
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  description: string
  evidence: string[]
  timestamp: Date
  userId: string
  roomId: string
  messageId?: string
}

export function detectSuspiciousKeywords(content: string): {
  isSuspicious: boolean
  matchedKeywords: string[]
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
} {
  const lowerContent = content.toLowerCase()
  const matchedKeywords: string[] = []
  
  // Check for suspicious keywords
  for (const keyword of SUSPICIOUS_KEYWORDS) {
    if (lowerContent.includes(keyword.toLowerCase())) {
      matchedKeywords.push(keyword)
    }
  }
  
  // Determine severity based on number and type of matches
  let severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'
  
  if (matchedKeywords.length >= 3) {
    severity = 'HIGH'
  } else if (matchedKeywords.length >= 2) {
    severity = 'MEDIUM'
  } else if (matchedKeywords.length >= 1) {
    // Check if it's a high-risk keyword
    const highRiskKeywords = ['cheat', 'answer', 'solution', 'copy', 'share']
    const hasHighRisk = matchedKeywords.some(keyword => 
      highRiskKeywords.some(risk => keyword.toLowerCase().includes(risk))
    )
    severity = hasHighRisk ? 'HIGH' : 'LOW'
  }
  
  return {
    isSuspicious: matchedKeywords.length > 0,
    matchedKeywords,
    severity
  }
}

export function analyzeMessageTiming(
  messages: Array<{ createdAt: Date; userId: string }>,
  quizStartTime: Date,
  quizEndTime?: Date
): SuspiciousActivity[] {
  const activities: SuspiciousActivity[] = []
  const now = new Date()
  const activeQuizTime = quizEndTime || now
  
  // Check for messages during quiz time (should be restricted)
  const messagesInQuizTime = messages.filter(msg => 
    msg.createdAt >= quizStartTime && msg.createdAt <= activeQuizTime
  )
  
  if (messagesInQuizTime.length > 0) {
    activities.push({
      type: 'TIMING_VIOLATION',
      severity: 'HIGH',
      description: 'Messages sent during active quiz attempt',
      evidence: [`${messagesInQuizTime.length} messages during quiz time`],
      timestamp: now,
      userId: messagesInQuizTime[0].userId,
      roomId: '', // Will be filled by caller
    })
  }
  
  // Check for excessive messaging patterns
  const userMessageCounts = messages.reduce((acc, msg) => {
    acc[msg.userId] = (acc[msg.userId] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  Object.entries(userMessageCounts).forEach(([userId, count]) => {
    if (count > 20) { // More than 20 messages in the analyzed period
      activities.push({
        type: 'EXCESSIVE_MESSAGING',
        severity: 'MEDIUM',
        description: 'Unusually high message frequency',
        evidence: [`${count} messages in short time period`],
        timestamp: now,
        userId,
        roomId: '', // Will be filled by caller
      })
    }
  })
  
  return activities
}

export function generateIntegrityReport(
  activities: SuspiciousActivity[]
): {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  summary: string
  recommendations: string[]
} {
  const highRiskCount = activities.filter(a => a.severity === 'HIGH').length
  const mediumRiskCount = activities.filter(a => a.severity === 'MEDIUM').length
  const lowRiskCount = activities.filter(a => a.severity === 'LOW').length
  
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'
  let summary = 'No significant integrity concerns detected.'
  const recommendations: string[] = []
  
  if (highRiskCount > 0) {
    riskLevel = 'HIGH'
    summary = `${highRiskCount} high-risk activities detected. Immediate review recommended.`
    recommendations.push('Review flagged messages immediately')
    recommendations.push('Consider invalidating quiz attempts if cheating is confirmed')
    recommendations.push('Contact affected students for clarification')
  } else if (mediumRiskCount > 2) {
    riskLevel = 'HIGH'
    summary = `${mediumRiskCount} medium-risk activities detected. Pattern suggests potential issues.`
    recommendations.push('Review message patterns for academic dishonesty')
    recommendations.push('Monitor students more closely in future assessments')
  } else if (mediumRiskCount > 0 || lowRiskCount > 3) {
    riskLevel = 'MEDIUM'
    summary = `${mediumRiskCount + lowRiskCount} suspicious activities detected. Monitoring recommended.`
    recommendations.push('Keep records of flagged activities')
    recommendations.push('Consider additional proctoring measures')
  }
  
  if (activities.some(a => a.type === 'TIMING_VIOLATION')) {
    recommendations.push('Ensure chat restrictions during quizzes are properly enforced')
  }
  
  if (activities.some(a => a.type === 'KEYWORD_MATCH')) {
    recommendations.push('Review chat content for academic integrity violations')
  }
  
  return { riskLevel, summary, recommendations }
}

export async function logSuspiciousActivity(
  activity: SuspiciousActivity,
  prisma: any
): Promise<void> {
  try {
    await prisma.suspiciousActivity.create({
      data: {
        type: activity.type,
        severity: activity.severity,
        description: activity.description,
        evidence: activity.evidence,
        userId: activity.userId,
        roomId: activity.roomId,
        messageId: activity.messageId,
        timestamp: activity.timestamp,
      },
    })
  } catch (error) {
    console.error('Failed to log suspicious activity:', error)
  }
}

export async function monitorMessage(
  content: string,
  userId: string,
  roomId: string
): Promise<{
  isFlagged: boolean
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  activities: SuspiciousActivity[]
}> {
  const activities: SuspiciousActivity[] = []
  
  // Check for suspicious keywords
  const keywordAnalysis = detectSuspiciousKeywords(content)
  
  if (keywordAnalysis.isSuspicious) {
    activities.push({
      type: 'KEYWORD_MATCH',
      severity: keywordAnalysis.severity,
      description: `Suspicious keywords detected: ${keywordAnalysis.matchedKeywords.join(', ')}`,
      evidence: keywordAnalysis.matchedKeywords,
      timestamp: new Date(),
      userId,
      roomId,
    })
  }
  
  return {
    isFlagged: activities.length > 0,
    severity: activities.length > 0 ? activities[0].severity : 'LOW',
    activities
  }
}
