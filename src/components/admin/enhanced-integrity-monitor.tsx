'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  Search, 
  Filter,
  Clock,
  User,
  MessageSquare,
  Ban,
  CheckCircle
} from 'lucide-react'

interface SuspiciousActivity {
  id: string
  userId: string
  roomId: string
  activity: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  evidence: any
  createdAt: string
  resolved: boolean
  user: {
    name: string
    email: string
  }
  room: {
    name: string
    type: string
  }
}

interface IntegrityStats {
  totalFlags: number
  highSeverityFlags: number
  resolvedFlags: number
  activeQuizViolations: number
}

export function EnhancedIntegrityMonitor() {
  const [activities, setActivities] = useState<SuspiciousActivity[]>([])
  const [stats, setStats] = useState<IntegrityStats>({
    totalFlags: 0,
    highSeverityFlags: 0,
    resolvedFlags: 0,
    activeQuizViolations: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('ALL')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSuspiciousActivities()
    fetchIntegrityStats()
  }, [])

  const fetchSuspiciousActivities = async () => {
    try {
      const response = await fetch('/api/chat/monitor')
      if (response.ok) {
        const data = await response.json()
        setActivities(data)
      }
    } catch (error) {
      console.error('Error fetching suspicious activities:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchIntegrityStats = async () => {
    try {
      const response = await fetch('/api/chat/monitor/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching integrity stats:', error)
    }
  }

  const resolveActivity = async (activityId: string) => {
    try {
      const response = await fetch(`/api/chat/monitor/${activityId}/resolve`, {
        method: 'POST'
      })
      if (response.ok) {
        fetchSuspiciousActivities()
        fetchIntegrityStats()
      }
    } catch (error) {
      console.error('Error resolving activity:', error)
    }
  }

  const flagMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/chat/messages/${messageId}/flag`, {
        method: 'POST'
      })
      if (response.ok) {
        fetchSuspiciousActivities()
      }
    } catch (error) {
      console.error('Error flagging message:', error)
    }
  }

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.activity.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSeverity = severityFilter === 'ALL' || activity.severity === severityFilter
    
    return matchesSearch && matchesSeverity
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getActivityIcon = (activity: string) => {
    if (activity.includes('keyword')) return <MessageSquare className="h-4 w-4" />
    if (activity.includes('timing')) return <Clock className="h-4 w-4" />
    if (activity.includes('excessive')) return <AlertTriangle className="h-4 w-4" />
    return <Shield className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-professional">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Flags</p>
                <p className="text-2xl font-bold">{stats.totalFlags}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Severity</p>
                <p className="text-2xl font-bold text-red-600">{stats.highSeverityFlags}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolvedFlags}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-professional">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Quiz Violations</p>
                <p className="text-2xl font-bold text-orange-600">{stats.activeQuizViolations}</p>
              </div>
              <Ban className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="card-professional">
        <CardHeader>
          <CardTitle>Activity Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search activities, users, or rooms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="ALL">All Severities</option>
                <option value="HIGH">High Severity</option>
                <option value="MEDIUM">Medium Severity</option>
                <option value="LOW">Low Severity</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities List */}
      <Card className="card-professional">
        <CardHeader>
          <CardTitle>Suspicious Activities</CardTitle>
          <CardDescription>
            Monitor and review flagged activities for academic integrity violations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading activities...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm || severityFilter !== 'ALL' ? 'No matching activities' : 'All Clear!'}
              </h3>
              <p className="text-gray-600">
                {searchTerm || severityFilter !== 'ALL' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No suspicious activities detected recently.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity) => (
                <Alert 
                  key={activity.id} 
                  className={`${getSeverityColor(activity.severity)} ${
                    activity.resolved ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-start space-x-3">
                      {getActivityIcon(activity.activity)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge className={getSeverityColor(activity.severity)}>
                            {activity.severity}
                          </Badge>
                          {activity.resolved && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Resolved
                            </Badge>
                          )}
                        </div>
                        <p className="font-semibold text-gray-900">
                          {activity.user.name} in {activity.room.name}
                        </p>
                        <p className="text-sm text-gray-700 mb-2">{activity.activity}</p>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>Room Type: {activity.room.type}</p>
                          <p>Time: {new Date(activity.createdAt).toLocaleString()}</p>
                          <p>User Email: {activity.user.email}</p>
                        </div>
                        {activity.evidence && (
                          <details className="mt-2">
                            <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                              View Evidence
                            </summary>
                            <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                              {JSON.stringify(activity.evidence, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/chat?room=${activity.roomId}`, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Chat
                      </Button>
                      {!activity.resolved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveActivity(activity.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
