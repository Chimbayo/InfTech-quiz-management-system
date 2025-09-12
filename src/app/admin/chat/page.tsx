import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { ChatManagement } from '@/components/admin/chat-management'

export default async function AdminChatPage() {
  try {
    const session = await requireRole('ADMIN')
    
    return <ChatManagement />
  } catch (error) {
    console.error('Authentication error in admin chat dashboard:', error)
    redirect('/admin')
  }
}
