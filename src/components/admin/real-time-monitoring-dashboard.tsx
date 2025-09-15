'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  Users, 
  MessageSquare, 
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Bell,
  Activity,
  Zap,
  Target,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { useWebSocket } from '@/hooks/useWebSocket'

interface SuspiciousActivity {
  id: string
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  user: {
    id: string
    name: string
    email: string
  }
  room: {
    id: string
    name: string
    type: string
  }
  quiz?: {
    id: string
    title: string
  }
  timestamp: string
  status: 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED'
  metadata?: any
}

interface LiveStats {
  activeUsers: number
  activeRooms: number
  totalMessages: number
  suspiciousActivities: number
  criticalAlerts: number
  resolvedToday: number
}

interface RoomActivity {
  roomId: string
  roomName: string
  userCount: number
  messageCount: number
  lastActivity: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  activeQuiz?: {
    id: string
    title: string
    status: string
  }
}

export function RealTimeMonitoringDashboard() {
  const [activities, setActivities] = useState<SuspiciousActivity[]>([])
  const [liveStats, setLiveStats] = useState<LiveStats>({
    activeUsers: 0,
    activeRooms: 0,
    totalMessages: 0,
    suspiciousActivities: 0,
    criticalAlerts: 0,
    resolvedToday: 0
  })
  const [roomActivities, setRoomActivities] = useState<RoomActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL')
  const [autoRefresh, setAutoRefresh] = useState(true)
  
  const { socket, isConnected } = useWebSocket()

  useEffect(() => {
    fetchMonitoringData()
    
    // Set up auto-refresh
    const interval = autoRefresh ? setInterval(fetchMonitoringData, 30000) : null
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  useEffect(() => {
    if (!socket || !isConnected) return

    // Listen for real-time monitoring events
    socket.on('suspicious-activity', handleNewSuspiciousActivity)
    socket.on('activity-resolved', handleActivityResolved)
    socket.on('room-activity-update', handleRoomActivityUpdate)
    socket.on('monitoring-stats-update', handleStatsUpdate)

    return () => {
      socket.off('suspicious-activity', handleNewSuspiciousActivity)
      socket.off('activity-resolved', handleActivityResolved)
      socket.off('room-activity-update', handleRoomActivityUpdate)
      socket.off('monitoring-stats-update', handleStatsUpdate)
    }
  }, [socket, isConnected])

  const fetchMonitoringData = async () => {
    setIsLoading(true)
    try {
      // Fetch suspicious activities
      const activitiesResponse = await fetch('/api/chat/monitor')
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json()
        setActivities(activitiesData.activities || [])
      }

      // Fetch live stats
      const statsResponse = await fetch('/api/chat/monitor/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setLiveStats(statsData)
      }

      // Fetch room activities
      const roomsResponse = await fetch('/api/chat/rooms?monitoring=true')
      if (roomsResponse.ok) {
        const roomsData = await roomsResponse.json()
        setRoomActivities(roomsData.rooms || [])
      }
    } catch (error) {
      console.error('Error fetching monitoring data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewSuspiciousActivity = (activity: SuspiciousActivity) => {
    setActivities(prev => [activity, ...prev])
    setLiveStats(prev => ({
      ...prev,
      suspiciousActivities: prev.suspiciousActivities + 1,
      criticalAlerts: activity.severity === 'CRITICAL' ? prev.criticalAlerts + 1 : prev.criticalAlerts
    }))
    
    // Show browser notification for critical activities
    if (activity.severity === 'CRITICAL' && 'Notification' in window) {
      new Notification('Critical Security Alert', {
        body: `${activity.description} - ${activity.user.name}`,
        icon: '/favicon.ico'
      })
    }
  }

  const handleActivityResolved = (activityId: string) => {
    setActivities(prev => 
      prev.map(activity => 
        activity.id === activityId 
          ? { ...activity, status: 'RESOLVED' }
          : activity
      )
    )
    setLiveStats(prev => ({
      ...prev,
      resolvedToday: prev.resolvedToday + 1
    }))
  }

  const handleRoomActivityUpdate = (roomData: RoomActivity) => {
    setRoomActivities(prev => 
      prev.map(room => 
        room.roomId === roomData.roomId ? roomData : room
      )
    )
  }

  const handleStatsUpdate = (stats: LiveStats) => {
    setLiveStats(stats)
  }

  const resolveActivity = async (activityId: string) => {
    try {
      const response = await fetch(`/api/chat/monitor/${activityId}/resolve`, {
        method: 'POST'
      })
      
      if (response.ok) {
        handleActivityResolved(activityId)
      }
    } catch (error) {
      console.error('Error resolving activity:', error)
    }
  }

  const dismissActivity = async (activityId: string) => {
    try {
      const response = await fetch(`/api/chat/monitor/${activityId}/dismiss`, {
        method: 'POST'
      })
      
      if (response.ok) {
        setActivities(prev => 
          prev.map(activity => 
            activity.id === activityId 
              ? { ...activity, status: 'DISMISSED' }
              : activity
          )
        )
      }
    } catch (error) {
      console.error('Error dismissing activity:', error)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200'
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'HIGH': return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case 'MEDIUM': return <Eye className="h-4 w-4 text-yellow-600" />
      case 'LOW': return <Activity className="h-4 w-4 text-blue-600" />
      default: return <Shield className="h-4 w-4 text-gray-600" />
    }
  }

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH': return 'text-red-600'
      case 'MEDIUM': return 'text-yellow-600'
      case 'LOW': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RESOLVED': return 'bg-green-100 text-green-800'
      case 'REVIEWING': return 'bg-blue-100 text-blue-800'
      case 'DISMISSED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  const filteredActivities = activities.filter(activity => 
    selectedSeverity === 'ALL' || activity.severity === selectedSeverity
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading monitoring dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Real-Time Monitoring
          </h1>
          <p className="text-gray-600">Live surveillance and incident response dashboard</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          
          <Button onClick={fetchMonitoringData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-blue-600">{liveStats.activeUsers}</p>
              </div>
              <Users className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Rooms</p>
                <p className="text-2xl font-bold text-green-600">{liveStats.activeRooms}</p>
              </div>
              <MessageSquare className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Messages Today</p>
                <p className="text-2xl font-bold text-purple-600">{liveStats.totalMessages}</p>
              </div>
              <Activity className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Suspicious</p>
                <p className="text-2xl font-bold text-orange-600">{liveStats.suspiciousActivities}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Alerts</p>
                <p className="text-2xl font-bold text-red-600">{liveStats.criticalAlerts}</p>
              </div>
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved Today</p>
                <p className="text-2xl font-bold text-green-600">{liveStats.resolvedToday}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts Banner */}
      {liveStats.criticalAlerts > 0 && (
        <Alert className="border-red-500 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{liveStats.criticalAlerts} Critical Alert{liveStats.criticalAlerts > 1 ? 's' : ''}</strong> - 
            Immediate attention required!
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="incidents" className="space-y-6">
        <TabsList>
          <TabsTrigger value="incidents">Security Incidents</TabsTrigger>
          <TabsTrigger value="rooms">Room Activity</TabsTrigger>
          <TabsTrigger value="analytics">Quick Analytics</TabsTrigger>
        </TabsList>

        {/* Security Incidents Tab */}
        <TabsContent value="incidents" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Live Security Incidents</h3>
            <div className="flex gap-2">
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(severity => (
                <Button
                  key={severity}
                  onClick={() => setSelectedSeverity(severity)}
                  variant={selectedSeverity === severity ? 'default' : 'outline'}
                  size="sm"
                >
                  {severity}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredActivities.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">All Clear!</h4>
                  <p className="text-gray-600">No suspicious activities detected</p>
                </CardContent>
              </Card>
            ) : (
              filteredActivities.map((activity) => (
                <Card key={activity.id} className="border-l-4 border-l-orange-500">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        {getSeverityIcon(activity.severity)}
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {activity.type.replace('_', ' ').toUpperCase()}
                            <Badge className={getSeverityColor(activity.severity)}>
                              {activity.severity}
                            </Badge>
                            <Badge className={getStatusColor(activity.status)}>
                              {activity.status}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="mt-1">
                            <strong>{activity.user.name}</strong> in <strong>{activity.room.name}</strong>
                            {activity.quiz && <span> • Quiz: {activity.quiz.title}</span>}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-700 mb-4">{activity.description}</p>
                    
                    {activity.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => resolveActivity(activity.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                        <Button
                          onClick={() => dismissActivity(activity.id)}
                          size="sm"
                          variant="outline"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Dismiss
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          Investigate
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Room Activity Tab */}
        <TabsContent value="rooms" className="space-y-6">
          <h3 className="text-lg font-semibold">Live Room Activity</h3>
          
          <div className="grid gap-4">
            {roomActivities.map((room) => (
              <Card key={room.roomId}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{room.roomName}</h4>
                        <Badge className={`${getRiskLevelColor(room.riskLevel)} border`}>
                          {room.riskLevel} Risk
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Active Users</p>
                          <p className="font-semibold">{room.userCount}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Messages</p>
                          <p className="font-semibold">{room.messageCount}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Last Activity</p>
                          <p className="font-semibold">{new Date(room.lastActivity).toLocaleTimeString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Status</p>
                          <p className="font-semibold">
                            {room.activeQuiz ? `Quiz: ${room.activeQuiz.title}` : 'General Chat'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      Monitor
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Quick Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <h3 className="text-lg font-semibold">Quick Analytics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Activity Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Messages/Hour</span>
                    <span className="font-semibold">142</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Peak Activity</span>
                    <span className="font-semibold">2:30 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg Response Time</span>
                    <span className="font-semibold">1.2 min</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Detection Accuracy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">True Positives</span>
                    <span className="font-semibold text-green-600">87%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">False Positives</span>
                    <span className="font-semibold text-red-600">13%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Response Rate</span>
                    <span className="font-semibold">95%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Uptime</span>
                    <span className="font-semibold text-green-600">99.8%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg Load</span>
                    <span className="font-semibold">23%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Memory Usage</span>
                    <span className="font-semibold">67%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
