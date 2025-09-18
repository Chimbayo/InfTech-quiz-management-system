import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'

export async function verifyDatabaseAccess(request: NextRequest) {
  try {
    // Check if database admin access is enabled
    if (process.env.ADMIN_DATABASE_ACCESS !== 'true') {
      return { authorized: false, error: 'Database access is disabled' }
    }

    // Check if admin authentication is required
    if (process.env.REQUIRE_ADMIN_AUTH === 'true') {
      const session = await getSession()
      
      if (!session) {
        return { authorized: false, error: 'Authentication required' }
      }

      if (session.role !== 'ADMIN') {
        return { authorized: false, error: 'Admin access required' }
      }
    }

    // Check for admin access key if provided
    const accessKey = request.headers.get('x-admin-key')
    const requiredKey = process.env.DB_ADMIN_ACCESS_KEY

    if (requiredKey && accessKey !== requiredKey) {
      return { authorized: false, error: 'Invalid access key' }
    }

    return { authorized: true }
  } catch (error) {
    console.error('Database auth error:', error)
    return { authorized: false, error: 'Authentication failed' }
  }
}

export function isDatabaseExportEnabled(): boolean {
  return process.env.DATABASE_EXPORT_ENABLED === 'true'
}

export function isDatabaseBackupEnabled(): boolean {
  return process.env.DATABASE_BACKUP_ENABLED === 'true'
}

export function getPrismaStudioConfig() {
  return {
    port: process.env.PRISMA_STUDIO_PORT || '5555',
    host: process.env.PRISMA_STUDIO_HOST || 'localhost'
  }
}
