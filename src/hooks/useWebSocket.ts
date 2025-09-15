import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface UseWebSocketProps {
  userId?: string
  roomId?: string
  userRole?: string
  userName?: string
}

// Global socket instance to prevent multiple connections
let globalSocket: Socket | null = null
let connectionCount = 0

export function useWebSocket(props?: UseWebSocketProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([])
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const baseReconnectDelay = 1000

  const connect = useCallback(() => {
    // Use existing global socket if available and connected
    if (globalSocket && globalSocket.connected) {
      setSocket(globalSocket)
      setIsConnected(true)
      return
    }

    // Prevent multiple simultaneous connection attempts
    if (globalSocket && !globalSocket.connected && globalSocket.disconnected === false) {
      setSocket(globalSocket)
      return
    }

    // Create new connection only if none exists
    if (!globalSocket) {
      console.log('Creating new WebSocket connection')
      globalSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin, {
        path: '/api/socketio',
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 20000,
        forceNew: false, // Don't force new connections
        reconnection: false // Disable automatic reconnection
      })

      globalSocket.on('connect', () => {
        console.log('Connected to server')
        reconnectAttempts.current = 0 // Reset attempts on successful connection
        setIsConnected(true)
        
        // Clear any reconnection timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
      })

      globalSocket.on('disconnect', (reason) => {
        console.log('Disconnected from server:', reason)
        setIsConnected(false)
        
        // Only attempt reconnection for certain reasons and within limits
        if (
          (reason === 'io server disconnect' || reason === 'transport close') &&
          reconnectAttempts.current < maxReconnectAttempts
        ) {
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts.current) // Exponential backoff
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting to reconnect... (${reconnectAttempts.current + 1}/${maxReconnectAttempts})`)
            reconnectAttempts.current++
            
            if (globalSocket) {
              globalSocket.connect()
            }
          }, delay)
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.log('Max reconnection attempts reached. Stopping reconnection.')
        }
      })

      globalSocket.on('connect_error', (error) => {
        console.error('Connection error:', error)
        setIsConnected(false)
      })
    }

    setSocket(globalSocket)
  }, [])

  useEffect(() => {
    connectionCount++
    connect()

    return () => {
      connectionCount--
      
      // Clear reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      
      // Only close the global socket when no components are using it
      if (connectionCount === 0 && globalSocket) {
        console.log('Closing global WebSocket connection')
        globalSocket.close()
        globalSocket = null
      }
    }
  }, [])

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
