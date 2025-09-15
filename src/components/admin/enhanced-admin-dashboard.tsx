'use client'

import React, { useState, useEffect } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus, 
  BarChart3, 
  BookOpen, 
  Users, 
  TrendingUp,
  Edit,
  Trash2,
  Eye,
  LogOut,
  MessageSquare,
  Shield,
  Clock,
  AlertTriangle,
  Settings,
  Calendar,
  UserPlus,
  Bell,
  Megaphone
} from 'lucide-react'
import { SessionUser } from '@/lib/auth'
import { Quiz } from '@prisma/client'
import QuizStatusBroadcast from '@/components/realtime/QuizStatusBroadcast'
import InstructorPresence from '@/components/realtime/InstructorPresence'
import StudyProgressUpdates from '@/components/realtime/StudyProgressUpdates'

interface QuizWithCounts extends Omit<Quiz, 'enableChat' | 'chatSettings'> {
  enableChat?: boolean
  _count: {
    questions: number
    attempts: number
  }
  enableStudyGroup?: boolean
  chatSettings?: {
    discussionStartTime?: string
    discussionEndTime?: string
    allowChatDuringQuiz: boolean
  } | string | null
}

interface EnhancedAdminDashboardProps {
  user: SessionUser
  quizzes: QuizWithCounts[]
  stats: {
    totalQuizzes: number
    totalAttempts: number
    averageScore: number
    totalChatRooms: number
    flaggedMessages: number
    activeStudyGroups: number
  }
}

interface ChatRoom {
  id: string
  name: string
  type: string
  isActive: boolean
  _count: {
    messages: number
  }
  quiz?: {
    id: string
    title: string
  }
}

interface SuspiciousActivity {
  id: string
  userId: string
  roomId: string
  activity: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  evidence: any
  createdAt: string
  user: {
    name: string
    email: string
  }
  room: {
    name: string
  }
}

interface Student {
  id: string
  name: string
  email: string
  createdAt: string
  quizAttempts: {
    id: string
    score: number
    passed: boolean
    completedAt: string
  }[]
  _count: {
    attempts: number
  }
}

interface StudyGroup {
  id: string
  name: string
  description?: string
  quizId?: string
  createdBy: string
  createdAt: string
  creator: {
    name: string
  }
  quiz?: {
    id: string
    title: string
  }
  members: {
    user: {
      id: string
      name: string
    }
    role: string
  }[]
  chatRooms?: {
    id: string
  }[]
  _count: {
    members: number
  }
}

interface Announcement {
  id: string
  message: string
  type: string
  quizId?: string
  sentBy: string
  createdAt: string
}

