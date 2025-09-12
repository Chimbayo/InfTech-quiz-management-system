import { cookies } from 'next/headers'
import { UserRole } from '@/types'

export interface SessionUser {
  id: string
  email: string
  name: string
  role: UserRole
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('user-session')
    
    if (!sessionCookie || !sessionCookie.value) {
      return null
    }

    // Validate that the cookie value is not empty or malformed
    if (sessionCookie.value.trim() === '') {
      return null
    }

    const session = JSON.parse(sessionCookie.value)
    
    // Validate that the session has required fields
    if (!session || !session.id || !session.email || !session.name || !session.role) {
      console.warn('Invalid session structure:', session)
      return null
    }

    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) {
    throw new Error('Authentication required')
  }
  return session
}

export async function requireRole(role: UserRole): Promise<SessionUser> {
  const session = await requireAuth()
  if (session.role !== role) {
    throw new Error(`Access denied. Required role: ${role}`)
  }
  return session
}
