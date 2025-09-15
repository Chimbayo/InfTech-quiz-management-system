'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  MessageSquare, 
  AlertTriangle, 
  Users, 
  Shield, 
  TrendingUp,
  Search,
  Filter,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3
} from 'lucide-react'

interface ChatRoom {
  id: string
  name: string
  type: string
  isActive: boolean
  createdAt: string
  _count: {
    messages: number
  }
  quiz?: {
    title: string
  }
  studyGroup?: {
    name: string
  }
}

interface SuspiciousActivity {
  id: string
  type: string
  severity: string
  description: string
  timestamp: string
  user: {
    name: string
    email: string
  }
  room: {
    name: string
    type: string
  }
  message?: {
    message: string
    createdAt: string
  }
}

interface ChatStats {
  totalRooms: number
  activeRooms: number
  totalMessages: number
  suspiciousActivities: number
  highRiskActivities: number
}

export function ChatManagement() {
  const [stats, setStats] = useState<ChatStats | null>(null)
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [activities, setActivities] = useState<SuspiciousActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load chat rooms
      const roomsResponse = await fetch('/api/chat/rooms')
      if (roomsResponse.ok) {
        const roomsData = await roomsResponse.json()
        setRooms(roomsData.rooms || [])
      }

      // Load suspicious activities
      const activitiesResponse = await fetch('/api/chat/monitor')
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json()
        setActivities(activitiesData.activities || [])
      }

      // Calculate stats
      const totalRooms = rooms.length
      const activeRooms = rooms.filter(room => room.isActive).length
      const totalMessages = rooms.reduce((sum, room) => sum + room._count?.messages, 0)
      const suspiciousActivities = activities.length
      const highRiskActivities = activities.filter(activity => activity.severity === 'HIGH').length

      setStats({
        totalRooms,
        activeRooms,
        totalMessages,
        suspiciousActivities,
        highRiskActivities
      })
    } catch (error) {
      console.error('Error loading chat management data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'destructive'
      case 'MEDIUM': return 'secondary'
      case 'LOW': return 'outline'
      default: return 'outline'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'KEYWORD_MATCH': return <MessageSquare className="h-4 w-4" />
      case 'TIMING_VIOLATION': return <Clock className="h-4 w-4" />
      case 'EXCESSIVE_MESSAGING': return <TrendingUp className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSeverity = !severityFilter || activity.severity === severityFilter
    return matchesSearch && matchesSeverity
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading chat management data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Chat Participation</h2>
          <p className="text-gray-600">Join chat discussions and monitor academic integrity</p>
        </div>
        <Button onClick={loadData} variant="outline">
          <TrendingUp className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{stats.totalRooms}</p>
                  <p className="text-sm text-gray-600">Total Rooms</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{stats.activeRooms}</p>
                  <p className="text-sm text-gray-600">Active Rooms</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{stats.totalMessages}</p>
                  <p className="text-sm text-gray-600">Total Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{stats.suspiciousActivities}</p>
                  <p className="text-sm text-gray-600">Flagged Activities</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{stats.highRiskActivities}</p>
                  <p className="text-sm text-gray-600">High Risk</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="rooms" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rooms">Chat Rooms</TabsTrigger>
          <TabsTrigger value="integrity">Academic Integrity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="rooms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Chat Rooms</CardTitle>
              <CardDescription>
                Join discussions in quiz and study group chat rooms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rooms.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No chat rooms available</p>
                    <p className="text-sm">Chat rooms are automatically created when quizzes with chat are published</p>
                  </div>
                ) : (
                  rooms.map((room) => (
                    <div key={room.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="h-5 w-5 text-blue-600" />
                          <h3 className="font-medium">{room.name}</h3>
                          <Badge variant={room.isActive ? 'default' : 'secondary'}>
                            {room.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline" className={
                            room.type === 'QUIZ_DISCUSSION' ? 'border-blue-200 text-blue-700' :
                            room.type === 'STUDY_GROUP' ? 'border-purple-200 text-purple-700' :
                            'border-green-200 text-green-700'
                          }>
                            {room.type === 'QUIZ_DISCUSSION' ? 'Quiz Discussion' :
                             room.type === 'STUDY_GROUP' ? 'Study Group' : 'General'}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {room._count?.messages} messages • Created {new Date(room.createdAt).toLocaleDateString()}
                          {room.quiz && ` • Quiz: ${room.quiz.title}`}
                          {room.studyGroup && ` • Study Group: ${room.studyGroup.name}`}
                        </div>
                      </div>
                      <div className="flex space-x-2">
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
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Monitor
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Academic Integrity Monitoring</CardTitle>
              <CardDescription>
                Review flagged activities and potential academic integrity violations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex space-x-4 mb-6">
                <div className="flex-1">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search by user, room, or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="severity">Severity</Label>
                  <select
                    id="severity"
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">All</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              {/* Activities List */}
              <div className="space-y-4">
                {filteredActivities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No suspicious activities found matching your criteria.
                  </div>
                ) : (
                  filteredActivities.map((activity) => (
                    <div key={activity.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {getTypeIcon(activity.type)}
                            <span className="font-medium">{activity.description}</span>
                            <Badge variant={getSeverityColor(activity.severity) as any}>
                              {activity.severity}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>User: {activity.user.name} ({activity.user.email})</p>
                            <p>Room: {activity.room.name} ({activity.room.type})</p>
                            <p>Time: {new Date(activity.timestamp).toLocaleString()}</p>
                            {activity.message && (
                              <div className="mt-2 p-2 bg-gray-50 rounded border-l-4 border-yellow-400">
                                <p className="text-sm font-medium">Flagged Message:</p>
                                <p className="text-sm">{activity.message.message}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                          <Button variant="outline" size="sm">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Resolve
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chat Analytics</CardTitle>
              <CardDescription>
                Insights and trends from chat activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Analytics dashboard coming soon</p>
                <p className="text-sm">Track message volumes, user engagement, and integrity trends</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
