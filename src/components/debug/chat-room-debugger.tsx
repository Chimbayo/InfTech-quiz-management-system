'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, Eye, EyeOff, MessageSquare } from 'lucide-react'

interface ChatRoom {
  id: string
  name: string
  description: string | null
  type: string
  isActive: boolean
  quizId: string | null
  quiz?: {
    id: string
    title: string
  }
  _count: {
    messages: number
  }
  createdAt: string
}

export function ChatRoomDebugger() {
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchRooms = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/debug/chat-rooms')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Flatten the roomsByType structure
      const allRooms: ChatRoom[] = []
      Object.entries(data.roomsByType).forEach(([type, typeRooms]: [string, any]) => {
        typeRooms.forEach((room: any) => {
          allRooms.push({
            ...room,
            type
          })
        })
      })
      
      setRooms(allRooms)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rooms')
    } finally {
      setLoading(false)
    }
  }

  const activateRoom = async (roomId: string) => {
    try {
      const response = await fetch(`/api/debug/activate-post-quiz-rooms?roomId=${roomId}`, {
        method: 'POST'
      })
      
      if (response.ok) {
        fetchRooms() // Refresh the list
      }
    } catch (err) {
      console.error('Failed to activate room:', err)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [])

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'QUIZ_DISCUSSION': return 'bg-blue-100 text-blue-800'
      case 'PRE_QUIZ_DISCUSSION': return 'bg-yellow-100 text-yellow-800'
      case 'POST_QUIZ_REVIEW': return 'bg-green-100 text-green-800'
      case 'POST_EXAM_DISCUSSION': return 'bg-red-100 text-red-800'
      case 'GENERAL': return 'bg-gray-100 text-gray-800'
      default: return 'bg-purple-100 text-purple-800'
    }
  }

  const quizRooms = rooms.filter(room => 
    room.type === 'QUIZ_DISCUSSION' || 
    room.type === 'PRE_QUIZ_DISCUSSION' || 
    room.type === 'POST_QUIZ_DISCUSSION' ||
    room.type === 'POST_QUIZ_REVIEW' ||
    room.type === 'POST_EXAM_DISCUSSION' ||
    room.type === 'EXAM_GENERAL_DISCUSSION'
  )

  const activeQuizRooms = quizRooms.filter(room => room.isActive)
  const inactiveQuizRooms = quizRooms.filter(room => !room.isActive)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chat Room Debugger
            </span>
            <Button 
              onClick={fetchRooms} 
              disabled={loading}
              size="sm"
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            Debug tool to inspect chat room status and activation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{rooms.length}</div>
              <div className="text-sm text-gray-600">Total Rooms</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{activeQuizRooms.length}</div>
              <div className="text-sm text-gray-600">Active Quiz Rooms</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{inactiveQuizRooms.length}</div>
              <div className="text-sm text-gray-600">Inactive Quiz Rooms</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Quiz Rooms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-green-600" />
            Active Quiz Rooms ({activeQuizRooms.length})
          </CardTitle>
          <CardDescription>These rooms should be visible to students</CardDescription>
        </CardHeader>
        <CardContent>
          {activeQuizRooms.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No active quiz rooms found</p>
          ) : (
            <div className="space-y-3">
              {activeQuizRooms.map((room) => (
                <div key={room.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{room.name}</h4>
                      <Badge className={getTypeColor(room.type)}>{room.type}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{room.description}</p>
                    {room.quiz && (
                      <p className="text-xs text-blue-600 mt-1">Quiz: {room.quiz.title}</p>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {room._count?.messages || 0} messages
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inactive Quiz Rooms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <EyeOff className="h-5 w-5 text-yellow-600" />
            Inactive Quiz Rooms ({inactiveQuizRooms.length})
          </CardTitle>
          <CardDescription>These rooms are hidden from students</CardDescription>
        </CardHeader>
        <CardContent>
          {inactiveQuizRooms.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No inactive quiz rooms found</p>
          ) : (
            <div className="space-y-3">
              {inactiveQuizRooms.map((room) => (
                <div key={room.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{room.name}</h4>
                      <Badge className={getTypeColor(room.type)}>{room.type}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{room.description}</p>
                    {room.quiz && (
                      <p className="text-xs text-blue-600 mt-1">Quiz: {room.quiz.title}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-500">
                      {room._count?.messages || 0} messages
                    </div>
                    {room.type === 'POST_QUIZ_REVIEW' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => activateRoom(room.id)}
                        className="text-green-600 border-green-300 hover:bg-green-50"
                      >
                        Activate
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Other Rooms */}
      {rooms.filter(room => !quizRooms.includes(room)).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Other Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rooms.filter(room => !quizRooms.includes(room)).map((room) => (
                <div key={room.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{room.name}</h4>
                      <Badge className={getTypeColor(room.type)}>{room.type}</Badge>
                      {room.isActive ? (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{room.description}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {room._count?.messages || 0} messages
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
