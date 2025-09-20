import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

/**
 * Debug endpoint to check authentication status
 * GET /api/debug/auth
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({
        authenticated: false,
        message: 'No active session found'
      })
    }
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.id,
        name: session.name,
        email: session.email,
        role: session.role
      },
      message: 'Authentication successful'
    })
    
  } catch (error) {
    console.error('Auth debug error:', error)
    return NextResponse.json({
      authenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Authentication check failed'
    }, { status: 500 })
  }
}
