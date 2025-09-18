import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { verifyDatabaseAccess, isDatabaseExportEnabled } from '@/lib/database-auth'

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyDatabaseAccess(request)
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    // Check if database export is enabled
    if (!isDatabaseExportEnabled()) {
      return NextResponse.json({ error: 'Database export is disabled' }, { status: 403 })
    }

    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
    
    try {
      const dbFile = await fs.readFile(dbPath)
      
      const headers = new Headers()
      headers.set('Content-Type', 'application/octet-stream')
      headers.set('Content-Disposition', `attachment; filename="database-backup-${new Date().toISOString().split('T')[0]}.db"`)
      headers.set('Content-Length', dbFile.length.toString())

      return new NextResponse(dbFile, {
        status: 200,
        headers
      })
    } catch (fileError) {
      console.error('Database file not found:', fileError)
      return NextResponse.json(
        { error: 'Database file not found' },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('Database export error:', error)
    return NextResponse.json(
      { error: 'Failed to export database' },
      { status: 500 }
    )
  }
}
