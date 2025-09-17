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
      <div className="min-h-screen bg-inftech-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <p className="text-slate-600 text-lg">Loading chat room...</p>
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
      <div className="min-h-screen bg-inftech-gradient flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="h-20 w-20 text-slate-300 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-slate-900 mb-3">Room Not Found</h3>
          <p className="text-slate-600 text-lg mb-6">The chat room you're looking for doesn't exist.</p>
          <Button onClick={handleBackToChat} className="btn-inftech-primary">Back to Chat</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-inftech-gradient flex flex-col">
      {/* Header */}
      <header className="header-inftech sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                onClick={handleBackToChat}
                className="btn-inftech-secondary"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Rooms
              </Button>
              <div className="h-8 w-px bg-slate-200"></div>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold heading-inftech-primary">{room.name}</h1>
                  <div className="flex items-center space-x-3 text-base text-slate-600">
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
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-[calc(100vh-180px)]">
          <RealTimeChatPanel roomId={params.roomId} userId={user.id} />
        </div>
      </div>
    </div>
  )
}
