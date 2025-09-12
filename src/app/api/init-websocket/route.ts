import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Initialize WebSocket by calling the socketio endpoint
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.NEXTAUTH_URL || 'https://your-domain.com'
      : 'http://localhost:3000'
    
    const response = await fetch(`${baseUrl}/api/socketio`, {
      method: 'GET'
    })
    
    if (response.ok) {
      return NextResponse.json({ 
        success: true, 
        message: 'WebSocket server initialized successfully' 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to initialize WebSocket server' 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('WebSocket initialization error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'WebSocket initialization failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
