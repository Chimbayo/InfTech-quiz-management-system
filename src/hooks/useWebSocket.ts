import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

export function useWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const connectSocket = () => {
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

      return socketInstance
    }

    const socketInstance = connectSocket()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      socketInstance.close()
    }
  }, [])

  return { socket, isConnected }
}
