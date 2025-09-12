'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Users, Wifi, WifiOff, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface Message {
  id: string
  message: string
  user: {
    id: string
    name: string
    role: string
  }
  createdAt: string
  isSystemMessage: boolean
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

interface ChatPanelProps {
  roomId?: string
  userId: string
}

export function ChatPanel({ roomId, userId }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isConnected, setIsConnected] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch messages from API
  const fetchMessages = async () => {
    if (!roomId) return
    
    try {
      const response = await fetch(`/api/chat/rooms/${roomId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(Array.isArray(data) ? data : data.messages || [])
        setIsConnected(true)
      } else {
        setIsConnected(false)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      setIsConnected(false)
    }
  }

  // Fetch room details
  const fetchRoom = async () => {
    if (!roomId) return
    
    try {
      const response = await fetch(`/api/chat/rooms/${roomId}`)
      if (response.ok) {
        const data = await response.json()
        setCurrentRoom(data.room)
      }
    } catch (error) {
      console.error('Error fetching room:', error)
    }
  }

  // Initialize and fetch data
  useEffect(() => {
    if (roomId) {
      fetchRoom()
      fetchMessages()
      
      // Poll for new messages every 3 seconds
      const interval = setInterval(fetchMessages, 3000)
      return () => clearInterval(interval)
    } else {
      setCurrentRoom(null)
      setMessages([])
    }
  }, [roomId])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !roomId || isLoading) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage.trim(),
        }),
      })

      if (response.ok) {
        setNewMessage('')
        // Fetch messages immediately after sending
        await fetchMessages()
      } else {
        console.error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!roomId) {
    return (
      <div className="flex items-center justify-center h-full bg-white rounded-lg border">
        <div className="text-center p-8">
          <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Chat Room</h3>
          <p className="text-gray-600">Choose a room from the sidebar to start chatting</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border">
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
                  <span className="text-xs">Disconnected</span>
                </div>
              )}
              {currentRoom && (
                <Badge variant="secondary" className="text-xs">
                  {currentRoom.type === 'QUIZ_DISCUSSION' ? 'Quiz Chat' : 'General'}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            {currentRoom?._count?.messages || 0} messages
          </Badge>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.user.id === userId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.user.id === userId
                    ? 'bg-blue-600 text-white'
                    : message.isSystemMessage
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.user.id !== userId && !message.isSystemMessage && (
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
                <div className="break-words">{message.message}</div>
                <div className={`text-xs mt-1 ${
                  message.user.id === userId ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {new Date(message.createdAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t bg-gray-50 rounded-b-lg">
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading || !isConnected}
            className="flex-1"
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
