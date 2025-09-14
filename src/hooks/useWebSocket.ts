import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface UseWebSocketProps {
  userId?: string
  roomId?: string
  userRole?: string
  userName?: string
}

export function useWebSocket(props?: UseWebSocketProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([])
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  const connect = useCallback(() => {
    if (socket && socket.connected) return

    // Initialize socket connection
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin, {
      path: '/api/socketio',
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      forceNew: true
    })

    socketInstance.on('connect', () => {
      console.log('Connected to server')
      setIsConnected(true)
      // Clear any reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    })

    socketInstance.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason)
      setIsConnected(false)
      
      // Attempt to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Attempting to reconnect...')
        socketInstance.connect()
      }, 3000)
    })

    socketInstance.on('connect_error', (error) => {
      console.error('Connection error:', error)
      setIsConnected(false)
    })

    setSocket(socketInstance)
  }, [socket])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (socket) {
        socket.close()
      }
    }
  }, [connect])

  // Event listener helpers
  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (socket) {
      socket.on(event, callback)
    }
  }, [socket])

  const off = useCallback((event: string, callback?: (...args: any[]) => void) => {
    if (socket) {
      if (callback) {
        socket.off(event, callback)
      } else {
        socket.off(event)
      }
    }
  }, [socket])

  // Study session helpers
  const joinStudySession = useCallback((sessionId: string, userId?: string) => {
    if (socket && isConnected) {
      socket.emit('join-study-session', { sessionId, userId: userId || props?.userId })
    }
  }, [socket, isConnected, props?.userId])

  const leaveStudySession = useCallback((sessionId: string, userId?: string) => {
    if (socket && isConnected) {
      socket.emit('leave-study-session', { sessionId, userId: userId || props?.userId })
    }
  }, [socket, isConnected, props?.userId])

  const sendStudySessionUpdate = useCallback((sessionId: string, updateType: string, content: string, userId?: string) => {
    if (socket && isConnected) {
      socket.emit('study-session-update', { 
        sessionId, 
        updateType, 
        content, 
        userId: userId || props?.userId 
      })
    }
  }, [socket, isConnected, props?.userId])

  return { 
    socket, 
    isConnected, 
    connect,
    on, 
    off,
    joinStudySession,
    leaveStudySession,
    sendStudySessionUpdate,
    recentAnnouncements
  }
}
