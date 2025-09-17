import { LoginForm } from '@/components/auth/login-form'
import { Settings, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-inftech-admin flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-600 to-green-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-all duration-300">
              <Settings className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold heading-inftech-admin mb-4">Admin Portal</h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Access the comprehensive admin dashboard to create quizzes, manage students, and analyze performance data
          </p>
        </div>

        <div className="card-inftech card-inftech-success p-8">
          <LoginForm role="ADMIN" redirectTo="/admin/dashboard" />
        </div>

        <div className="mt-8 text-center">
          <Link href="/">
            <Button variant="ghost" className="btn-inftech-secondary">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
