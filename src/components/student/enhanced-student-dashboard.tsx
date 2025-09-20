'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { StudyMilestone } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BookOpen, 
  BarChart3, 
  Users, 
  MessageSquare, 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Target, 
  Award, 
  Zap, 
  Star, 
  Trophy, 
  Flame, 
  HelpCircle, 
  LogOut, 
  History, 
  Filter, 
  Search,
  Plus,
  ArrowRight,
  ChevronRight,
  Bell,
  Settings,
  User,
  Mail,
  Menu,
  X,
  Play
} from 'lucide-react'
import { GamificationPanel } from '@/components/student/gamification-panel'
import { StudySchedulingPanel } from '@/components/student/study-scheduling-panel'
import { HelpRequestPanel } from '@/components/student/help-request-panel'
import { PeerHelpPanel } from '@/components/student/peer-help-panel'
import { StudyRemindersPanel } from '@/components/student/study-reminders-panel'
import { DirectMessagesPanel } from '@/components/student/direct-messages-panel'
import { SessionUser } from '@/lib/auth'
import NotificationBell from '@/components/NotificationBell'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Quiz, QuizAttempt, ChatRoom, StudyGroup } from '@prisma/client'
import QuizStatusBroadcast from '@/components/realtime/QuizStatusBroadcast'
import InstructorPresence from '@/components/realtime/InstructorPresence'
import StudyProgressUpdates from '@/components/realtime/StudyProgressUpdates'

interface QuizWithCounts extends Quiz {
  creator: {
    name: string
  }
  chatRooms?: {
    id: string
    name: string
    type: string
    quiz?: {
      id: string
      title: string
    }
    _count?: {
      messages: number
    }
  }[]
  _count: {
    questions: number
    attempts: number
  }
  enableStudyGroup?: boolean
}

interface AttemptWithQuiz extends QuizAttempt {
  quiz: {
    title: string
    passingScore: number
  }
}

interface StudyGroupWithMembers extends StudyGroup {
  members: { user: { name: string; id: string; email: string; role: string } }[]
  chatRooms?: { id: string; name: string; type: string; isActive: boolean }[]
  creator: { id: string; name: string; email: string; role: string }
  quiz?: { id: string; title: string; description: string }
  _count: { members: number }
}

interface EnhancedStudentDashboardProps {
  user: SessionUser
  quizzes: QuizWithCounts[]
  attempts: AttemptWithQuiz[]
}

