import { NextRequest, NextResponse } from 'next/server'
import { initializeWebSocket, NextApiResponseWithSocket } from '@/lib/websocket'
import { getBroadcastInstance } from '@/lib/realtime-broadcast'

export async function GET(req: NextRequest) {
  try {
    // Initialize WebSocket server
    const res = new NextResponse('WebSocket initialized') as any
    const io = initializeWebSocket(res as NextApiResponseWithSocket)
    
    // Store IO instance globally for API routes
    ;(global as any).io = io
    
    // Initialize broadcast instance
    getBroadcastInstance(io)
    
    return new Response('WebSocket server initialized', { status: 200 })
  } catch (error) {
    console.error('WebSocket initialization error:', error)
    return new Response('WebSocket initialization failed', { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  return GET(req)
}
