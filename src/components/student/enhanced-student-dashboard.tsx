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
  Clock, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Award, 
  Calendar, 
  Play, 
  Star,
  CheckCircle,
  Target,
  Trophy,
  Zap,
  LogOut,
  BarChart3,
  UserPlus,
  XCircle,
  History
} from 'lucide-react'
import { SessionUser } from '@/lib/auth'
import NotificationBell from '@/components/NotificationBell'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Quiz, QuizAttempt, ChatRoom, StudyGroup } from '@prisma/client'
import QuizStatusBroadcast from '@/components/realtime/QuizStatusBroadcast'
import InstructorPresence from '@/components/realtime/InstructorPresence'
import StudyProgressUpdates from '@/components/realtime/StudyProgressUpdates'

interface QuizWithCounts extends Omit<Quiz, 'enableChat'> {
  enableChat?: boolean
  creator: {
    name: string
  }
  chatRooms?: {
    id: string
    name: string
    type: string
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
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [studyGroups, setStudyGroups] = useState<StudyGroupWithMembers[]>([])
  const [studyMilestones, setStudyMilestones] = useState<StudyMilestone[]>([])
  const [activeTab, setActiveTab] = useState('dashboard')
  const [upcomingQuizzes, setUpcomingQuizzes] = useState<QuizWithCounts[]>([])
  const [allQuizzes, setAllQuizzes] = useState<QuizWithCounts[]>(quizzes)
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

  useEffect(() => {
    fetchChatRooms()
    fetchStudyGroups()
    fetchStudyMilestones()
    fetchQuizzes()
  }, [fetchQuizzes])

  // Listen for real-time quiz updates
  useEffect(() => {
    if (!socket || !isConnected) return

    const handleNewQuiz = (data: any) => {
      console.log('New quiz notification received:', data)
      // Refresh quiz list when new quiz is created
      fetchQuizzes()
    }

    const handleQuizUpdate = (data: any) => {
      console.log('Quiz update received:', data)
      // Refresh quiz list when quiz is updated
      fetchQuizzes()
    }

    socket.on('new-quiz-notification', handleNewQuiz)
    socket.on('quiz-broadcast', handleQuizUpdate)

    return () => {
      socket.off('new-quiz-notification', handleNewQuiz)
      socket.off('quiz-broadcast', handleQuizUpdate)
    }
  }, [socket, isConnected])

  useEffect(() => {
    setUpcomingQuizzes(allQuizzes.slice(0, 3)) // Show next 3 quizzes
  }, [allQuizzes])

  const fetchChatRooms = async () => {
    try {
      const response = await fetch('/api/chat/rooms')
      if (response.ok) {
        const data = await response.json()
        setChatRooms(data || [])
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error)
    }
  }

  const fetchStudyGroups = async () => {
    try {
      // Fetch study groups that the current user is a member of
      const response = await fetch('/api/study-groups')
      if (response.ok) {
        const data = await response.json()
        setStudyGroups(data || [])
      }
    } catch (error) {
      console.error('Error fetching study groups:', error)
    }
  }

  const fetchStudyMilestones = async () => {
    // Mock data for study milestones
    setStudyMilestones([
      { id: '1', title: 'Completed JavaScript Basics', date: new Date(), type: 'completion', completed: true },
      { id: '2', title: 'Joined React Study Group', date: new Date(), type: 'social', completed: true },
      { id: '3', title: '5-day study streak!', date: new Date(), type: 'achievement', completed: true }
    ])
  }

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
    return chatRooms.filter(room => room.type === 'QUIZ_DISCUSSION')
  }

