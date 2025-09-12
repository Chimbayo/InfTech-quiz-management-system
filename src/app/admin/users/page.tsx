import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { UsersManagement } from '@/components/admin/users-management'
import { UserRole } from '@/types'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  try {
    const session = await requireRole('ADMIN')
    
    return (
      <UsersManagement user={session} />
    )
  } catch (error) {
    console.error('Authentication error in users page:', error)
    // Only redirect if it's actually an authentication error
    if (error instanceof Error && error.message.includes('Authentication required')) {
      redirect('/admin')
    }
    // For other errors, redirect to login as fallback
    redirect('/admin')
  }
}
