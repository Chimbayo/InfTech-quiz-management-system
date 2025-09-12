'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, 
  Users, 
  AlertTriangle,
  Activity,
  ArrowLeft,
  Eye,
  Trash2,
  Shield,
  Clock,
  Hash
} from 'lucide-react'
import { SessionUser } from '@/lib/auth'

interface ChatRoomWithDetails {
  id: string
  name: string
  type: string
  isActive: boolean
  createdAt: Date
  quiz?: {
    id: string
    title: string
  } | null
  studyGroup?: {
    id: string
    name: string
  } | null
  _count: {
    messages: number
    members: number
  }
  messages: Array<{
    id: string
    content: string
    createdAt: Date
    user: {
      name: string
    }
  }>
}

interface AdminChatDashboardProps {
  user: SessionUser
  chatRooms: ChatRoomWithDetails[]
  stats: {
    totalRooms: number
    totalMessages: number
    totalActiveRooms: number
    flaggedMessages: number
  }
}

export function AdminChatDashboard({ user, chatRooms, stats }: AdminChatDashboardProps) {
  const router = useRouter()
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this chat room? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/chat/rooms/${roomId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Failed to delete chat room')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete chat room')
    }
  }

  const handleToggleRoom = async (roomId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/chat/rooms/${roomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Failed to update chat room')
      }
    } catch (error) {
      console.error('Update error:', error)
      alert('Failed to update chat room')
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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
                onClick={() => router.push('/admin/dashboard')}
                className="btn-secondary-professional"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-green-700 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Chat Management</h1>
                  <p className="text-xs text-gray-500">Admin Dashboard</p>
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
              <CardTitle className="text-sm font-medium text-gray-600">Total Rooms</CardTitle>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Hash className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalRooms}</div>
              <p className="text-xs text-gray-500 mt-1">Chat rooms created</p>
            </CardContent>
          </Card>

          <Card className="card-professional card-professional-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Messages</CardTitle>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalMessages}</div>
              <p className="text-xs text-gray-500 mt-1">Messages sent</p>
            </CardContent>
          </Card>

          <Card className="card-professional card-professional-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Rooms</CardTitle>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalActiveRooms}</div>
              <p className="text-xs text-gray-500 mt-1">Currently active</p>
            </CardContent>
          </Card>

          <Card className="card-professional card-professional-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Flagged Messages</CardTitle>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.flaggedMessages}</div>
              <p className="text-xs text-gray-500 mt-1">Need review</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Chat Rooms</h2>
            <p className="text-gray-600 mt-1">Monitor and manage all chat rooms</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => router.push('/chat')}
              variant="outline"
              className="btn-secondary-professional"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Open Chat
            </Button>
            {stats.flaggedMessages > 0 && (
              <Button 
                onClick={() => router.push('/admin/chat/moderation')}
                variant="outline"
                className="btn-secondary-professional text-red-600 hover:text-red-700"
              >
                <Shield className="h-4 w-4 mr-2" />
                Review Flagged ({stats.flaggedMessages})
              </Button>
            )}
          </div>
        </div>

        {/* Chat Rooms List */}
        {chatRooms.length === 0 ? (
          <Card className="card-professional">
            <CardContent className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No chat rooms yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Chat rooms will be created automatically when quizzes with chat enabled are created
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {chatRooms.map((room) => (
              <Card key={room.id} className="card-professional card-professional-hover">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-white" />
                        </div>
                        {room.name}
                        <Badge variant="default" className={getRoomTypeColor(room.type)}>
                          {room.type}
                        </Badge>
                        {!room.isActive && (
                          <Badge variant="secondary" className="ml-2">Inactive</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-2 text-gray-600">
                        {room.quiz && `Quiz: ${room.quiz.title}`}
                        {room.studyGroup && `Study Group: ${room.studyGroup.name}`}
                        {!room.quiz && !room.studyGroup && 'General chat room'}
                      </CardDescription>
                      {room.messages.length > 0 && (
                        <div className="mt-2 text-sm text-gray-500">
                          Last message: "{room.messages[0].content.substring(0, 50)}..." 
                          by {room.messages[0].user.name} on {formatDate(room.messages[0].createdAt)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/chat/rooms/${room.id}`)}
                        className="btn-secondary-professional"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Messages
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleRoom(room.id, room.isActive)}
                        className={room.isActive ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
                      >
                        <Activity className="h-4 w-4 mr-2" />
                        {room.isActive ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRoom(room.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{room._count.messages}</div>
                      <div className="text-sm text-gray-600">Messages</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{room._count.members}</div>
                      <div className="text-sm text-gray-600">Members</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {room.isActive ? 'Active' : 'Inactive'}
                      </div>
                      <div className="text-sm text-gray-600">Status</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        <Clock className="h-6 w-6 mx-auto" />
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatDate(room.createdAt)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
