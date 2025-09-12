import React, { useEffect, useState } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Bell, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react'

interface QuizStatusBroadcastProps {
  userId?: string
  userName?: string
  userRole?: string
}

interface QuizAnnouncement {
  id: string
  quizId: string
  quizTitle: string
  type: 'PUBLISHED' | 'CLOSED' | 'STARTED' | 'ENDED'
  message: string
  sender: {
    name: string
    role: string
  }
  timestamp: string
}

const QuizStatusBroadcast: React.FC<QuizStatusBroadcastProps> = ({
  userId,
  userName,
  userRole
}) => {
  const [announcements, setAnnouncements] = useState<QuizAnnouncement[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const { on, off, recentAnnouncements } = useWebSocket({
    userId,
    userName,
    userRole
  })

  useEffect(() => {
    const handleQuizStatusUpdate = (data: QuizAnnouncement) => {
      setAnnouncements(prev => [data, ...prev.slice(0, 19)]) // Keep last 20
      
      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Quiz Update: ${data.quizTitle}`, {
          body: data.message,
          icon: '/favicon.ico'
        })
      }
    }

    const handleQuizAnnouncement = (data: QuizAnnouncement) => {
      setAnnouncements(prev => [data, ...prev.slice(0, 19)])
    }

    on('quiz-status-update', handleQuizStatusUpdate)
    on('quiz-announcement', handleQuizAnnouncement)

    return () => {
      off('quiz-status-update', handleQuizStatusUpdate)
      off('quiz-announcement', handleQuizAnnouncement)
    }
  }, [on, off])

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'PUBLISHED':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'STARTED':
        return <Clock className="w-4 h-4 text-blue-500" />
      case 'ENDED':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'CLOSED':
        return <AlertCircle className="w-4 h-4 text-orange-500" />
      default:
        return <Bell className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'PUBLISHED':
        return 'bg-green-50 border-green-200'
      case 'STARTED':
        return 'bg-blue-50 border-blue-200'
      case 'ENDED':
        return 'bg-red-50 border-red-200'
      case 'CLOSED':
        return 'bg-orange-50 border-orange-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const unreadCount = announcements.length

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Quiz Announcements</h3>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600">{unreadCount} new updates</p>
            )}
          </div>

          <div className="divide-y divide-gray-100">
            {announcements.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No announcements yet
              </div>
            ) : (
              announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${getStatusColor(announcement.type)}`}
                >
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(announcement.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {announcement.quizTitle}
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatTime(announcement.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {announcement.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        By {announcement.sender.name} ({announcement.sender.role})
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {announcements.length > 0 && (
            <div className="p-3 border-t border-gray-200">
              <button
                onClick={() => setAnnouncements([])}
                className="w-full text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Clear all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default QuizStatusBroadcast
