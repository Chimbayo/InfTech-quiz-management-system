import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface UseWebSocketOptions {
  userId?: string
  userName?: string
  userRole?: string
  autoConnect?: boolean
}

interface WebSocketEvents {
  'quiz-status-update': (data: any) => void
  'quiz-announcement': (data: any) => void
  'study-progress-update': (data: any) => void
  'instructor-presence-update': (data: any) => void
  'study-session-update': (data: any) => void
  'participant-joined': (data: any) => void
  'participant-left': (data: any) => void
  'session-update': (data: any) => void
  'new-message': (data: any) => void
  'user-joined': (data: any) => void
  'user-left': (data: any) => void
  'user-typing': (data: any) => void
  'user-stop-typing': (data: any) => void
  'instructor-online': (data: any) => void
  'instructor-offline': (data: any) => void
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineInstructors, setOnlineInstructors] = useState<any[]>([])
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([])
  const eventListeners = useRef<Map<keyof WebSocketEvents, Function[]>>(new Map())

  const { userId, userName, userRole, autoConnect = true } = options

  useEffect(() => {
    if (!autoConnect) return

    const socketInstance = io(process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_SOCKET_URL || '' 
      : 'http://localhost:3000', {
      path: '/api/socketio',
      transports: ['websocket', 'polling']
    })

    socketInstance.on('connect', () => {
      console.log('Connected to WebSocket server')
      setIsConnected(true)
      
      // Authenticate user if credentials provided
      if (userId && userName && userRole) {
        socketInstance.emit('authenticate', { userId, name: userName, role: userRole })
      }
    })

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from WebSocket server')
      setIsConnected(false)
    })

    // Handle instructor presence updates
    socketInstance.on('instructor-online', (data) => {
      setOnlineInstructors(prev => {
        const exists = prev.find(instructor => instructor.userId === data.userId)
        if (!exists) {
          return [...prev, data]
        }
        return prev
      })
    })

    socketInstance.on('instructor-offline', (data) => {
      setOnlineInstructors(prev => 
        prev.filter(instructor => instructor.userId !== data.userId)
      )
    })

    // Handle quiz announcements
    socketInstance.on('quiz-announcement', (data) => {
      setRecentAnnouncements(prev => [data, ...prev.slice(0, 9)]) // Keep last 10
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [autoConnect, userId, userName, userRole])

  const on = <K extends keyof WebSocketEvents>(
    event: K,
    callback: WebSocketEvents[K]
  ) => {
    if (!socket) return

    socket.on(event as string, callback)

    // Store listener for cleanup
    const listeners = eventListeners.current.get(event) || []
    listeners.push(callback)
    eventListeners.current.set(event, listeners)
  }

  const off = <K extends keyof WebSocketEvents>(
    event: K,
    callback?: WebSocketEvents[K]
  ) => {
    if (!socket) return

    if (callback) {
      socket.off(event as string, callback)
      
      // Remove from stored listeners
      const listeners = eventListeners.current.get(event) || []
      const filtered = listeners.filter(listener => listener !== callback)
      eventListeners.current.set(event, filtered)
    } else {
      socket.off(event as string)
      eventListeners.current.delete(event)
    }
  }

  const emit = (event: string, data?: any) => {
    if (socket && isConnected) {
      socket.emit(event, data)
    }
  }

  const joinRoom = (roomId: string) => {
    emit('join-room', roomId)
  }

  const leaveRoom = (roomId: string) => {
    emit('leave-room', roomId)
  }

  const joinStudySession = (sessionId: string, userId: string) => {
    emit('join-study-session', { sessionId, userId })
  }

  const leaveStudySession = (sessionId: string, userId: string) => {
    emit('leave-study-session', { sessionId, userId })
  }

  const sendMessage = (roomId: string, message: string, user: any) => {
    emit('send-message', { roomId, message, user })
  }

  const sendTyping = (roomId: string, userName: string) => {
    emit('typing', { roomId, userName })
  }

  const stopTyping = (roomId: string, userName: string) => {
    emit('stop-typing', { roomId, userName })
  }

  const sendStudySessionUpdate = (sessionId: string, type: string, content: string, userId: string) => {
    emit('study-session-update', { sessionId, type, content, userId })
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      eventListeners.current.forEach((listeners, event) => {
        listeners.forEach(listener => {
          socket?.off(event as string, listener as any)
        })
      })
      eventListeners.current.clear()
    }
  }, [socket])

  return {
    socket,
    isConnected,
    onlineInstructors,
    recentAnnouncements,
    on,
    off,
    emit,
    joinRoom,
    leaveRoom,
    joinStudySession,
    leaveStudySession,
    sendMessage,
    sendTyping,
    stopTyping,
    sendStudySessionUpdate
  }
}
