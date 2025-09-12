'use client'

import React, { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useWebSocket } from '@/hooks/useWebSocket'

interface Notification {
  id: string
  message: string
  type: 'announcement' | 'quiz' | 'general'
  timestamp: Date
  read: boolean
}

interface NotificationBellProps {
  userId: string
  userName: string
  userRole: string
}

export default function NotificationBell({ userId, userName, userRole }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { socket, isConnected } = useWebSocket()

  useEffect(() => {
    if (!socket || !isConnected) return

    // Listen for new announcements
    socket.on('new-announcement', (data: any) => {
      const notification: Notification = {
        id: data.id,
        message: data.message,
        type: 'announcement',
        timestamp: new Date(data.sentAt),
        read: false
      }
      
      setNotifications(prev => [notification, ...prev])
      setUnreadCount(prev => prev + 1)
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification('New Announcement', {
          body: data.message,
          icon: '/favicon.ico'
        })
      }
    })

    // Listen for quiz broadcasts (new quiz notifications)
    socket.on('quiz-broadcast', (data: any) => {
      if (data.type === 'PUBLISHED') {
        const notification: Notification = {
          id: `quiz-${data.quizId}-${Date.now()}`,
          message: data.message,
          type: 'quiz',
          timestamp: new Date(),
          read: false
        }
        
        setNotifications(prev => [notification, ...prev])
        setUnreadCount(prev => prev + 1)
        
        // Show browser notification
        if (Notification.permission === 'granted') {
          new Notification('New Quiz Available', {
            body: data.message,
            icon: '/favicon.ico'
          })
        }
      }
    })

    // Listen for new quiz notifications
    socket.on('new-quiz-notification', (data: any) => {
      const notification: Notification = {
        id: data.id,
        message: data.message,
        type: 'quiz',
        timestamp: new Date(data.createdAt),
        read: false
      }
      
      setNotifications(prev => [notification, ...prev])
      setUnreadCount(prev => prev + 1)
      
      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification('New Quiz Available', {
          body: data.message,
          icon: '/favicon.ico'
        })
      }
    })

    return () => {
      socket.off('new-announcement')
      socket.off('quiz-broadcast')
      socket.off('new-quiz-notification')
    }
  }, [socket, isConnected])

  useEffect(() => {
    // Request notification permission on mount
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // Load existing notifications from API
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/announcements?limit=20')
      if (response.ok) {
        const announcements = await response.json()
        const notificationList: Notification[] = announcements.map((ann: any) => ({
          id: ann.id,
          message: ann.message,
          type: 'announcement',
          timestamp: new Date(ann.createdAt),
          read: false // Mark existing notifications as unread initially
        }))
        setNotifications(notificationList)
        setUnreadCount(notificationList.length)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })))
    setUnreadCount(0)
  }

  const clearNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
    setUnreadCount(prev => {
      const notification = notifications.find(n => n.id === notificationId)
      return notification && !notification.read ? Math.max(0, prev - 1) : prev
    })
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-blue-50"
      >
        <Bell className="h-5 w-5 text-blue-600" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 z-50">
          <Card className="shadow-lg border-blue-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-blue-800">Notifications</CardTitle>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="p-1"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                        !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`text-sm ${!notification.read ? 'font-semibold text-blue-900' : 'text-gray-700'}`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notification.timestamp.toLocaleString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            clearNotification(notification.id)
                          }}
                          className="p-1 ml-2"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