export function EnhancedStudentDashboard({ user, quizzes, attempts }: EnhancedStudentDashboardProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [chatRooms, setChatRooms] = useState<(ChatRoom & {
    quiz?: { id: string; title: string }
    _count?: { messages: number }
  })[]>([])
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([])
  const [studyMilestones, setStudyMilestones] = useState<StudyMilestone[]>([])
  const [activeTab, setActiveTab] = useState('dashboard')
  const [upcomingQuizzes, setUpcomingQuizzes] = useState<QuizWithCounts[]>([])
  const [allQuizzes, setAllQuizzes] = useState<QuizWithCounts[]>(quizzes)
  const [studyStreak, setStudyStreak] = useState(0)
  const [weeklyGoal, setWeeklyGoal] = useState(5)
  const [completedThisWeek, setCompletedThisWeek] = useState(0)
  const [recentNotifications, setRecentNotifications] = useState<any[]>([])
  const [selectedQuizForHelp, setSelectedQuizForHelp] = useState<string | null>(null)
  const [selectedQuizForSession, setSelectedQuizForSession] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'passed' | 'failed'>('all')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { socket, isConnected } = useWebSocket()

  const fetchQuizzes = useCallback(async () => {
    try {
      const response = await fetch('/api/quizzes?role=student')
      if (response.ok) {
        const data = await response.json()
        setAllQuizzes(data)
        setUpcomingQuizzes(data.slice(0, 3))
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error)
    }
  }, [])

  const calculateStudyStreak = useCallback(() => {
    if (attempts.length === 0) return 0
    
    const sortedAttempts = attempts
      .filter(attempt => attempt.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
    
    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)
    
    for (const attempt of sortedAttempts) {
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
  }, [attempts])

  const calculateWeeklyProgress = useCallback(() => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    const weeklyAttempts = attempts.filter(attempt => 
      attempt.completedAt && new Date(attempt.completedAt) > oneWeekAgo
    )
    
    return weeklyAttempts.length
  }, [attempts])

  const fetchChatRooms = useCallback(async () => {
    try {
      const response = await fetch('/api/chat/rooms')
      if (response.ok) {
        const data = await response.json()
        setChatRooms(data)
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error)
    }
  }, [])

  const fetchStudyGroups = useCallback(async () => {
    try {
      const response = await fetch('/api/study-groups')
      if (response.ok) {
        const data = await response.json()
        setStudyGroups(data)
      }
    } catch (error) {
      console.error('Error fetching study groups:', error)
    }
  }, [])

  const fetchStudyMilestones = useCallback(async () => {
    try {
      const response = await fetch('/api/study-milestones')
      if (response.ok) {
        const data = await response.json()
        setStudyMilestones(data)
      }
    } catch (error) {
      console.error('Error fetching study milestones:', error)
    }
  }, [])

  useEffect(() => {
    fetchQuizzes()
    fetchChatRooms()
    fetchStudyGroups()
    fetchStudyMilestones()
    setStudyStreak(calculateStudyStreak())
    setCompletedThisWeek(calculateWeeklyProgress())
  }, [fetchQuizzes, fetchChatRooms, fetchStudyGroups, fetchStudyMilestones, calculateStudyStreak, calculateWeeklyProgress])

  // Real-time notifications effect
  useEffect(() => {
    if (socket && isConnected) {
      socket.on('notification', (notification) => {
        setRecentNotifications(prev => [notification, ...prev.slice(0, 4)])
      })

      // Listen for new chat room creation (especially post-exam rooms)
      socket.on('chatRoomCreated', (data) => {
        console.log('New chat room created:', data)
        fetchChatRooms()
      })

      // Listen for exam end events
      socket.on('examEnded', (data) => {
        console.log('Exam ended:', data)
        setTimeout(() => {
          fetchChatRooms()
        }, 2000)
      })

      const handleQuizNotification = (notification: any) => {
        setRecentNotifications(prev => [notification, ...prev.slice(0, 4)])
      }

      const handleNewQuiz = (data: any) => {
        console.log('New quiz notification received:', data)
        handleQuizNotification({
          type: 'new-quiz',
          message: `New quiz available: ${data.title}`,
          timestamp: new Date()
        })
        fetchQuizzes()
      }

      const handleQuizUpdate = (data: any) => {
        console.log('Quiz update received:', data)
        handleQuizNotification({
          type: 'quiz-updated',
          message: `Quiz updated: ${data.title}`,
          timestamp: new Date()
        })
        fetchQuizzes()
      }

      socket.on('new-quiz-notification', handleNewQuiz)
      socket.on('quiz-broadcast', handleQuizUpdate)

      return () => {
        socket.off('notification')
        socket.off('chatRoomCreated')
        socket.off('examEnded')
        socket.off('new-quiz-notification', handleNewQuiz)
        socket.off('quiz-broadcast', handleQuizUpdate)
      }
    }
  }, [socket, isConnected, fetchQuizzes, fetchChatRooms])

  useEffect(() => {
    setUpcomingQuizzes(allQuizzes.slice(0, 3)) // Show next 3 quizzes
  }, [allQuizzes])

  // Periodic refresh for chat rooms to catch post-exam room creation
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetchChatRooms()
    }, 60000) // Refresh every minute

    return () => clearInterval(refreshInterval)
  }, [fetchChatRooms])


  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleStartQuiz = (quizId: string) => {
    router.push(`/student/quiz/${quizId}`)
  }

  const handleJoinChatRoom = (roomId: string) => {
    router.push(`/chat/${roomId}`)
  }

  const getQuizChatRooms = () => {
    return chatRooms.filter(room => 
      room.type === 'QUIZ_DISCUSSION' || 
      room.type === 'PRE_QUIZ_DISCUSSION' || 
      room.type === 'POST_QUIZ_DISCUSSION' ||
      room.type === 'POST_QUIZ_REVIEW' ||
      room.type === 'POST_EXAM_DISCUSSION' ||
      room.type === 'EXAM_GENERAL_DISCUSSION'
    )
  }

  const getGeneralChatRooms = () => {
    return chatRooms.filter(room => room.type === 'GENERAL')
  }

  const getStudyGroupChatRooms = () => {
    return chatRooms.filter(room => room.type === 'STUDY_GROUP')
  }

  const getPreQuizRooms = () => {
    return chatRooms.filter(room => room.type === 'PRE_QUIZ_DISCUSSION')
  }

  const getPostQuizRooms = () => {
    return chatRooms.filter(room => room.type === 'POST_QUIZ_REVIEW')
  }

  const getGeneralQuizRooms = () => {
    return chatRooms.filter(room => room.type === 'QUIZ_DISCUSSION')
  }

  const getSubjectBasedRooms = () => {
    // Group chat rooms by subject/topic extracted from quiz titles
    const subjectRooms = chatRooms.filter(room => 
      room.quiz && (room.type === 'QUIZ_DISCUSSION' || room.type === 'PRE_QUIZ_DISCUSSION' || room.type === 'POST_QUIZ_REVIEW')
    )
    
    // Group by subject for better organization
    const subjectGroups = new Map()
    subjectRooms.forEach(room => {
      const subject = extractSubject(room.quiz?.title || '')
      if (!subjectGroups.has(subject)) {
        subjectGroups.set(subject, [])
      }
      subjectGroups.get(subject).push(room)
    })
    
    return subjectRooms
  }

  const extractSubject = (title: string) => {
    // Extract subject from quiz title (e.g., "Math Quiz 1" -> "Math", "JavaScript Basics" -> "JavaScript")
    const subjects = ['Math', 'Science', 'History', 'English', 'JavaScript', 'Python', 'React', 'Node.js', 'Database', 'Physics', 'Chemistry', 'Biology']
    const foundSubject = subjects.find(subject => 
      title.toLowerCase().includes(subject.toLowerCase())
    )
    return foundSubject || title.split(' ')[0] || 'General'
  }

  const getRelatedChatRooms = (quizId: string) => {
    return chatRooms.filter(room => room.quiz?.id === quizId)
  }

  const shareQuizResult = async (quizId: string, score: number, passed: boolean) => {
    try {
      const response = await fetch('/api/chat/share-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId,
          score: passed ? 'PASSED' : 'FAILED', // Only share pass/fail, not exact score
          message: `Just ${passed ? 'passed' : 'attempted'} the quiz! ${passed ? '🎉' : 'Will try again! 💪'}`
        })
      })
      
      if (response.ok) {
        // Show success notification
        console.log('Result shared successfully')
      }
    } catch (error) {
      console.error('Error sharing result:', error)
    }
  }

  const getSubjectRooms = () => {
    return chatRooms.filter(room => 
      room.type === 'GENERAL' || room.type === 'QUIZ_DISCUSSION'
    ).slice(0, 6)
  }

  const getScoreColor = (score: number, passingScore: number) => {
    return score >= passingScore ? 'text-green-600' : 'text-red-600'
  }

  const getScoreBadgeVariant = (score: number, passingScore: number) => {
    return score >= passingScore ? 'default' as const : 'destructive' as const
  }

  return (
    <div className="min-h-screen bg-inftech-student">
      {/* Header */}
      <header className="header-inftech-student">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden mr-3 text-white hover:bg-white/20"
              >
                <Menu className="h-6 w-6" />
              </Button>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-3 lg:mr-4 shadow-lg">
                <BookOpen className="h-5 w-5 lg:h-7 lg:w-7 text-white" />
              </div>
              <div>
                <h1 className="text-lg lg:text-2xl font-bold text-white">
                  Student Portal
                </h1>
                <p className="text-blue-100 text-xs lg:text-sm hidden sm:block">Comprehensive Learning Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 lg:space-x-4">
              <NotificationBell
                userId={user.id}
                userName={user.name}
                userRole={user.role}
              />
              <div className="hidden sm:flex items-center space-x-3 bg-white/10 backdrop-blur-sm px-3 lg:px-4 py-2 rounded-xl border border-white/20">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs lg:text-sm font-semibold text-white">Welcome, {user.name}</span>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                disabled={isLoggingOut}
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300"
              >
                <LogOut className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)] relative">
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Left Sidebar Navigation */}
        <div className={`${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:relative z-50 lg:z-auto w-72 h-full nav-inftech p-4 lg:p-6 flex flex-col transition-transform duration-300 ease-in-out`}>
          {/* Mobile Close Button */}
          <div className="flex justify-between items-center mb-4 lg:hidden">
            <h3 className="text-lg font-bold text-blue-800">Menu</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-blue-700 hover:bg-blue-50"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <h3 className="text-lg lg:text-xl font-bold heading-inftech-primary mb-4 lg:mb-6 hidden lg:block">Navigation</h3>
          <nav className="space-y-3 flex-1">
            <Button
              onClick={() => {
                setActiveTab('dashboard')
                setIsMobileMenuOpen(false)
              }}
              variant="ghost"
              className={`nav-item-inftech w-full justify-start ${
                activeTab === 'dashboard' 
                  ? 'nav-item-inftech-active' 
                  : 'text-slate-700 hover:bg-blue-50 hover:text-blue-800'
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              Dashboard
            </Button>
            <Button
              onClick={() => {
                setActiveTab('quizzes')
                setIsMobileMenuOpen(false)
              }}
              variant="ghost"
              className={`nav-item-inftech w-full justify-start ${
                activeTab === 'quizzes' 
                  ? 'nav-item-inftech-active' 
                  : 'text-slate-700 hover:bg-blue-50 hover:text-blue-800'
              }`}
            >
              <BookOpen className="h-5 w-5" />
              Quizzes
            </Button>
            <Button
              onClick={() => setActiveTab('study-chat')}
              variant="ghost"
              className={`nav-item-inftech w-full justify-start ${
                activeTab === 'study-chat' 
                  ? 'nav-item-inftech-active' 
                  : 'text-slate-700 hover:bg-blue-50 hover:text-blue-800'
              }`}
            >
              <MessageSquare className="h-5 w-5" />
              Study Chat Rooms
            </Button>
            <Button
              onClick={() => setActiveTab('study-groups')}
              variant="ghost"
              className={`nav-item-inftech w-full justify-start ${
                activeTab === 'study-groups' 
                  ? 'nav-item-inftech-active' 
                  : 'text-slate-700 hover:bg-blue-50 hover:text-blue-800'
              }`}
            >
              <Users className="h-5 w-5" />
              Study Groups
            </Button>
            <Button
              onClick={() => setActiveTab('help')}
              variant="ghost"
              className={`nav-item-inftech w-full justify-start ${
                activeTab === 'help' 
                  ? 'nav-item-inftech-active' 
                  : 'text-slate-700 hover:bg-blue-50 hover:text-blue-800'
              }`}
            >
              <HelpCircle className="h-5 w-5" />
              Help & Support
            </Button>
            <Button
              onClick={() => setActiveTab('progress')}
              variant="ghost"
              className={`nav-item-inftech w-full justify-start ${
                activeTab === 'progress' 
                  ? 'nav-item-inftech-active' 
                  : 'text-slate-700 hover:bg-blue-50 hover:text-blue-800'
              }`}
            >
              <TrendingUp className="h-5 w-5" />
              Progress
            </Button>
            <Button
              onClick={() => setActiveTab('achievements')}
              variant="ghost"
              className={`nav-item-inftech w-full justify-start ${
                activeTab === 'achievements' 
                  ? 'nav-item-inftech-active' 
                  : 'text-slate-700 hover:bg-blue-50 hover:text-blue-800'
              }`}
            >
              <Trophy className="h-5 w-5" />
              Achievements
            </Button>
            <Button
              onClick={() => setActiveTab('reminders')}
              variant="ghost"
              className={`nav-item-inftech w-full justify-start ${
                activeTab === 'reminders' 
                  ? 'nav-item-inftech-active' 
                  : 'text-slate-700 hover:bg-blue-50 hover:text-blue-800'
              }`}
            >
              <Bell className="h-5 w-5" />
              Study Reminders
            </Button>
            <Button
              onClick={() => setActiveTab('messages')}
              variant="ghost"
              className={`nav-item-inftech w-full justify-start ${
                activeTab === 'messages' 
                  ? 'nav-item-inftech-active' 
                  : 'text-slate-700 hover:bg-blue-50 hover:text-blue-800'
              }`}
            >
              <Mail className="h-5 w-5" />
              Direct Messages
            </Button>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto lg:ml-0">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 lg:space-y-6">

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6 lg:space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <Card className="stat-card-inftech stat-card-primary">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-white/90">Available Quizzes</CardTitle>
                  <BookOpen className="h-6 w-6 text-white/80" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-white mb-1">{allQuizzes.length}</div>
                </CardContent>
              </Card>

              <Card className="stat-card-inftech stat-card-success">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-white/90">Completed</CardTitle>
                  <CheckCircle className="h-6 w-6 text-white/80" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-white mb-1">{attempts.length}</div>
                  <p className="text-sm text-white/80">Quiz attempts</p>
                </CardContent>
              </Card>

              <Card className="stat-card-inftech stat-card-warning">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-white/90">Average Score</CardTitle>
                  <TrendingUp className="h-6 w-6 text-white/80" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-white mb-1">
                    {attempts.length > 0 
                      ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length)
                      : 0
                    }%
                  </div>
                  <p className="text-sm text-white/80">Performance</p>
                </CardContent>
              </Card>

              <Card className="stat-card-inftech stat-card-info">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-white/90">Study Groups</CardTitle>
                  <Users className="h-6 w-6 text-white/80" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-white mb-1">{studyGroups.length}</div>
                  <p className="text-sm text-white/80">Active groups</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="w-full">
              {/* Study Milestones */}
              <Card className="card-inftech card-inftech-hover w-full">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl heading-inftech-primary">
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                      <Star className="h-5 w-5 text-white" />
                    </div>
                    Recent Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {studyMilestones.length === 0 ? (
                    <div className="text-center py-8">
                      <Trophy className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 text-lg">No achievements yet</p>
                    </div>
                  ) : (
                    studyMilestones.map((milestone) => (
                      <div key={milestone.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-yellow-50 rounded-xl border border-slate-200 hover:shadow-md transition-all duration-300">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ${
                          milestone.type === 'completion' ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
                          milestone.type === 'social' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 
                          'bg-gradient-to-r from-yellow-500 to-orange-500'
                        }`}>
                          {milestone.type === 'completion' ? <CheckCircle className="h-6 w-6 text-white" /> :
                           milestone.type === 'social' ? <Users className="h-6 w-6 text-white" /> :
                           <Star className="h-6 w-6 text-white" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900 text-lg">{milestone.title}</p>
                          <p className="text-slate-600">{milestone.date?.toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Quizzes Tab */}
          <TabsContent value="quizzes" className="space-y-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold heading-inftech-primary mb-3">Available Quizzes</h2>
              <p className="text-slate-600 text-lg">Choose a quiz to test your knowledge and join collaborative study discussions</p>
            </div>
            
            {allQuizzes.length === 0 ? (
              <Card className="card-inftech">
                <CardContent className="text-center py-20">
                  <BookOpen className="h-20 w-20 text-slate-300 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">No quizzes available</h3>
                  <p className="text-slate-600 text-lg">Check back later for new quizzes from your instructors</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-8">
                {allQuizzes.map((quiz) => (
                  <Card key={quiz.id} className="card-inftech card-inftech-hover">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-4 text-xl mb-3">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                              quiz.isExam 
                                ? 'bg-gradient-to-r from-red-500 to-red-600' 
                                : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                            }`}>
                              <BookOpen className="h-6 w-6 text-white" />
                            </div>
                            <span className="heading-inftech-primary">{quiz.title}</span>
                            {quiz.isExam && (
                              <Badge className="badge-inftech badge-inftech-error">
                                <Target className="h-3 w-3 mr-1" />
                                EXAM
                              </Badge>
                            )}
                            {quiz.enableChat && !quiz.isExam && (
                              <Badge className="badge-inftech badge-inftech-success">
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Chat Available
                              </Badge>
                            )}
                            {quiz.isExam && quiz.examEndTime && new Date() > new Date(quiz.examEndTime) && (
                              <Badge className="badge-inftech badge-inftech-info">
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Post-Exam Chat Available
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="text-base text-slate-600 mb-3">
                            {quiz.description || 'Test your knowledge with this comprehensive quiz'}
                          </CardDescription>
                          <p className="text-sm text-slate-500">
                            Created by {quiz.creator.name}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3 ml-6">
                          {/* Chat button - only show for regular quizzes or post-exam */}
                          {!quiz.isExam && quiz.enableChat && quiz.chatRooms && quiz.chatRooms.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleJoinChatRoom(quiz.chatRooms![0].id)}
                              className="btn-inftech-success"
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Study Chat
                            </Button>
                          )}
                          {/* Post-exam chat button */}
                          {quiz.isExam && quiz.examEndTime && new Date() > new Date(quiz.examEndTime) && quiz.chatRooms && quiz.chatRooms.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleJoinChatRoom(quiz.chatRooms![0].id)}
                              className="btn-inftech-info"
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Post-Exam Discussion
                            </Button>
                          )}
                          <Button
                            onClick={() => handleStartQuiz(quiz.id)}
                            disabled={!quiz.isActive || (quiz.isExam && attempts.some(attempt => attempt.quizId === quiz.id))}
                            className={quiz.isExam ? "btn-inftech-error" : "btn-inftech-primary"}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            {quiz.isExam 
                              ? (attempts.some(attempt => attempt.quizId === quiz.id) ? 'Exam Completed' : 'Start Exam')
                              : (attempts.some(attempt => attempt.quizId === quiz.id) ? 'Retake Quiz' : 'Start Quiz')
                            }
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Study Chat Tab */}
          <TabsContent value="study-chat" className="space-y-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold heading-inftech-primary mb-3">Study Chat Rooms</h2>
              <p className="text-slate-600 text-lg">Connect with peers, discuss quizzes, and collaborate in real-time study sessions</p>
            </div>


            {/* Active Quiz Discussions */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold heading-inftech-primary">Quiz Discussion Rooms</h3>
                  <p className="text-slate-600">Join discussions related to specific quizzes and get help from peers</p>
                </div>
              </div>
              
              {getQuizChatRooms().length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getQuizChatRooms().map((room) => (
                    <Card key={room.id} className="card-inftech card-inftech-hover cursor-pointer"
                          onClick={() => handleJoinChatRoom(room.id)}>
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-3 text-lg">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                            <MessageSquare className="h-4 w-4 text-white" />
                          </div>
                          {room.name}
                        </CardTitle>
                        <CardDescription className="text-base">
                          {room.quiz ? `Quiz: ${room.quiz.title}` : 'Quiz Discussion'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-3">
                          <Badge className="badge-inftech badge-inftech-primary">
                            Quiz Discussion
                          </Badge>
                          <Button size="sm" className="btn-inftech-primary">
                            Join Discussion
                          </Button>
                        </div>
                        {room._count?.messages && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <MessageSquare className="h-4 w-4" />
                            <span>{room._count.messages} messages</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="card-inftech">
                  <CardContent className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h4 className="text-xl font-bold text-slate-900 mb-2">No Quiz Discussion Rooms</h4>
                    <p className="text-slate-600 text-lg">
                      Quiz discussion rooms will appear when instructors enable chat for quizzes
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>



            {/* Global Empty State */}
            {getQuizChatRooms().length === 0 && (
              <Card className="card-inftech mt-8">
                <CardContent className="text-center py-20">
                  <MessageSquare className="h-20 w-20 text-slate-300 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">No Quiz Chat Rooms Available</h3>
                  <p className="text-slate-600 text-lg mb-6">
                    Quiz discussion rooms will appear here when instructors enable chat for their quizzes
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => setActiveTab('quizzes')} className="btn-inftech-primary">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Browse Available Quizzes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Study Groups Tab */}
          <TabsContent value="study-groups" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">My Study Groups</h2>
              <p className="text-gray-600 mt-1">Collaborate with peers in your assigned study groups and participate in discussions</p>
            </div>

            <div className="grid gap-6">
              {studyGroups.map((group) => (
                <Card key={group.id} className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-3 text-lg">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Users className="h-5 w-5 text-white" />
                          </div>
                          {group.name}
                          <Badge className="bg-purple-100 text-purple-800">
                            Member
                          </Badge>
                        </CardTitle>
                        <CardDescription className="mt-2 text-gray-700">
                          {group.description || 'Collaborative learning group for enhanced study experience'}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{group.members.length}</div>
                        <div className="text-sm text-purple-700">Members</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {group.chatRooms && group.chatRooms.length > 0 ? '✓' : '✗'}
                        </div>
                        <div className="text-sm text-blue-700">Chat Room</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">Active</div>
                        <div className="text-sm text-green-700">Status</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                          {group.members.slice(0, 4).map((member, index) => (
                            <div
                              key={index}
                              className="w-8 h-8 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                              title={member.user.name}
                            >
                              {member.user.name.charAt(0).toUpperCase()}
                            </div>
                          ))}
                          {group.members.length > 4 && (
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white">
                              +{group.members.length - 4}
                            </div>
                          )}
                        </div>
                        {group.chatRooms && group.chatRooms.length > 0 && (
                          <Badge className="bg-green-100 text-green-800">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Discussion Active
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {group.chatRooms && group.chatRooms.length > 0 && (
                          <Button
                            size="sm"
                            onClick={() => handleJoinChatRoom(group.chatRooms![0].id)}
                            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Join Discussion
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-purple-200 text-purple-700 hover:bg-purple-50"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          View Members
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {studyGroups.length === 0 && (
              <Card className="border-2 border-dashed border-gray-200">
                <CardContent className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="h-10 w-10 text-purple-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Study Groups Assigned</h3>
                  <p className="text-gray-600 mb-4">
                    You haven't been added to any study groups yet. Study groups will appear here when your instructor assigns you to one.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                    <p className="text-sm text-blue-800">
                      <strong>Tip:</strong> Study groups help you collaborate with classmates, share knowledge, and participate in group discussions about quiz topics.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Study Tools Section */}
            <div className="mt-8 space-y-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Study Tools</h3>
                <p className="text-gray-600">Organize your study sessions and get help when needed</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      Study Scheduling
                    </CardTitle>
                    <CardDescription>
                      Schedule and manage your study sessions with group members
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <StudySchedulingPanel 
              studyGroups={studyGroups} 
              userId={user.id}
              selectedQuizId={selectedQuizForSession || undefined}
            />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-purple-600" />
                      Need Help?
                    </CardTitle>
                    <CardDescription>
                      Get assistance from teachers and peers, or help others with their questions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center py-8">
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <div className="bg-purple-100 p-4 rounded-full">
                          <HelpCircle className="h-8 w-8 text-purple-600" />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Help & Support Center</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Ask questions, get help from teachers and peers, or help your classmates
                        </p>
                        <Button 
                          onClick={() => setActiveTab('help')}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <HelpCircle className="h-4 w-4 mr-2" />
                          Go to Help Center
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Progress</h2>
              <p className="text-gray-600 mt-1">Track your learning journey and achievements</p>
            </div>

            {/* Quiz History */}
            {attempts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Quiz History</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {attempts.length} attempts
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Complete history of all your quiz attempts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Search and Filter Controls */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search quiz attempts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={filterStatus === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterStatus('all')}
                        className="whitespace-nowrap"
                      >
                        All ({attempts.length})
                      </Button>
                      <Button
                        variant={filterStatus === 'passed' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterStatus('passed')}
                        className="whitespace-nowrap text-green-600 border-green-200 hover:bg-green-50"
                      >
                        Passed ({attempts.filter(a => a.passed).length})
                      </Button>
                      <Button
                        variant={filterStatus === 'failed' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterStatus('failed')}
                        className="whitespace-nowrap text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Failed ({attempts.filter(a => !a.passed).length})
                      </Button>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
                    {(() => {
                      const filteredAttempts = attempts.filter(attempt => {
                        const matchesSearch = attempt.quiz.title.toLowerCase().includes(searchTerm.toLowerCase())
                        const matchesFilter = filterStatus === 'all' || 
                          (filterStatus === 'passed' && attempt.passed) ||
                          (filterStatus === 'failed' && !attempt.passed)
                        return matchesSearch && matchesFilter
                      })

                      if (filteredAttempts.length === 0) {
                        return (
                          <div className="text-center py-8">
                            <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No attempts found</h3>
                            <p className="text-gray-600">
                              {searchTerm ? 'Try adjusting your search terms' : 'No attempts match the selected filter'}
                            </p>
                            {(searchTerm || filterStatus !== 'all') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSearchTerm('')
                                  setFilterStatus('all')
                                }}
                                className="mt-3"
                              >
                                Clear filters
                              </Button>
                            )}
                          </div>
                        )
                      }

                      return filteredAttempts.map((attempt) => (
                        <div key={attempt.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            {attempt.passed ? (
                              <CheckCircle className="h-8 w-8 text-green-600" />
                            ) : (
                              <XCircle className="h-8 w-8 text-red-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{attempt.quiz.title}</h4>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-gray-600">
                              <span>
                                Score: <span className={getScoreColor(attempt.score, attempt.quiz.passingScore)}>
                                  {attempt.score}%
                                </span>
                              </span>
                              <span className="hidden sm:inline">•</span>
                              <span>
                                {attempt.completedAt 
                                  ? new Date(attempt.completedAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : 'In Progress'
                                }
                              </span>
                              {attempt.timeSpent && (
                                <>
                                  <span className="hidden sm:inline">•</span>
                                  <span>
                                    Time: {Math.floor(attempt.timeSpent / 60)}m {attempt.timeSpent % 60}s
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => shareQuizResult(attempt.quizId, attempt.score, attempt.score >= attempt.quiz.passingScore)}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Users className="h-4 w-4 mr-1" />
                            Share
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleStartQuiz(attempt.quizId)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Retake
                          </Button>
                          <Badge variant={attempt.score >= attempt.quiz.passingScore ? 'default' : 'destructive'}>
                            {attempt.score >= attempt.quiz.passingScore ? 'Passed' : 'Failed'}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/student/quiz/${attempt.quizId}/results`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                      ))
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}

            {attempts.length === 0 && (
              <Card>
                <CardContent className="text-center py-16">
                  <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No quiz attempts yet</h3>
                  <p className="text-gray-600 mb-4">Start taking quizzes to track your progress</p>
                  <Button 
                    onClick={() => setActiveTab('quizzes')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Take Your First Quiz
                  </Button>
                </CardContent>
              </Card>
            )}

          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">Your Achievements</h2>
              <p className="text-gray-600 mt-1">Track your progress and unlock new badges through active participation</p>
            </div>

            <GamificationPanel userId={user.id} />
          </TabsContent>

          {/* Study Reminders Tab */}
          <TabsContent value="reminders" className="space-y-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold heading-inftech-primary mb-3">Study Reminders</h2>
              <p className="text-slate-600 text-lg">Manage your study schedule and never miss important deadlines with smart notifications</p>
            </div>

            <StudyRemindersPanel userId={user.id} />
          </TabsContent>

          {/* Direct Messages Tab */}
          <TabsContent value="messages" className="space-y-8">
            <DirectMessagesPanel userId={user.id} />
          </TabsContent>

          {/* Help & Support Tab */}
          <TabsContent value="help" className="space-y-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold heading-inftech-primary mb-3">Help & Support</h2>
              <p className="text-slate-600 text-lg">Get help from teachers and peers, or help others with their questions</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Ask for Help Section */}
              <Card className="border-blue-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <MessageSquare className="h-5 w-5" />
                    Ask for Help
                  </CardTitle>
                  <CardDescription className="text-blue-600">
                    Submit questions and get assistance from teachers and peers
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <HelpRequestPanel 
                    userId={user.id} 
                    selectedQuizId={selectedQuizForHelp || undefined}
                  />
                </CardContent>
              </Card>

              {/* Peer Help Section */}
              <Card className="border-green-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <Users className="h-5 w-5" />
                    Help Your Peers
                  </CardTitle>
                  <CardDescription className="text-green-600">
                    Answer questions from classmates and earn peer helper badges
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <PeerHelpPanel userId={user.id} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