export function EnhancedAdminDashboard({ user, quizzes, stats }: EnhancedAdminDashboardProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivity[]>([])
  const [selectedQuiz, setSelectedQuiz] = useState<string>('')
  const [newStudyGroup, setNewStudyGroup] = useState({ name: '', description: '', quizId: '', memberIds: [] as string[] })
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [newAnnouncement, setNewAnnouncement] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [announcementText, setAnnouncementText] = useState('')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [allQuizzes, setAllQuizzes] = useState(quizzes)
  
  // Missing state variables
  const [students, setStudents] = useState<Student[]>([])
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [loadingStudyGroups, setLoadingStudyGroups] = useState(false)

  const { socket, isConnected } = useWebSocket()

  useEffect(() => {
    if (!socket || !isConnected) return

    const handleNewQuiz = (data: any) => {
      console.log('Admin: New quiz notification received:', data)
      // Refresh quiz list when new quiz is created
      fetchAllQuizzes()
    }

    const handleQuizUpdate = (data: any) => {
      console.log('Admin: Quiz update received:', data)
      // Refresh quiz list when quiz is updated
      fetchAllQuizzes()
    }

    socket.on('new-quiz-notification', handleNewQuiz)
    socket.on('quiz-broadcast', handleQuizUpdate)

    return () => {
      socket.off('new-quiz-notification', handleNewQuiz)
      socket.off('quiz-broadcast', handleQuizUpdate)
    }
  }, [socket, isConnected])

  useEffect(() => {
    fetchChatRooms()
    fetchSuspiciousActivities()
    fetchStudents()
    fetchStudyGroups()
    fetchAllQuizzes()
  }, [])

  const fetchAllQuizzes = async () => {
    try {
      const response = await fetch('/api/quizzes')
      if (response.ok) {
        const data = await response.json()
        setAllQuizzes(data)
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error)
    }
  }

  const fetchStudents = async () => {
    setLoadingStudents(true)
    try {
      const response = await fetch('/api/users/students')
      if (response.ok) {
        const studentsData = await response.json()
        setStudents(studentsData)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoadingStudents(false)
    }
  }

  const fetchStudyGroups = async () => {
    setLoadingStudyGroups(true)
    try {
      const response = await fetch('/api/study-groups')
      if (response.ok) {
        const groupsData = await response.json()
        setStudyGroups(groupsData)
      }
    } catch (error) {
      console.error('Error fetching study groups:', error)
    } finally {
      setLoadingStudyGroups(false)
    }
  }

  const fetchChatRooms = async () => {
    try {
      const response = await fetch('/api/chat/rooms')
      if (response.ok) {
        const rooms = await response.json()
        setChatRooms(rooms)
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error)
    }
  }

  const fetchSuspiciousActivities = async () => {
    try {
      const response = await fetch('/api/chat/monitor')
      if (response.ok) {
        const data = await response.json()
        setSuspiciousActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Error fetching suspicious activities:', error)
      setSuspiciousActivities([])
    }
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

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Update local state by removing the deleted quiz
        setAllQuizzes(prevQuizzes => prevQuizzes.filter(quiz => quiz.id !== quizId))
        alert('Quiz deleted successfully!')
      } else {
        const errorData = await response.json()
        alert(`Failed to delete quiz: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete quiz')
    }
  }

  const createStudyGroup = async () => {
    if (!newStudyGroup.name.trim()) return

    try {
      const response = await fetch('/api/study-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudyGroup)
      })

      if (response.ok) {
        setNewStudyGroup({ name: '', description: '', quizId: '', memberIds: [] })
        fetchChatRooms() // Refresh to show new study group chat room
        fetchStudyGroups() // Refresh study groups list
        alert('Study group created successfully!')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating study group:', error)
      alert('Failed to create study group')
    }
  }

  const deleteStudyGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this study group? This will also delete all associated chat rooms and messages. This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/study-groups/${groupId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchStudyGroups() // Refresh the study groups list
        alert('Study group deleted successfully!')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting study group:', error)
      alert('Failed to delete study group')
    }
  }

  const editStudyGroup = async (groupId: string, updatedData: any) => {
    try {
      const response = await fetch(`/api/study-groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      })

      if (response.ok) {
        fetchStudyGroups() // Refresh the study groups list
        alert('Study group updated successfully!')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating study group:', error)
      alert('Failed to update study group')
    }
  }

  const toggleStudentSelection = (studentId: string) => {
    setNewStudyGroup(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(studentId)
        ? prev.memberIds.filter(id => id !== studentId)
        : [...prev.memberIds, studentId]
    }))
  }

  const sendAnnouncement = async () => {
    if (!announcementText.trim() || !selectedQuiz) return

    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: selectedQuiz,
          message: announcementText,
          type: selectedQuiz ? 'QUIZ_SPECIFIC' : 'GENERAL'
        })
      })

      if (response.ok) {
        setAnnouncementText('')
        alert('Announcement sent successfully!')
      }
    } catch (error) {
      console.error('Error sending announcement:', error)
    }
  }

  const toggleChatForQuiz = async (quizId: string, enableChat: boolean) => {
    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enableChat })
      })

      if (response.ok) {
        // Update local state
        setAllQuizzes(prevQuizzes => 
          prevQuizzes.map(quiz => 
            quiz.id === quizId ? { ...quiz, enableChat } : quiz
          )
        )
      }
    } catch (error) {
      console.error('Error updating quiz chat settings:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Professional Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg mr-3">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
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
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white/70 backdrop-blur-sm border-r border-blue-100 p-6">
          <div className="space-y-2">
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
              onClick={() => setActiveTab('students')}
              variant={activeTab === 'students' ? 'default' : 'ghost'}
              className={`w-full justify-start ${
                activeTab === 'students' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                  : 'text-blue-700 hover:bg-blue-50 hover:text-blue-800'
              }`}
            >
              <Users className="h-4 w-4 mr-2" />
              Students
            </Button>
            <Button
              onClick={() => setActiveTab('chat')}
              variant={activeTab === 'chat' ? 'default' : 'ghost'}
              className={`w-full justify-start ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'text-blue-700 hover:bg-blue-50 hover:text-blue-800'
              }`}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat Participation
            </Button>
            <Button
              onClick={() => setActiveTab('groups')}
              variant={activeTab === 'groups' ? 'default' : 'ghost'}
              className={`w-full justify-start ${
                activeTab === 'groups'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'text-blue-700 hover:bg-blue-50 hover:text-blue-800'
              }`}
            >
              <Users className="h-4 w-4 mr-2" />
              Study Groups
            </Button>
            <Button
              onClick={() => setActiveTab('announcements')}
              variant={activeTab === 'announcements' ? 'default' : 'ghost'}
              className={`w-full justify-start ${
                activeTab === 'announcements'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'text-blue-700 hover:bg-blue-50 hover:text-blue-800'
              }`}
            >
              <Megaphone className="h-4 w-4 mr-2" />
              Announcements
            </Button>
            <Button
              onClick={() => setActiveTab('monitoring')}
              variant={activeTab === 'monitoring' ? 'default' : 'ghost'}
              className={`w-full justify-start ${
                activeTab === 'monitoring' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                  : 'text-blue-700 hover:bg-blue-50 hover:text-blue-800'
              }`}
            >
              <Shield className="h-4 w-4 mr-2" />
              Monitoring
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6 p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">Dashboard Overview</h2>
                  <p className="text-blue-600 mt-2">Manage your quiz system and monitor student activity</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-blue-700">Total Quizzes</CardTitle>
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-800">{stats.totalQuizzes}</div>
                      <p className="text-xs text-blue-600 mt-1">
                        +2 from last month
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-emerald-700">Total Attempts</CardTitle>
                      <div className="bg-emerald-100 p-2 rounded-lg">
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-emerald-800">{stats.totalAttempts}</div>
                      <p className="text-xs text-emerald-600 mt-1">
                        +12% from last week
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-purple-700">Average Score</CardTitle>
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <BarChart3 className="h-4 w-4 text-purple-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-800">{stats.averageScore}%</div>
                      <p className="text-xs text-purple-600 mt-1">
                        +5% from last month
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-orange-700">Chat Rooms</CardTitle>
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <MessageSquare className="h-4 w-4 text-orange-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-800">{stats.totalChatRooms}</div>
                      <p className="text-xs text-orange-600 mt-1">
                        Active discussions
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Study Groups</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.activeStudyGroups}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest quiz attempts and system activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">Recent activity data would be displayed here...</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Quiz Management Tab */}
            <TabsContent value="quizzes" className="space-y-6 p-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Quiz Management</h2>
                    <p className="text-gray-600 mt-1">Create, edit, and manage quizzes with integrated chat settings</p>
                  </div>
                  <Button 
                    onClick={() => router.push('/admin/quizzes/create')}
                    className="btn-primary-professional"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Quiz
                  </Button>
                </div>

                <div className="grid gap-6">
                  {allQuizzes.map((quiz) => (
                    <Card key={quiz.id} className="card-professional card-professional-hover">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-3 text-lg">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                <BookOpen className="h-4 w-4 text-white" />
                              </div>
                              {quiz.title}
                              {!quiz.isActive && (
                                <Badge variant="secondary">Inactive</Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="mt-2">
                              {quiz.description || 'No description provided'}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleChatForQuiz(quiz.id, !quiz.enableChat)}
                              className="btn-secondary-professional"
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              {quiz.enableChat ? 'Disable Chat' : 'Enable Chat'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin/quizzes/${quiz.id}/results`)}
                              className="btn-secondary-professional"
                            >
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Results
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin/quizzes/${quiz.id}/edit`)}
                              className="btn-secondary-professional"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteQuiz(quiz.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>{quiz._count.questions} questions</span>
                          <span>{quiz._count.attempts} attempts</span>
                          <span>Passing: {quiz.passingScore}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Students Management Tab */}
            <TabsContent value="students" className="space-y-6 p-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">Student Management</h2>
                    <p className="text-blue-600 mt-2">Monitor student performance and manage accounts</p>
                  </div>
                </div>

                {/* Student Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-blue-700">Total Students</CardTitle>
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-800">{students.length}</div>
                      <p className="text-xs text-blue-600 mt-1">Active accounts</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-emerald-700">Active This Week</CardTitle>
                      <div className="bg-emerald-100 p-2 rounded-lg">
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-emerald-800">{Math.floor(students.length * 0.8)}</div>
                      <p className="text-xs text-emerald-600 mt-1">80% engagement</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-purple-700">Avg Performance</CardTitle>
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <BarChart3 className="h-4 w-4 text-purple-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-800">{stats.averageScore}%</div>
                      <p className="text-xs text-purple-600 mt-1">Class average</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Students List */}
                <Card className="shadow-lg border-blue-100">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                    <CardTitle className="text-blue-800">Student Directory</CardTitle>
                    <CardDescription className="text-blue-600">
                      View and manage all student accounts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz Attempts</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Score</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {students.map((student) => {
                            const studentAttempts = student.quizAttempts || []
                            const avgScore = studentAttempts.length > 0 
                              ? Math.round(studentAttempts.reduce((sum: number, attempt: any) => sum + attempt.score, 0) / studentAttempts.length)
                              : 0
                            
                            return (
                              <tr key={student.id} className="hover:bg-blue-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10">
                                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center">
                                        <span className="text-sm font-medium text-white">
                                          {student.name.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                      <div className="text-sm text-gray-500">ID: {student.id.slice(0, 8)}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{student.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{studentAttempts.length}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="text-sm text-gray-900">{avgScore}%</div>
                                    <div className={`ml-2 w-16 bg-gray-200 rounded-full h-2`}>
                                      <div 
                                        className={`h-2 rounded-full ${
                                          avgScore >= 80 ? 'bg-green-500' : 
                                          avgScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                        style={{ width: `${Math.min(avgScore, 100)}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(student.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Badge 
                                    variant={avgScore >= 60 ? "default" : "destructive"}
                                    className={avgScore >= 60 ? "bg-green-100 text-green-800" : ""}
                                  >
                                    {avgScore >= 60 ? 'Good Standing' : 'Needs Support'}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                    >
                                      View Details
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-gray-600 border-gray-200 hover:bg-gray-50"
                                    >
                                      Message
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="shadow-lg border-blue-100">
                    <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                      <CardTitle className="text-emerald-800">Top Performers</CardTitle>
                      <CardDescription className="text-emerald-600">Students with highest average scores</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {students
                          .filter(student => student.quizAttempts && student.quizAttempts.length > 0)
                          .sort((a, b) => {
                            const totalScoreA = a.quizAttempts.reduce((sum: number, attempt: any) => sum + attempt.score, 0) / a.quizAttempts.length
                            const totalScoreB = b.quizAttempts.reduce((sum: number, attempt: any) => sum + attempt.score, 0) / b.quizAttempts.length
                            return totalScoreB - totalScoreA
                          })
                          .slice(0, 5)
                          .map((student, index) => {
                            const avgScore = Math.round(student.quizAttempts.reduce((sum: number, attempt: any) => sum + attempt.score, 0) / student.quizAttempts.length)
                            return (
                              <div key={student.id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <div className="flex-shrink-0">
                                    <Badge variant="outline" className="bg-emerald-100 text-emerald-800">
                                      #{index + 1}
                                    </Badge>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                    <div className="text-xs text-gray-500">{student.quizAttempts.length} attempts</div>
                                  </div>
                                </div>
                                <div className="text-lg font-bold text-emerald-600">{avgScore}%</div>
                              </div>
                            )
                          })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg border-blue-100">
                    <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100">
                      <CardTitle className="text-orange-800">Students Needing Support</CardTitle>
                      <CardDescription className="text-orange-600">Students who may need additional help</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {students
                          .filter(student => {
                            if (!student.quizAttempts || student.quizAttempts.length === 0) return true
                            const avgScore = student.quizAttempts.reduce((sum: number, attempt: any) => sum + attempt.score, 0) / student.quizAttempts.length
                            return avgScore < 60
                          })
                          .slice(0, 5)
                          .map((student) => {
                            const avgScore = student.quizAttempts && student.quizAttempts.length > 0
                              ? Math.round(student.quizAttempts.reduce((sum: number, attempt: any) => sum + attempt.score, 0) / student.quizAttempts.length)
                              : 0
                            return (
                              <div key={student.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <div className="flex-shrink-0">
                                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                    <div className="text-xs text-gray-500">
                                      {student.quizAttempts ? student.quizAttempts.length : 0} attempts
                                    </div>
                                  </div>
                                </div>
                                <div className="text-lg font-bold text-orange-600">{avgScore}%</div>
                              </div>
                            )
                          })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Chat Participation Tab */}
            <TabsContent value="chat" className="space-y-6 p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Chat Participation</h2>
                  <p className="text-gray-600 mt-1">Join quiz discussions and monitor chat activity</p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Chat rooms are automatically created when quizzes with chat are published. No manual creation needed.
                    </p>
                  </div>
                </div>

                {chatRooms.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-16">
                      <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No chat rooms available</h3>
                      <p className="text-gray-600">Chat rooms will appear here when quizzes with chat are created</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6">
                    {chatRooms.map((room) => (
                      <Card key={room.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-blue-600" />
                                <CardTitle>{room.name}</CardTitle>
                                <Badge variant="outline" className={
                                  room.type === 'QUIZ_DISCUSSION' ? 'border-blue-200 text-blue-700' :
                                  room.type === 'STUDY_GROUP' ? 'border-purple-200 text-purple-700' :
                                  'border-green-200 text-green-700'
                                }>
                                  {room.type === 'QUIZ_DISCUSSION' ? 'Quiz Discussion' :
                                   room.type === 'STUDY_GROUP' ? 'Study Group' : 'General'}
                                </Badge>
                              </div>
                              <CardDescription className="mt-2">
                                {room._count.messages} messages
                                {room.quiz && ` • Quiz: ${room.quiz.title}`}
                              </CardDescription>
                            </div>
                            <div className="flex gap-2">
                              {room.isActive && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => window.open(`/chat/${room.id}`, '_blank')}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Join Chat
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/admin/chat/moderation?room=${room.id}`)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Monitor
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Study Groups Tab */}
            <TabsContent value="groups" className="space-y-6 p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Study Groups</h2>
                  <p className="text-gray-600 mt-1">Create and manage collaborative learning groups with quiz association</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Create New Study Group</CardTitle>
                    <CardDescription>Create a study group for a specific quiz and select students to participate</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="groupName">Group Name *</Label>
                        <Input
                          id="groupName"
                          value={newStudyGroup.name}
                          onChange={(e) => setNewStudyGroup({ ...newStudyGroup, name: e.target.value })}
                          placeholder="Enter group name"
                          className="input-professional"
                        />
                      </div>
                      <div>
                        <Label htmlFor="quizSelect">Associated Quiz</Label>
                        <select
                          id="quizSelect"
                          value={newStudyGroup.quizId}
                          onChange={(e) => setNewStudyGroup({ ...newStudyGroup, quizId: e.target.value })}
                          className="w-full p-2 border rounded-md input-professional"
                        >
                          <option value="">Select a quiz (optional)...</option>
                          {quizzes.map((quiz) => (
                            <option key={quiz.id} value={quiz.id}>
                              {quiz.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="groupDescription">Description</Label>
                      <Input
                        id="groupDescription"
                        value={newStudyGroup.description}
                        onChange={(e) => setNewStudyGroup({ ...newStudyGroup, description: e.target.value })}
                        placeholder="Enter group description (optional)"
                        className="input-professional"
                      />
                    </div>

                    <div>
                      <Label>Select Students</Label>
                      <p className="text-sm text-gray-600 mb-3">Choose students to add to this study group</p>
                      
                      {loadingStudents ? (
                        <div className="flex items-center justify-center p-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="ml-2">Loading students...</span>
                        </div>
                      ) : (
                        <div className="max-h-64 overflow-y-auto border rounded-lg p-3 space-y-2">
                          {students.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No students found</p>
                          ) : (
                            students.map((student) => (
                              <div key={student.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                                <input
                                  type="checkbox"
                                  id={`student-${student.id}`}
                                  checked={newStudyGroup.memberIds.includes(student.id)}
                                  onChange={() => toggleStudentSelection(student.id)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor={`student-${student.id}`} className="flex-1 cursor-pointer">
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <p className="font-medium text-gray-900">{student.name}</p>
                                      <p className="text-sm text-gray-500">{student.email}</p>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      {student._count.attempts} quiz attempts
                                    </div>
                                  </div>
                                </label>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                      
                      {newStudyGroup.memberIds.length > 0 && (
                        <p className="text-sm text-blue-600 mt-2">
                          {newStudyGroup.memberIds.length} student{newStudyGroup.memberIds.length !== 1 ? 's' : ''} selected
                        </p>
                      )}
                    </div>

                    <Button 
                      onClick={createStudyGroup} 
                      disabled={!newStudyGroup.name.trim()}
                      className="btn-primary-professional"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create Study Group
                    </Button>
                  </CardContent>
                </Card>

                {/* Existing Study Groups */}
                <Card>
                  <CardHeader>
                    <CardTitle>Existing Study Groups</CardTitle>
                    <CardDescription>Manage and view all study groups</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingStudyGroups ? (
                      <div className="flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3">Loading study groups...</span>
                      </div>
                    ) : studyGroups.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No study groups created yet</p>
                        <p className="text-sm text-gray-400">Create your first study group above</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {studyGroups.map((group) => (
                          <Card key={group.id} className="border-l-4 border-l-green-500">
                            <CardHeader>
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <CardTitle className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                                      <Users className="h-4 w-4 text-white" />
                                    </div>
                                    {group.name}
                                  </CardTitle>
                                  <CardDescription className="mt-2">
                                    {group.description || 'No description provided'}
                                  </CardDescription>
                                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                    <span>Created by: {group.creator.name}</span>
                                    <span>•</span>
                                    <span>{group._count.members} member{group._count.members !== 1 ? 's' : ''}</span>
                                    {group.quiz && (
                                      <>
                                        <span>•</span>
                                        <span>Quiz: {group.quiz.title}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push(`/chat?room=${group.chatRooms?.[0]?.id}`)}
                                    className="btn-secondary-professional"
                                  >
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    View Chat
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      // Simple edit - prompt for new name
                                      const newName = prompt('Enter new group name:', group.name)
                                      if (newName && newName !== group.name) {
                                        editStudyGroup(group.id, { name: newName })
                                      }
                                    }}
                                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => deleteStudyGroup(group.id)}
                                    className="border-red-200 text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div>
                                <Label className="text-sm font-medium text-gray-700">Members:</Label>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {group.members.length === 0 ? (
                                    <span className="text-sm text-gray-500">No members yet</span>
                                  ) : (
                                    group.members.map((member: any) => (
                                      <div
                                        key={member.user.id}
                                        className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm"
                                      >
                                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                                          {member.user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span>{member.user.name}</span>
                                        {member.role === 'moderator' && (
                                          <Badge variant="secondary" className="text-xs">
                                            Moderator
                                          </Badge>
                                        )}
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Academic Integrity Tab */}
            <TabsContent value="integrity" className="space-y-6 p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Academic Integrity</h2>
                  <p className="text-gray-600 mt-1">Monitor suspicious activities and maintain academic standards</p>
                </div>

                <div className="grid gap-6">
                  {suspiciousActivities.map((activity) => (
                    <Card key={activity.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" />
                              Suspicious Activity
                              <Badge variant={activity.severity === 'HIGH' ? 'destructive' : activity.severity === 'MEDIUM' ? 'default' : 'secondary'}>
                                {activity.severity}
                              </Badge>
                            </CardTitle>
                            <CardDescription>
                              User: {activity.user.name} • Room: {activity.room.name}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{activity.activity}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Announcements Tab */}
            <TabsContent value="announcements" className="space-y-6 p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Announcements</h2>
                  <p className="text-gray-600 mt-1">Send announcements to quiz discussion rooms</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Send Announcement</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="quizSelect">Select Quiz</Label>
                      <select
                        id="quizSelect"
                        value={selectedQuiz}
                        onChange={(e) => setSelectedQuiz(e.target.value)}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="">Select a quiz...</option>
                        {quizzes.map((quiz) => (
                          <option key={quiz.id} value={quiz.id}>
                            {quiz.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="announcement">Announcement Message</Label>
                      <Input
                        id="announcement"
                        value={announcementText}
                        onChange={(e) => setAnnouncementText(e.target.value)}
                        placeholder="Enter your announcement..."
                      />
                    </div>
                    <Button 
                      onClick={sendAnnouncement} 
                      disabled={!selectedQuiz || !announcementText.trim()}
                      className="btn-primary-professional"
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Send Announcement
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
