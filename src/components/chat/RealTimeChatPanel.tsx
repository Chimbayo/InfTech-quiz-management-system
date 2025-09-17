'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Users, Wifi, WifiOff, MessageSquare, MoreVertical, Reply, Edit, Trash2, Smile, Copy } from 'lucide-react'
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
  DropdownMenuSeparator,
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
  updatedAt?: string
  isSystemMessage: boolean
  isEdited?: boolean
  isDeleted?: boolean
  deletedAt?: string
  replyTo?: {
    id: string
    content: string
    user: {
      name: string
    }
  }
  reactions?: {
    emoji: string
    users: string[]
    count: number
  }[]
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
  const [editingMessage, setEditingMessage] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [selectedReaction, setSelectedReaction] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  const { socket, isConnected } = useWebSocket()

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/session')
        if (response.ok) {
          const session = await response.json()
          if (session?.user) {
            setUserName(session.user.name || '')
            setUserRole(session.user.role || 'STUDENT')
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }
    
    fetchUserData()
  }, [])

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

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || isLoading || !isConnected) return

    const tempId = `temp-${Date.now()}`
    const messageData = {
      id: tempId,
      content: newMessage,
      user: {
        id: userId,
        name: userName,
        role: userRole
      },
      createdAt: new Date().toISOString(),
      isSystemMessage: false,
      status: 'sending' as const,
      replyTo: replyingTo ? {
        id: replyingTo.id,
        content: replyingTo.content || replyingTo.message || '',
        user: {
          name: replyingTo.user.name
        }
      } : undefined
    }

    // Add message optimistically
    setMessages(prev => [...prev, messageData])
    setNewMessage('')
    setReplyingTo(null)
    setIsLoading(true)

    try {
      // Send via Socket.IO for real-time delivery
      if (socket) {
        socket.emit('send-message', {
          roomId,
          content: newMessage,
          replyToId: replyingTo?.id,
          tempId
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId))
    } finally {
      setIsLoading(false)
    }
  }, [newMessage, isLoading, isConnected, socket, roomId, userId, userName, userRole, replyingTo])

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      const response = await fetch(`/api/chat/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newContent
        }),
      })

      if (response.ok) {
        const updatedMsg = await response.json()
        
        // Update local messages
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, ...updatedMsg, isEdited: true } : msg
        ))
        
        // Emit to socket
        if (socket) {
          socket.emit('message-edited', {
            roomId,
            messageId,
            newContent,
            updatedMessage: updatedMsg
          })
        }
        
        setEditingMessage(null)
        setEditingContent('')
      }
    } catch (error) {
      console.error('Error editing message:', error)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/chat/messages/${messageId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Update local messages
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, isDeleted: true, content: 'This message was deleted' } : msg
        ))
        
        // Emit to socket
        if (socket) {
          socket.emit('message-deleted', {
            roomId,
            messageId
          })
        }
      }
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  const handleReactToMessage = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/chat/messages/${messageId}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emoji
        }),
      })

      if (response.ok) {
        const updatedReactions = await response.json()
        
        // Update local messages
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, reactions: updatedReactions } : msg
        ))
        
        // Emit to socket
        if (socket) {
          socket.emit('message-reaction', {
            roomId,
            messageId,
            emoji,
            userId
          })
        }
      }
    } catch (error) {
      console.error('Error reacting to message:', error)
    }
  }

  const handleReplyToMessage = (message: Message) => {
    setReplyingTo(message)
  }

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
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
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-slate-200 chat-mobile">
      {/* Mobile Header */}
      <div className="chat-header-mobile">
        <button 
          onClick={() => window.history.back()}
          className="touch-target text-gray-600 hover:text-gray-800"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 text-center">
          <h3 className="text-responsive-base font-bold text-gray-900 truncate">
            {currentRoom?.name || 'Loading...'}
          </h3>
          <div className="flex items-center justify-center space-x-2 mt-1">
            {isConnected ? (
              <div className="flex items-center text-emerald-600">
                <Wifi className="h-3 w-3 mr-1" />
                <span className="text-xs font-medium">Connected</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <WifiOff className="h-3 w-3 mr-1" />
                <span className="text-xs font-medium">Connecting...</span>
              </div>
            )}
            <Badge className="badge-inftech badge-inftech-primary text-xs">
              <Users className="h-3 w-3 mr-1" />
              {onlineUsers.length}
            </Badge>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="touch-target p-0"
            >
              <MoreVertical className="h-5 w-5 text-gray-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={fetchMessages} className="text-sm py-2">
              <MessageSquare className="h-4 w-4 mr-2" />
              Refresh Messages
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop Header */}
      <div className="tablet-up flex items-center justify-between p-4 sm:p-6 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-t-xl shadow-lg">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-md">
            <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div>
            <h3 className="text-responsive-lg font-bold text-white">
              {currentRoom?.name || 'Loading...'}
            </h3>
            <div className="flex items-center space-x-3 mt-1">
              {isConnected ? (
                <div className="flex items-center text-emerald-400">
                  <Wifi className="h-4 w-4 mr-1" />
                  <span className="text-responsive-xs font-medium">Connected</span>
                </div>
              ) : (
                <div className="flex items-center text-red-400">
                  <WifiOff className="h-4 w-4 mr-1" />
                  <span className="text-responsive-xs font-medium">Connecting...</span>
                </div>
              )}
              <Badge className="badge-inftech badge-inftech-primary text-xs">
                <Users className="h-4 w-4 mr-1" />
                {onlineUsers.length} online
              </Badge>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 sm:h-10 sm:w-10 p-0 bg-slate-700 hover:bg-slate-800 shadow-lg border border-slate-600 rounded-xl"
            >
              <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={fetchMessages} className="text-responsive-sm py-2 sm:py-3">
              <MessageSquare className="h-4 w-4 mr-2 sm:mr-3" />
              Refresh Messages
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages Area */}
      <ScrollArea className="chat-messages-mobile flex-1 padding-responsive bg-gradient-to-b from-slate-50/30 to-white">
        <div className="spacing-responsive">
          {messages.length === 0 ? (
            <div className="text-center padding-responsive-lg">
              <MessageSquare className="h-12 w-12 sm:h-16 sm:w-16 text-slate-300 mx-auto mb-4 sm:mb-6" />
              <p className="text-responsive-sm text-slate-500">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isOwnMessage = message.user.id === userId
              const showAvatar = index === 0 || messages[index - 1].user.id !== message.user.id
              const isEditing = editingMessage === message.id
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}
                >
                  <div className={`flex items-end space-x-2 max-w-[280px] sm:max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {!isOwnMessage && showAvatar && (
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-medium flex-shrink-0">
                        {message.user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {!isOwnMessage && !showAvatar && (
                      <div className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
                    )}
                    
                    <div className="relative">
                      {/* Reply indicator */}
                      {message.replyTo && (
                        <div className={`mb-1 p-2 rounded-lg border-l-4 ${
                          isOwnMessage ? 'border-blue-300 bg-blue-50' : 'border-gray-300 bg-gray-50'
                        }`}>
                          <div className="text-xs font-medium text-gray-600">
                            Replying to {message.replyTo.user.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {message.replyTo.content}
                          </div>
                        </div>
                      )}
                      
                      <div
                        className={`px-4 py-2 rounded-2xl relative ${
                          message.isDeleted
                            ? 'bg-gray-100 text-gray-500 italic'
                            : isOwnMessage
                            ? 'bg-blue-600 text-white rounded-br-md'
                            : message.isSystemMessage
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            : 'bg-gray-100 text-gray-900 rounded-bl-md'
                        }`}
                      >
                        {/* Message actions dropdown */}
                        {!message.isSystemMessage && !message.isDeleted && (
                          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 bg-slate-800 hover:bg-slate-900 shadow-lg border border-slate-600 rounded-full"
                                >
                                  <MoreVertical className="h-4 w-4 text-white" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleReplyToMessage(message)}>
                                  <Reply className="h-4 w-4 mr-2" />
                                  Reply
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleCopyMessage(message.content || message.message || '')}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleReactToMessage(message.id, '👍')}>
                                  <Smile className="h-4 w-4 mr-2" />
                                  👍
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleReactToMessage(message.id, '❤️')}>
                                  <Smile className="h-4 w-4 mr-2" />
                                  ❤️
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleReactToMessage(message.id, '😂')}>
                                  <Smile className="h-4 w-4 mr-2" />
                                  😂
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleReactToMessage(message.id, '😮')}>
                                  <Smile className="h-4 w-4 mr-2" />
                                  😮
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleReactToMessage(message.id, '😢')}>
                                  <Smile className="h-4 w-4 mr-2" />
                                  😢
                                </DropdownMenuItem>
                                {isOwnMessage && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        setEditingMessage(message.id)
                                        setEditingContent(message.content || message.message || '')
                                      }}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteMessage(message.id)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}

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
                        
                        {isEditing ? (
                          <div className="space-y-2">
                            <Input
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleEditMessage(message.id, editingContent)
                                } else if (e.key === 'Escape') {
                                  setEditingMessage(null)
                                  setEditingContent('')
                                }
                              }}
                              className="text-sm"
                            />
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleEditMessage(message.id, editingContent)}
                              >
                                Save
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setEditingMessage(null)
                                  setEditingContent('')
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="break-words whitespace-pre-wrap">
                            {message.content || message.message}
                            {message.isEdited && (
                              <span className="text-xs opacity-70 ml-2">(edited)</span>
                            )}
                          </div>
                        )}
                        
                        {/* Reactions */}
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {message.reactions.map((reaction, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleReactToMessage(message.id, reaction.emoji)}
                                className="flex items-center space-x-1 bg-gray-200 hover:bg-gray-300 rounded-full px-2 py-1 text-xs transition-colors"
                              >
                                <span>{reaction.emoji}</span>
                                <span>{reaction.count}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        
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
      <div className="chat-input-mobile padding-responsive border-t bg-gradient-to-r from-slate-50 to-blue-50 rounded-b-xl">
        {/* Reply preview */}
        {replyingTo && (
          <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-responsive-xs font-semibold text-blue-700 mb-1">
                  Replying to {replyingTo.user.name}
                </div>
                <div className="text-responsive-sm text-blue-600 truncate">
                  {replyingTo.content || replyingTo.message}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(null)}
                className="touch-target h-8 w-8 p-0 text-blue-600 hover:bg-blue-100 rounded-full flex-shrink-0 ml-2"
              >
                ×
              </Button>
            </div>
          </div>
        )}
        
        <div className="flex space-x-2 sm:space-x-3">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={replyingTo ? "Reply to message..." : "Type a message..."}
            disabled={isLoading || !isConnected}
            className="input-responsive flex-1 bg-white border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isLoading || !isConnected}
            className="btn-inftech-primary touch-target px-4 py-3 sm:px-6 rounded-xl flex-shrink-0"
          >
            {isLoading ? (
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </Button>
        </div>
        {!isConnected && (
          <p className="text-responsive-xs text-red-600 mt-2 sm:mt-3 font-medium">
            Connection lost. Trying to reconnect...
          </p>
        )}
      </div>
    </div>
  )
}
