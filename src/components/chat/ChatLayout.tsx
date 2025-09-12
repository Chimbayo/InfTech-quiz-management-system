'use client'

import { useState } from 'react'
import { ChatPanel } from './ChatPanel'
import { ChatRoomList } from './ChatRoomList'
import { useAuth } from '@/hooks/useAuth'

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

interface ChatLayoutProps {
  className?: string
}

export function ChatLayout({ className }: ChatLayoutProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  if (!user) {
    return <div className="flex items-center justify-center h-64">Please log in to access chat.</div>
  }

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 h-full ${className}`}>
      {/* Room List - Left Sidebar */}
      <div className="lg:col-span-1">
        <ChatRoomList
          selectedRoomId={selectedRoomId}
          onRoomSelect={setSelectedRoomId}
          userRole={user.role}
        />
      </div>

      {/* Chat Panel - Main Area */}
      <div className="lg:col-span-2">
        <ChatPanel
          roomId={selectedRoomId || undefined}
          userId={user.id}
        />
      </div>
    </div>
  )
}
