'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft,
  AlertTriangle,
  MessageSquare,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  User,
  Hash
} from 'lucide-react'
import { SessionUser } from '@/lib/auth'

interface FlaggedMessage {
  id: string
  content: string
  createdAt: Date
  isFlagged: boolean
  flaggedReason?: string | null
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  chatRoom: {
    id: string
    name: string
    type: string
    quiz?: {
      id: string
      title: string
    } | null
  }
}

interface MessageModerationDashboardProps {
  user: SessionUser
  flaggedMessages: FlaggedMessage[]
  recentMessages: Array<{
    id: string
    content: string
    createdAt: Date
    user: {
      id: string
      name: string
      role: string
    }
    chatRoom: {
      id: string
      name: string
      type: string
    }
  }>
  stats: {
    totalFlagged: number
    totalMessages: number
    totalDeleted: number
    flaggedToday: number
  }
}

export function MessageModerationDashboard({ 
  user, 
  flaggedMessages, 
  recentMessages, 
  stats 
}: MessageModerationDashboardProps) {
  const router = useRouter()
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      return
    }

    setActionLoading(messageId)
    try {
      const response = await fetch(`/api/chat/messages/${messageId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Failed to delete message')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete message')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnflagMessage = async (messageId: string) => {
    setActionLoading(messageId)
    try {
      const response = await fetch(`/api/chat/messages/${messageId}/unflag`, {
        method: 'POST',
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Failed to unflag message')
      }
    } catch (error) {
      console.error('Unflag error:', error)
      alert('Failed to unflag message')
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800'
      case 'TEACHER':
        return 'bg-blue-100 text-blue-800'
      case 'STUDENT':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoomTypeColor = (type: string) => {
    switch (type) {
      case 'QUIZ':
        return 'bg-blue-100 text-blue-800'
      case 'STUDY':
        return 'bg-green-100 text-green-800'
      case 'GENERAL':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="header-professional sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/chat')}
                className="btn-secondary-professional"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Chat Management
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-700 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Message Moderation</h1>
                  <p className="text-xs text-gray-500">Review and manage flagged content</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="card-professional card-professional-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Flagged Messages</CardTitle>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalFlagged}</div>
              <p className="text-xs text-gray-500 mt-1">Need review</p>
            </CardContent>
          </Card>

          <Card className="card-professional card-professional-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Messages</CardTitle>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalMessages}</div>
              <p className="text-xs text-gray-500 mt-1">All messages</p>
            </CardContent>
          </Card>

          <Card className="card-professional card-professional-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Deleted Messages</CardTitle>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalDeleted}</div>
              <p className="text-xs text-gray-500 mt-1">Removed content</p>
            </CardContent>
          </Card>

          <Card className="card-professional card-professional-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Flagged Today</CardTitle>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.flaggedToday}</div>
              <p className="text-xs text-gray-500 mt-1">Recent flags</p>
            </CardContent>
          </Card>
        </div>

        {/* Flagged Messages */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Flagged Messages</h2>
          
          {flaggedMessages.length === 0 ? (
            <Card className="card-professional">
              <CardContent className="text-center py-16">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No flagged messages</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  All messages are currently clean. The system will automatically flag suspicious content for review.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {flaggedMessages.map((message) => (
                <Card key={message.id} className="card-professional">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Flagged
                          </Badge>
                          <Badge variant="default" className={getRoleColor(message.user.role)}>
                            <User className="h-3 w-3 mr-1" />
                            {message.user.role}
                          </Badge>
                          <Badge variant="default" className={getRoomTypeColor(message.chatRoom.type)}>
                            <Hash className="h-3 w-3 mr-1" />
                            {message.chatRoom.type}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">
                          Message from {message.user.name}
                        </CardTitle>
                        <CardDescription>
                          In {message.chatRoom.name}
                          {message.chatRoom.quiz && ` (Quiz: ${message.chatRoom.quiz.title})`}
                          {' • '}
                          {formatDate(message.createdAt)}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/chat/rooms/${message.chatRoom.id}`)}
                          className="btn-secondary-professional"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Room
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnflagMessage(message.id)}
                          disabled={actionLoading === message.id}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteMessage(message.id)}
                          disabled={actionLoading === message.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-red-500">
                      <p className="text-gray-900 font-medium">Message Content:</p>
                      <p className="text-gray-700 mt-2">{message.content}</p>
                    </div>
                    {message.flaggedReason && (
                      <div className="mt-4 bg-red-50 p-3 rounded-lg">
                        <p className="text-red-800 text-sm">
                          <strong>Flagged Reason:</strong> {message.flaggedReason}
                        </p>
                      </div>
                    )}
                    <div className="mt-4 text-sm text-gray-600">
                      <p><strong>User:</strong> {message.user.name} ({message.user.email})</p>
                      <p><strong>Room:</strong> {message.chatRoom.name} ({message.chatRoom.type})</p>
                      <p><strong>Time:</strong> {formatDate(message.createdAt)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Message Activity</h2>
          <Card className="card-professional">
            <CardContent className="p-6">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {recentMessages.slice(0, 20).map((message) => (
                  <div key={message.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{message.user.name}</span>
                        <Badge variant="secondary" className={getRoleColor(message.user.role)}>
                          {message.user.role}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          in {message.chatRoom.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
