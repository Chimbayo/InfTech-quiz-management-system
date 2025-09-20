'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle2,
  User,
  Shield,
  Mail,
  MailOpen,
  Reply
} from 'lucide-react'

interface DirectMessage {
  id: string
  content: string
  senderId: string
  recipientId: string
  isRead: boolean
  readAt: string | null
  createdAt: string
  sender: {
    id: string
    name: string
    email: string
  }
  recipient: {
    id: string
    name: string
    email: string
  }
}

interface DirectMessagesPanelProps {
  userId: string
}

interface Conversation {
  otherUser: {
    id: string
    name: string
    email: string
  }
  lastMessage: DirectMessage
  unreadCount: number
}

export function DirectMessagesPanel({ userId }: DirectMessagesPanelProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchConversations()
    fetchUnreadCount()
    // Poll for new messages every 30 seconds
    const interval = setInterval(() => {
      fetchConversations()
      fetchUnreadCount()
      if (selectedConversation) {
        fetchMessages(selectedConversation)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation)
    }
  }, [selectedConversation])

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/direct-messages')
      if (response.ok) {
        const data = await response.json()
        
        // Process the raw data to create conversations
        const conversationMap = new Map<string, Conversation>()
        
        data.forEach((msg: any) => {
          const isFromCurrentUser = msg.senderId === userId
          const otherUserId = isFromCurrentUser ? msg.recipientId : msg.senderId
          const otherUser = isFromCurrentUser ? 
            { id: msg.recipientId, name: msg.recipientName, email: msg.recipientEmail } :
            { id: msg.senderId, name: msg.senderName, email: msg.senderEmail }
          
          if (!conversationMap.has(otherUserId)) {
            conversationMap.set(otherUserId, {
              otherUser,
              lastMessage: msg,
              unreadCount: !msg.isRead && !isFromCurrentUser ? 1 : 0
            })
          }
        })
        
        setConversations(Array.from(conversationMap.values()))
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    }
  }

  const fetchMessages = async (otherUserId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/direct-messages?otherUserId=${otherUserId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/direct-messages/unread')
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || isSending) return

    setIsSending(true)
    try {
      const response = await fetch('/api/direct-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: selectedConversation,
          content: newMessage.trim()
        })
      })

      if (response.ok) {
        const sentMessage = await response.json()
        setMessages(prev => [...prev, sentMessage])
        setNewMessage('')
        fetchConversations() // Refresh conversations to update last message
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }
  }

  const getSelectedConversation = () => {
    return conversations.find(conv => conv.otherUser.id === selectedConversation)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
            Direct Messages
          </h3>
          <p className="text-blue-600 mt-1">Messages from instructors and administrators</p>
        </div>
        {unreadCount > 0 && (
          <Badge className="bg-red-500 text-white">
            {unreadCount} unread
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Conversations
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6">
                <MessageSquare className="h-12 w-12 mb-2 text-gray-300" />
                <p className="text-center">No messages yet</p>
                <p className="text-sm text-center">Messages from instructors will appear here</p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.otherUser.id}
                    onClick={() => setSelectedConversation(conversation.otherUser.id)}
                    className={`p-4 cursor-pointer border-b hover:bg-blue-50 transition-colors ${
                      selectedConversation === conversation.otherUser.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center">
                          <Shield className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 truncate">
                              {conversation.otherUser.name}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            {conversation.lastMessage.content}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatTime(conversation.lastMessage.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messages Area */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedConversation ? (
            <>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {getSelectedConversation()?.otherUser.name}
                    </CardTitle>
                    <CardDescription>
                      {getSelectedConversation()?.otherUser.email}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Loading messages...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <MessageSquare className="h-12 w-12 mb-2 text-gray-300" />
                      <p>No messages in this conversation</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isFromCurrentUser = message.senderId === userId
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              isFromCurrentUser
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 border border-gray-200'
                            }`}
                          >
                            <div className="text-sm mb-1">{message.content}</div>
                            <div className={`flex items-center gap-1 text-xs ${
                              isFromCurrentUser ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              <Clock className="h-3 w-3" />
                              {formatTime(message.createdAt)}
                              {isFromCurrentUser && message.isRead && (
                                <CheckCircle2 className="h-3 w-3 ml-1" />
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Message Input */}
                <div className="border-t p-4 space-y-3">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Reply to ${getSelectedConversation()?.otherUser.name}...`}
                    className="min-h-[60px] resize-none"
                    disabled={isSending}
                  />
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Press Enter to send, Shift+Enter for new line
                    </div>
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || isSending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-sm">Choose a conversation from the left to start messaging</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
