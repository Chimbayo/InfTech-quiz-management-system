'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  MessageSquare, 
  Send, 
  X, 
  User,
  Clock,
  CheckCircle2
} from 'lucide-react'

interface DirectMessageModalProps {
  studentId: string
  studentName: string
  studentEmail: string
  trigger?: React.ReactNode
}

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

export function DirectMessageModal({ studentId, studentName, studentEmail, trigger }: DirectMessageModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchMessages()
    }
  }, [isOpen, studentId])

  const fetchMessages = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/direct-messages?otherUserId=${studentId}`)
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

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    try {
      const response = await fetch('/api/direct-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: studentId,
          content: newMessage.trim()
        })
      })

      if (response.ok) {
        const sentMessage = await response.json()
        setMessages(prev => [...prev, sentMessage])
        setNewMessage('')
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
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Message
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            Direct Message with {studentName}
          </DialogTitle>
          <DialogDescription>
            Send a direct message to {studentEmail}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto border rounded-lg p-4 mb-4 bg-gray-50 min-h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading messages...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MessageSquare className="h-12 w-12 mb-2 text-gray-300" />
                <p>No messages yet</p>
                <p className="text-sm">Start a conversation with {studentName}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const isFromAdmin = message.senderId !== studentId
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isFromAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          isFromAdmin
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <div className="text-sm mb-1">{message.content}</div>
                        <div className={`flex items-center gap-1 text-xs ${
                          isFromAdmin ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          <Clock className="h-3 w-3" />
                          {formatTime(message.createdAt)}
                          {isFromAdmin && message.isRead && (
                            <CheckCircle2 className="h-3 w-3 ml-1" />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="message">Your Message</Label>
              <Textarea
                id="message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Type your message to ${studentName}...`}
                className="min-h-[80px] resize-none"
                disabled={isSending}
              />
            </div>
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
                    Send Message
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
