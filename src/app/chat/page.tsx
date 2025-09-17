'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChatLayout } from '@/components/chat/ChatLayout'
import { useAuth } from '@/hooks/useAuth'
import { ArrowLeft, Home, MessageSquare } from 'lucide-react'

export default function ChatPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const handleBackToDashboard = () => {
    if (!user) {
      router.push('/')
      return
    }

    // Navigate back to appropriate dashboard based on user role
    switch (user.role) {
      case 'ADMIN':
        router.push('/admin/dashboard')
        break
      case 'TEACHER':
        router.push('/admin/dashboard')
        break
      case 'STUDENT':
        router.push('/student/dashboard')
        break
      default:
        router.push('/')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-inftech-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <p className="text-slate-600 text-lg">Loading chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-inftech-gradient">
      {/* Navigation Header */}
      <header className="header-inftech sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                onClick={handleBackToDashboard}
                className="btn-inftech-secondary"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="h-8 w-px bg-slate-200"></div>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold heading-inftech-primary">Chat & Study Groups</h1>
                  <p className="text-slate-600">Real-time collaboration platform</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              {user && (
                <div className="hidden sm:block text-right">
                  <p className="text-base font-semibold text-slate-900">{user.name}</p>
                  <p className="text-sm text-slate-600 capitalize">{user.role.toLowerCase()}</p>
                </div>
              )}
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="btn-inftech-secondary"
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <p className="text-slate-600 text-lg">
            Collaborate with classmates and discuss quizzes in real-time with our professional chat platform
          </p>
        </div>
        
        <div className="h-[calc(100vh-280px)]">
          <ChatLayout />
        </div>
      </div>
    </div>
  )
}
