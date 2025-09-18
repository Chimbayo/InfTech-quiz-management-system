import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { verifyDatabaseAccess, getPrismaStudioConfig } from '@/lib/database-auth'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyDatabaseAccess(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    // Get Prisma Studio configuration
    const studioConfig = getPrismaStudioConfig()
    const studioPort = studioConfig.port
    
    // Check if studio is already running
    try {
      const response = await fetch(`http://localhost:${studioPort}`)
      if (response.ok) {
        return NextResponse.json({ 
          success: true, 
          message: 'Prisma Studio is already running',
          url: `http://localhost:${studioPort}`
        })
      }
    } catch (error) {
      // Studio not running, start it
    }

    // Start Prisma Studio
    const command = `npx prisma studio --port ${studioPort} --browser none`
    
    // Run in background
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Error starting Prisma Studio:', error)
        return
      }
      console.log('Prisma Studio started:', stdout)
    })

    // Wait a moment for studio to start
    await new Promise(resolve => setTimeout(resolve, 3000))

    return NextResponse.json({ 
      success: true, 
      message: 'Prisma Studio started successfully',
      url: `http://localhost:${studioPort}`
    })

  } catch (error) {
    console.error('Database studio error:', error)
    return NextResponse.json(
      { error: 'Failed to start database studio' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const studioPort = process.env.PRISMA_STUDIO_PORT || '5556'
    
    // Check if studio is running
    try {
      const response = await fetch(`http://localhost:${studioPort}`)
      return NextResponse.json({ 
        running: response.ok,
        url: `http://localhost:${studioPort}`
      })
    } catch (error) {
      return NextResponse.json({ 
        running: false,
        url: null
      })
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check studio status' },
      { status: 500 }
    )
  }
}