  const getGeneralChatRooms = () => {
    return chatRooms.filter(room => room.type === 'GENERAL')
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg mr-3">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                Student Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBell
                userId={user.id}
                userName={user.name}
                userRole={user.role}
              />
              <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-700">Welcome, {user.name}</span>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                disabled={isLoggingOut}
                className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
              >
                <LogOut className="h-4 w-4" />
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar Navigation */}
        <div className="w-64 bg-white/70 backdrop-blur-sm border-r border-blue-100 p-4 flex flex-col">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent mb-4">Navigation</h3>
          <nav className="space-y-2 flex-1">
            <Button
              onClick={() => setActiveTab('dashboard')}
              variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
              className={`w-full justify-start ${
                activeTab === 'dashboard' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                  : 'text-blue-700 hover:bg-blue-50 hover:text-blue-800'
              }`}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button
              onClick={() => setActiveTab('quizzes')}
              variant={activeTab === 'quizzes' ? 'default' : 'ghost'}
              className={`w-full justify-start ${
                activeTab === 'quizzes' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                  : 'text-blue-700 hover:bg-blue-50 hover:text-blue-800'
              }`}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Quizzes
            </Button>
            <Button
              onClick={() => setActiveTab('study-chat')}
              variant={activeTab === 'study-chat' ? 'default' : 'ghost'}
              className={`w-full justify-start ${
                activeTab === 'study-chat' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                  : 'text-blue-700 hover:bg-blue-50 hover:text-blue-800'
              }`}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Study Chat
            </Button>
            <Button
              onClick={() => setActiveTab('study-groups')}
              variant={activeTab === 'study-groups' ? 'default' : 'ghost'}
              className={`w-full justify-start ${
                activeTab === 'study-groups' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                  : 'text-blue-700 hover:bg-blue-50 hover:text-blue-800'
              }`}
            >
              <Users className="h-4 w-4 mr-2" />
              Study Groups
            </Button>
            <Button
              onClick={() => setActiveTab('progress')}
              variant={activeTab === 'progress' ? 'default' : 'ghost'}
              className={`w-full justify-start ${
                activeTab === 'progress' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                  : 'text-blue-700 hover:bg-blue-50 hover:text-blue-800'
              }`}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Progress
            </Button>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-800">Available Quizzes</CardTitle>
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-900">{allQuizzes.length}</div>
                  <p className="text-xs text-blue-600 mt-1">Ready to take</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-800">Completed</CardTitle>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-900">{attempts.length}</div>
                  <p className="text-xs text-green-600 mt-1">Quiz attempts</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-800">Average Score</CardTitle>
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-900">
                    {attempts.length > 0 
                      ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length)
                      : 0
                    }%
                  </div>
                  <p className="text-xs text-purple-600 mt-1">Performance</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-800">Study Groups</CardTitle>
                  <Users className="h-5 w-5 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-900">{studyGroups.length}</div>
                  <p className="text-xs text-orange-600 mt-1">Active groups</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Quizzes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Upcoming Quizzes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {upcomingQuizzes.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No upcoming quizzes</p>
                  ) : (
                    upcomingQuizzes.map((quiz) => (
                      <div key={quiz.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{quiz.title}</h4>
                          <p className="text-sm text-gray-600">{quiz._count.questions} questions</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {quiz.enableChat && quiz.chatRooms && quiz.chatRooms.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleJoinChatRoom(quiz.chatRooms[0].id)}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => handleStartQuiz(quiz.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Start
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Study Milestones */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-600" />
                    Recent Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {studyMilestones.map((milestone) => (
                    <div key={milestone.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        milestone.type === 'completion' ? 'bg-green-100' :
                        milestone.type === 'social' ? 'bg-blue-100' : 'bg-yellow-100'
                      }`}>
                        {milestone.type === 'completion' ? <CheckCircle className="h-4 w-4 text-green-600" /> :
                         milestone.type === 'social' ? <Users className="h-4 w-4 text-blue-600" /> :
                         <Star className="h-4 w-4 text-yellow-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{milestone.title}</p>
                        <p className="text-sm text-gray-500">{milestone.date?.toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Quizzes Tab */}
          <TabsContent value="quizzes" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Available Quizzes</h2>
              <p className="text-gray-600 mt-1">Choose a quiz to test your knowledge and join study discussions</p>
            </div>
            
            {allQuizzes.length === 0 ? (
              <Card>
                <CardContent className="text-center py-16">
                  <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No quizzes available</h3>
                  <p className="text-gray-600">Check back later for new quizzes from your instructors</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {allQuizzes.map((quiz) => (
                  <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-3 text-lg">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                              <BookOpen className="h-4 w-4 text-white" />
                            </div>
                            {quiz.title}
                            {quiz.enableChat && (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Chat Available
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {quiz.description || 'Test your knowledge with this quiz'}
                          </CardDescription>
                          <p className="text-sm text-gray-500 mt-2">
                            Created by {quiz.creator.name}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {quiz.enableChat && quiz.chatRooms && quiz.chatRooms.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleJoinChatRoom(quiz.chatRooms[0].id)}
                              className="border-green-200 text-green-700 hover:bg-green-50"
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Study Chat
                            </Button>
                          )}
                          <Button
                            onClick={() => handleStartQuiz(quiz.id)}
                            disabled={!quiz.isActive}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Start Quiz
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{quiz._count.questions}</div>
                          <div className="text-sm text-blue-700">Questions</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{quiz.passingScore}%</div>
                          <div className="text-sm text-purple-700">Pass Score</div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            {quiz.timeLimit ? `${quiz.timeLimit}` : '∞'}
                          </div>
                          <div className="text-sm text-orange-700">
                            {quiz.timeLimit ? 'Minutes' : 'No Limit'}
                          </div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{quiz._count.attempts}</div>
                          <div className="text-sm text-green-700">Attempts</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Study Chat Tab */}
          <TabsContent value="study-chat" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Study Chat Rooms</h2>
              <p className="text-gray-600 mt-1">Join quiz discussions and general study rooms</p>
            </div>

            {/* Quiz Chat Rooms Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Quiz Discussion Rooms
              </h3>
              
              {getQuizChatRooms().length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getQuizChatRooms().map((room) => (
                    <Card key={room.id} className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500"
                          onClick={() => handleJoinChatRoom(room.id)}>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                          {room.name}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {room.quiz ? `Quiz: ${room.quiz.title}` : 'Quiz Discussion'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-blue-100 text-blue-800">
                            Quiz Discussion
                          </Badge>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            Join Chat
                          </Button>
                        </div>
                        {room._count && (
                          <p className="text-xs text-gray-500 mt-2">
                            {room._count.messages} messages
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed border-2 border-gray-200">
                  <CardContent className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Quiz Chat Rooms</h4>
                    <p className="text-gray-600 text-sm">
                      Quiz chat rooms will appear here when instructors create quizzes with chat enabled
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* General Chat Rooms Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                General Study Rooms
              </h3>
              
              {getGeneralChatRooms().length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getGeneralChatRooms().map((room) => (
                    <Card key={room.id} className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-green-500"
                          onClick={() => handleJoinChatRoom(room.id)}>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <MessageSquare className="h-4 w-4 text-green-600" />
                          {room.name}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          General study discussion
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            General Study
                          </Badge>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            Join Chat
                          </Button>
                        </div>
                        {room._count && (
                          <p className="text-xs text-gray-500 mt-2">
                            {room._count.messages} messages
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed border-2 border-gray-200">
                  <CardContent className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No General Chat Rooms</h4>
                    <p className="text-gray-600 text-sm">
                      General study rooms will appear here when created by instructors
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Empty state when no rooms at all */}
            {getQuizChatRooms().length === 0 && getGeneralChatRooms().length === 0 && (
              <Card className="mt-8">
                <CardContent className="text-center py-16">
                  <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No chat rooms available</h3>
                  <p className="text-gray-600">Chat rooms will appear here when quizzes with chat are created</p>
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
                  <CardTitle>Quiz History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {attempts.slice(0, 5).map((attempt) => (
                      <div key={attempt.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            {attempt.passed ? (
                              <CheckCircle className="h-8 w-8 text-green-600" />
                            ) : (
                              <XCircle className="h-8 w-8 text-red-600" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{attempt.quiz.title}</h3>
                            <p className="text-sm text-gray-600">
                              {new Date(attempt.completedAt || attempt.startedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className={`text-xl font-bold ${getScoreColor(attempt.score, attempt.quiz.passingScore)}`}>
                              {attempt.score}%
                            </div>
                            <Badge variant={getScoreBadgeVariant(attempt.score, attempt.quiz.passingScore)}>
                              {attempt.passed ? 'Passed' : 'Failed'}
                            </Badge>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/student/quiz/${attempt.quizId}/results`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
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
                    onClick={() => router.push('#quizzes')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Take Your First Quiz
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
