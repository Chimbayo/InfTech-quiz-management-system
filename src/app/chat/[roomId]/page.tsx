'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { ArrowLeft, MessageSquare, Users } from 'lucide-react'
import { RealTimeChatPanel } from '@/components/chat/RealTimeChatPanel'

interface ChatRoom {
  id: string
  name: string
  type: string
  isActive: boolean
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

export default function ChatRoomPage({ params }: { params: { roomId: string } }) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [room, setRoom] = useState<ChatRoom | null>(null)
  const [roomLoading, setRoomLoading] = useState(true)

  useEffect(() => {
    if (params.roomId) {
      fetchRoom()
    }
  }, [params.roomId])

  const fetchRoom = async () => {
    try {
      const response = await fetch(`/api/chat/rooms/${params.roomId}`)
      if (response.ok) {
        const data = await response.json()
        setRoom(data)
      } else {
        router.push('/chat')
      }
    } catch (error) {
      console.error('Error fetching room:', error)
      router.push('/chat')
    } finally {
      setRoomLoading(false)
    }
  }

  const handleBackToChat = () => {
    router.push('/chat')
  }

  if (loading || roomLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat room...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/')
    return null
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Room Not Found</h3>
          <p className="text-gray-600 mb-4">The chat room you're looking for doesn't exist.</p>
          <Button onClick={handleBackToChat}>Back to Chat</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={handleBackToChat}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Rooms
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{room.name}</h1>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>Created by {room.creator.name}</span>
                    {room.quiz && (
                      <>
                        <span>•</span>
                        <span>Quiz: {room.quiz.title}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="h-[calc(100vh-140px)]">
          <RealTimeChatPanel roomId={params.roomId} userId={user.id} />
        </div>
      </div>
    </div>
  )
}
