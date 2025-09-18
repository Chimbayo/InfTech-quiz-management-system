'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Award,
  Clock,
  Target,
  BookOpen,
  Brain,
  Activity
} from 'lucide-react'

interface LearningAnalyticsData {
  engagementCorrelation: Array<{
    userId: string
    messageCount: number
    averageScore: number
    quizAttempts: number
  }>
  userStudyPatterns: Record<string, {
    totalMessages: number
    quizDiscussionMessages: number
    studyGroupMessages: number
    peakHours: Record<string, number>
  }>
  peerInteractions: Record<string, {
    questionsAsked: number
    helpProvided: number
    userName: string
    userRole: string
  }>
  teacherInterventions: {
    total: number
    byTeacher: Record<string, {
      name: string
      interventions: number
      rooms: Set<string>
    }>
  }
  studyGroupEffectiveness: Array<{
    groupId: string
    groupName: string
    memberCount: number
    averageScore: number
    passRate: number
    totalMessages: number
    messagesPerMember: number
  }>
  dailyActivity: Record<string, number>
  summary: {
    totalUsers: number
    totalMessages: number
    averageEngagement: number
    correlationStrength: number
  }
}

export function LearningAnalyticsDashboard() {
  const [data, setData] = useState<LearningAnalyticsData | null>(null)
  const [timeRange, setTimeRange] = useState('30')
  const [selectedQuiz, setSelectedQuiz] = useState<string>('all')
  const [quizzes, setQuizzes] = useState<Array<{id: string, title: string}>>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchQuizzes()
    fetchAnalytics()
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange, selectedQuiz])

  const fetchQuizzes = async () => {
    try {
      const response = await fetch('/api/quizzes')
      if (response.ok) {
        const quizzesData = await response.json()
        setQuizzes(quizzesData)
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error)
    }
  }

  const fetchAnalytics = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        timeRange,
        ...(selectedQuiz && selectedQuiz !== 'all' && { quizId: selectedQuiz })
      })
      
      const response = await fetch(`/api/analytics/learning?${params}`)
      if (response.ok) {
        const analyticsData = await response.json()
        setData(analyticsData)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getCorrelationColor = (correlation: number) => {
    if (correlation > 0.7) return 'text-green-600'
    if (correlation > 0.3) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getCorrelationLabel = (correlation: number) => {
    if (correlation > 0.7) return 'Strong Positive'
    if (correlation > 0.3) return 'Moderate Positive'
    if (correlation > -0.3) return 'Weak/No Correlation'
    if (correlation > -0.7) return 'Moderate Negative'
    return 'Strong Negative'
  }

  const getMostActiveHour = (peakHours: Record<string, number>) => {
    const hours = Object.entries(peakHours)
    if (hours.length === 0) return 'N/A'
    
    const mostActive = hours.reduce((max, [hour, count]) => 
      count > max.count ? { hour: parseInt(hour), count } : max
    , { hour: 0, count: 0 })
    
    return `${mostActive.hour}:00`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading analytics...</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load analytics data</p>
        <Button onClick={fetchAnalytics} className="mt-4">Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Learning Analytics Dashboard</h1>
          <p className="text-gray-600">Analyze engagement patterns and learning effectiveness</p>
        </div>
        
        <div className="flex gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedQuiz} onValueChange={setSelectedQuiz}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Quizzes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Quizzes</SelectItem>
              {quizzes.map(quiz => (
                <SelectItem key={quiz.id} value={quiz.id}>{quiz.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-3xl font-bold">{data.summary.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Messages</p>
                <p className="text-3xl font-bold">{data.summary.totalMessages.toLocaleString()}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Engagement</p>
                <p className="text-3xl font-bold">{Math.round(data.summary.averageEngagement)}</p>
                <p className="text-xs text-gray-500">messages/user</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Correlation</p>
                <p className={`text-3xl font-bold ${getCorrelationColor(data.summary.correlationStrength)}`}>
                  {(data.summary.correlationStrength * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-gray-500">chat-performance</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Correlation Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Chat Engagement vs Quiz Performance
          </CardTitle>
          <CardDescription>
            Correlation between chat participation and quiz scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Badge className={getCorrelationColor(data.summary.correlationStrength)}>
              {getCorrelationLabel(data.summary.correlationStrength)} Correlation
            </Badge>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">High Engagement (&gt; 50 messages)</p>
                <p className="text-2xl font-bold text-blue-600">
                  {data.engagementCorrelation.filter(u => u.messageCount > 50).length}
                </p>
                <p className="text-xs text-gray-500">users</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">High Performers (&gt;70% avg)</p>
                <p className="text-2xl font-bold text-green-600">
                  {data.engagementCorrelation.filter(u => u.averageScore > 70).length}
                </p>
                <p className="text-xs text-gray-500">users</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Both High Engagement & Performance</p>
                <p className="text-2xl font-bold text-purple-600">
                  {data.engagementCorrelation.filter(u => u.messageCount > 50 && u.averageScore > 80).length}
                </p>
                <p className="text-xs text-gray-500">users</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Study Group Effectiveness */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Study Group Effectiveness
          </CardTitle>
          <CardDescription>
            Performance metrics for study groups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.studyGroupEffectiveness.map((group) => (
              <div key={group.groupId} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold">{group.groupName}</h4>
                  <Badge variant={group.passRate > 0.8 ? 'default' : group.passRate > 0.6 ? 'secondary' : 'destructive'}>
                    {(group.passRate * 100).toFixed(0)}% Pass Rate
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Members</p>
                    <p className="font-semibold">{group.memberCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Avg Score</p>
                    <p className="font-semibold">{group.averageScore.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Messages</p>
                    <p className="font-semibold">{group.totalMessages}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Messages/Member</p>
                    <p className="font-semibold">{group.messagesPerMember.toFixed(1)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
