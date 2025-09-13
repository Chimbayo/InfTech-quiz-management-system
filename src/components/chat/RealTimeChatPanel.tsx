'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Users, Wifi, WifiOff, MessageSquare, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useWebSocket } from '@/hooks/useWebSocket'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Message {
  id: string
  content: string
  message?: string // For backward compatibility
  user: {
    id: string
    name: string
    role: string
  }
  createdAt: string
  isSystemMessage: boolean
  status?: 'sending' | 'sent' | 'delivered' | 'read'
}

interface ChatRoom {
  id: string
  name: string
  type: string
  isActive: boolean
  _count: {
    messages: number
  }
}

interface RealTimeChatPanelProps {
  roomId: string
  userId: string
}

export function RealTimeChatPanel({ roomId, userId }: RealTimeChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  const { socket, isConnected } = useWebSocket()

  // Fetch initial messages and room data
  useEffect(() => {
    if (roomId) {
      fetchRoom()
      fetchMessages()
    }
  }, [roomId])

  // Socket event listeners
  useEffect(() => {
    if (!socket || !roomId) return

    // Join the room
    socket.emit('join-room', roomId)

    // Listen for new messages
    socket.on('new-message', (message: Message) => {
      setMessages(prev => [...prev, message])
    })

    // Listen for typing events
    socket.on('user-typing', ({ userId: typingUserId, userName }: { userId: string, userName: string }) => {
      if (typingUserId !== userId) {
        setTypingUsers(prev => {
          if (!prev.includes(userName)) {
            return [...prev, userName]
          }
          return prev
        })
      }
    })

    socket.on('user-stopped-typing', ({ userId: typingUserId, userName }: { userId: string, userName: string }) => {
      setTypingUsers(prev => prev.filter(name => name !== userName))
    })

    // Listen for online users
    socket.on('room-users', (users: string[]) => {
      setOnlineUsers(users)
    })

    // Listen for message status updates
    socket.on('message-status', ({ messageId, status }: { messageId: string, status: string }) => {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, status: status as any } : msg
      ))
    })

    return () => {
      socket.off('new-message')
      socket.off('user-typing')
      socket.off('user-stopped-typing')
      socket.off('room-users')
      socket.off('message-status')
      socket.emit('leave-room', roomId)
    }
  }, [socket, roomId, userId])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chat/rooms/${roomId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(Array.isArray(data) ? data : data.messages || [])
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const fetchRoom = async () => {
    try {
      const response = await fetch(`/api/chat/rooms/${roomId}`)
      if (response.ok) {
        const data = await response.json()
        setCurrentRoom(data)
      }
    } catch (error) {
      console.error('Error fetching room:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !roomId || isLoading) return

    const messageText = newMessage.trim()
    setNewMessage('')
    setIsLoading(true)

    try {
      const response = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageText,
        }),
      })

      if (response.ok) {
        const newMsg = await response.json()
        
        // Emit to socket for real-time updates
        if (socket) {
          socket.emit('send-message', {
            roomId,
            message: newMsg
          })
        }
      } else {
        console.error('Failed to send message')
        setNewMessage(messageText) // Restore message on error
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setNewMessage(messageText) // Restore message on error
    } finally {
      setIsLoading(false)
    }
  }

  const handleTyping = () => {
    if (socket && roomId) {
      socket.emit('typing', { roomId, userId })
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop-typing', { roomId, userId })
      }, 1000)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    } else {
      handleTyping()
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const getMessageStatusIcon = (status?: string) => {
    switch (status) {
      case 'sending':
        return <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
      case 'sent':
        return <div className="w-3 h-3 rounded-full bg-gray-400" />
      case 'delivered':
        return <div className="w-3 h-3 rounded-full bg-blue-400" />
      case 'read':
        return <div className="w-3 h-3 rounded-full bg-green-400" />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border shadow-sm">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {currentRoom?.name || 'Loading...'}
            </h3>
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <div className="flex items-center text-green-600">
                  <Wifi className="h-3 w-3 mr-1" />
                  <span className="text-xs">Connected</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <WifiOff className="h-3 w-3 mr-1" />
                  <span className="text-xs">Connecting...</span>
                </div>
              )}
              {onlineUsers.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  {onlineUsers.length} online
                </Badge>
              )}
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={fetchMessages}>
              Refresh Messages
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isOwnMessage = message.user.id === userId
              const showAvatar = index === 0 || messages[index - 1].user.id !== message.user.id
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {!isOwnMessage && showAvatar && (
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {message.user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {!isOwnMessage && !showAvatar && (
                      <div className="w-8 h-8" />
                    )}
                    
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isOwnMessage
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : message.isSystemMessage
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          : 'bg-gray-100 text-gray-900 rounded-bl-md'
                      }`}
                    >
                      {!isOwnMessage && !message.isSystemMessage && showAvatar && (
                        <div className="text-xs font-medium mb-1 text-gray-600">
                          {message.user.name}
                          {message.user.role === 'ADMIN' && (
                            <Badge variant="secondary" className="ml-1 text-xs">Admin</Badge>
                          )}
                          {message.user.role === 'TEACHER' && (
                            <Badge variant="secondary" className="ml-1 text-xs">Teacher</Badge>
                          )}
                        </div>
                      )}
                      <div className="break-words whitespace-pre-wrap">{message.content || message.message}</div>
                      <div className={`flex items-center justify-between mt-1 text-xs ${
                        isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        <span>{formatTime(message.createdAt)}</span>
                        {isOwnMessage && (
                          <div className="ml-2">
                            {getMessageStatusIcon(message.status)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          
          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="flex justify-start">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
                <div className="bg-gray-100 px-3 py-2 rounded-2xl rounded-bl-md">
                  <span className="text-sm text-gray-600">
                    {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t bg-gray-50 rounded-b-lg">
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={isLoading || !isConnected}
            className="flex-1 bg-white"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isLoading || !isConnected}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        {!isConnected && (
          <p className="text-xs text-red-600 mt-2">
            Connection lost. Trying to reconnect...
          </p>
        )}
      </div>
    </div>
  )
}
