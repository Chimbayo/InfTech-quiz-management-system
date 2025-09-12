'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SessionUser } from '@/lib/auth'

interface SessionContextType {
  user: SessionUser | null
  isLoading: boolean
  checkSession: () => Promise<void>
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const checkSession = async () => {
    try {
      setIsLoading(true)
      // Check if we have a session by making a request to a protected endpoint
      const response = await fetch('/api/auth/check-session', {
        method: 'GET',
        credentials: 'include',
      })
      
      if (response.ok) {
        const sessionData = await response.json()
        setUser(sessionData.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Session check failed:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkSession()
  }, [])

  return (
    <SessionContext.Provider value={{ user, isLoading, checkSession }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}
