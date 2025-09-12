'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'

interface WebSocketContextType {
  isConnected: boolean
  initializeConnection: () => void
}

const WebSocketContext = createContext<WebSocketContextType | null>(null)

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)
  const { isConnected, connect } = useWebSocket()

  const initializeConnection = async () => {
    if (isInitialized) return

    try {
      // Initialize WebSocket server
      await fetch('/api/init-websocket', { method: 'GET' })
      
      // Connect client
      connect()
      setIsInitialized(true)
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error)
    }
  }

  useEffect(() => {
    // Auto-initialize on mount
    initializeConnection()
  }, [])

  return (
    <WebSocketContext.Provider value={{ isConnected, initializeConnection }}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider')
  }
  return context
}
