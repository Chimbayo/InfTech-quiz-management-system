'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Users, BookOpen, Plus, Search, Wifi } from 'lucide-react'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface ChatRoom {
  id: string
  name: string
  type: string
  isActive: boolean
  createdAt: string
  creator: {
    id: string
    name: string
    role: string
  }
  quiz?: {
    id: string
    title: string
  }
  _count: {
    messages: number
  }
}

interface Quiz {
  id: string
  title: string
}

interface ChatRoomListProps {
  selectedRoomId?: string | null
  onRoomSelect: (roomId: string) => void
  userRole: string
}

export function ChatRoomList({ selectedRoomId, onRoomSelect, userRole }: ChatRoomListProps) {
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [totalOnlineStudents, setTotalOnlineStudents] = useState(0)
  const [newRoomData, setNewRoomData] = useState({
    name: '',
    type: 'general',
    quizId: ''
  })
  
  const { socket, isConnected } = useWebSocket()

  useEffect(() => {
    loadRooms()
    if (userRole === 'ADMIN' || userRole === 'TEACHER') {
      loadQuizzes()
    }
  }, [userRole])

  // WebSocket listeners for online users
  useEffect(() => {
    if (!socket || !isConnected) return

    // Listen for global online users updates
    socket.on('global-online-users', (data: { totalStudents: number, allUsers: string[] }) => {
      setTotalOnlineStudents(data.totalStudents)
      setOnlineUsers(data.allUsers)
    })

    // Request initial online users count
    socket.emit('get-global-online-users')

    return () => {
      socket.off('global-online-users')
    }
  }, [socket, isConnected])

  const loadRooms = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/chat/rooms')
      if (response.ok) {
        const data = await response.json()
        setRooms(data)
      }
    } catch (error) {
      console.error('Failed to load chat rooms:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadQuizzes = async () => {
    try {
      const response = await fetch('/api/quizzes?role=admin')
      if (response.ok) {
        const data = await response.json()
        setQuizzes(data)
      }
    } catch (error) {
      console.error('Failed to load quizzes:', error)
    }
  }

  const createRoom = async () => {
    try {
      const response = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newRoomData.name,
          type: newRoomData.type,
          quizId: newRoomData.quizId || null
        }),
      })

      if (response.ok) {
        const newRoom = await response.json()
        setRooms(prev => [newRoom, ...prev])
        setIsCreateDialogOpen(false)
        setNewRoomData({ name: '', type: 'general', quizId: '' })
        onRoomSelect(newRoom.id)
      }
    } catch (error) {
      console.error('Failed to create room:', error)
    }
  }

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.quiz?.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoomIcon = (type: string) => {
    switch (type) {
      case 'quiz': return <BookOpen className="h-4 w-4" />
      case 'study': return <Users className="h-4 w-4" />
      default: return <MessageCircle className="h-4 w-4" />
    }
  }

  const getRoomTypeColor = (type: string) => {
    switch (type) {
      case 'quiz': return 'bg-blue-100 text-blue-800'
      case 'study': return 'bg-purple-100 text-purple-800'
      default: return 'bg-green-100 text-green-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="flex flex-col h-full bg-white border rounded-lg">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Chat Rooms</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                <Wifi className={`h-4 w-4 ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
                <span className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? 'Connected' : 'Connecting...'}
                </span>
              </div>
              <div className="h-4 w-px bg-slate-300"></div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-semibold text-blue-600">
                  {totalOnlineStudents} Students Online
                </span>
              </div>
            </div>
          </div>
          {(userRole === 'ADMIN' || userRole === 'TEACHER') && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  New Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Chat Room</DialogTitle>
                  <DialogDescription>
                    Create a new chat room for discussions, study groups, or quiz-specific conversations.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="roomName">Room Name</Label>
                    <Input
                      id="roomName"
                      value={newRoomData.name}
                      onChange={(e) => setNewRoomData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter room name..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="roomType">Room Type</Label>
                    <Select
                      value={newRoomData.type}
                      onValueChange={(value) => setNewRoomData(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Discussion</SelectItem>
                        <SelectItem value="study">Study Group</SelectItem>
                        <SelectItem value="quiz">Quiz Discussion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(newRoomData.type === 'quiz' || newRoomData.type === 'study') && (
                    <div>
                      <Label htmlFor="quiz">Associated Quiz</Label>
                      <Select
                        value={newRoomData.quizId}
                        onValueChange={(value) => setNewRoomData(prev => ({ ...prev, quizId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a quiz..." />
                        </SelectTrigger>
                        <SelectContent>
                          {quizzes.map((quiz) => (
                            <SelectItem key={quiz.id} value={quiz.id}>
                              {quiz.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    onClick={createRoom}
                    disabled={!newRoomData.name.trim()}
                  >
                    Create Room
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search rooms..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Room List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-gray-500">Loading rooms...</div>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <div className="text-sm text-gray-500">
                  {searchTerm ? 'No rooms found' : 'No chat rooms available'}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => window.location.href = `/chat/${room.id}`}
                  className={`w-full p-3 text-left rounded-lg border transition-colors ${
                    selectedRoomId === room.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50 border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 min-w-0 flex-1">
                      <div className="flex-shrink-0 mt-0.5">
                        {getRoomIcon(room.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-sm text-gray-900 truncate">
                            {room.name}
                          </h3>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getRoomTypeColor(room.type)}`}
                          >
                            {room.type}
                          </Badge>
                        </div>
                        {room.quiz && (
                          <p className="text-xs text-gray-600 truncate">
                            Quiz: {room.quiz.title}
                          </p>
                        )}
                        {room._count?.messages && (
                          <p className="text-xs text-gray-500 mt-2">
                            {room._count.messages} messages
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500">
                            by {room.creator.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(room.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {room._count?.messages && room._count.messages > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {room._count.messages}
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
