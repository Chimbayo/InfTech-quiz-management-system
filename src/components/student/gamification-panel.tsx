'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  Trophy, 
  Star, 
  Award, 
  Target, 
  TrendingUp,
  Users,
  MessageSquare,
  BookOpen,
  Flame
} from 'lucide-react'

interface Achievement {
  type: string
  name: string
  description: string
  level: number
  badge: string
  title: string
  requirement: number
  currentValue: number
  earnedAt: Date
}

interface NextAchievement {
  type: string
  name: string
  description: string
  nextLevel: number
  nextBadge: string
  nextTitle: string
  requirement: number
  currentValue: number
  progress: number
}

interface GamificationData {
  achievements: Achievement[]
  totalPoints: number
  nextAchievements: NextAchievement[]
}

interface GamificationPanelProps {
  userId: string
}

export function GamificationPanel({ userId }: GamificationPanelProps) {
  const [data, setData] = useState<GamificationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'earned' | 'progress'>('earned')

  useEffect(() => {
    fetchAchievements()
  }, [userId])

  const fetchAchievements = async () => {
    try {
      const response = await fetch(`/api/gamification/achievements?userId=${userId}`)
      if (response.ok) {
        const achievementData = await response.json()
        setData(achievementData)
      }
    } catch (error) {
      console.error('Error fetching achievements:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'STUDY_STREAK': return <Flame className="h-5 w-5" />
      case 'PEER_HELPER': return <Users className="h-5 w-5" />
      case 'QUIZ_MASTERY': return <BookOpen className="h-5 w-5" />
      case 'STUDY_GROUP_LEADER': return <Award className="h-5 w-5" />
      case 'CHAT_ENGAGEMENT': return <MessageSquare className="h-5 w-5" />
      default: return <Star className="h-5 w-5" />
    }
  }

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-bronze-100 text-bronze-800 border-bronze-200'
      case 2: return 'bg-silver-100 text-silver-800 border-silver-200'
      case 3: return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 4: return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500'
    if (progress >= 50) return 'bg-yellow-500'
    return 'bg-blue-500'
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading achievements...</span>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Unable to load achievements</p>
          <Button onClick={fetchAchievements} className="mt-4">Retry</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Points */}
      <Card className="bg-gradient-to-r from-purple-500 to-blue-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Your Achievements</h2>
              <p className="text-purple-100">Keep learning and earning rewards!</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{data.totalPoints}</div>
              <div className="text-sm text-purple-100">Total Points</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <Button
          variant={activeTab === 'earned' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('earned')}
          className="flex-1"
        >
          <Trophy className="h-4 w-4 mr-2" />
          Earned ({data.achievements.length})
        </Button>
        <Button
          variant={activeTab === 'progress' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('progress')}
          className="flex-1"
        >
          <Target className="h-4 w-4 mr-2" />
          In Progress ({data.nextAchievements.length})
        </Button>
      </div>

      {/* Earned Achievements */}
      {activeTab === 'earned' && (
        <div className="space-y-4">
          {data.achievements.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Achievements Yet</h3>
                <p className="text-gray-600">
                  Start participating in quizzes and discussions to earn your first achievement!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.achievements.map((achievement, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="text-4xl">{achievement.badge}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getAchievementIcon(achievement.type)}
                          <h3 className="font-semibold">{achievement.name}</h3>
                          <Badge className={getLevelColor(achievement.level)}>
                            Level {achievement.level}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                        <p className="text-sm font-medium text-blue-600">{achievement.title}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Earned: {new Date(achievement.earnedAt).toLocaleDateString()}
                        </p>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{achievement.currentValue}/{achievement.requirement}</span>
                          </div>
                          <Progress 
                            value={(achievement.currentValue / achievement.requirement) * 100} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Progress Achievements */}
      {activeTab === 'progress' && (
        <div className="space-y-4">
          {data.nextAchievements.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">All Caught Up!</h3>
                <p className="text-gray-600">
                  You've reached the highest level in all achievement categories. Keep up the great work!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.nextAchievements.map((achievement, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="text-4xl opacity-50">{achievement.nextBadge}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getAchievementIcon(achievement.type)}
                          <h3 className="font-semibold">{achievement.name}</h3>
                          <Badge variant="outline">
                            Next: Level {achievement.nextLevel}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                        <p className="text-sm font-medium text-purple-600">{achievement.nextTitle}</p>
                        
                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{achievement.currentValue}/{achievement.requirement}</span>
                          </div>
                          <Progress 
                            value={achievement.progress} 
                            className="h-3"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {Math.round(achievement.progress)}% complete
                          </p>
                        </div>

                        {achievement.progress >= 80 && (
                          <div className="mt-3 p-2 bg-green-50 rounded-lg">
                            <p className="text-xs text-green-700 font-medium">
                              🎉 Almost there! Just {achievement.requirement - achievement.currentValue} more to go!
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tips to Earn More Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <span><strong>Study Streak:</strong> Take quizzes daily</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span><strong>Peer Helper:</strong> Answer questions in chat</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-green-500" />
                <span><strong>Quiz Mastery:</strong> Score 80% or higher</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-purple-500" />
                <span><strong>Group Leader:</strong> Participate in study groups</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-indigo-500" />
                <span><strong>Chat Engagement:</strong> Join discussions</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
