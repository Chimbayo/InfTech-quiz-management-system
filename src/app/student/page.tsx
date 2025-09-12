import { LoginForm } from '@/components/auth/login-form'
import { Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function StudentLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Portal</h1>
          <p className="text-gray-600">
            Access your student dashboard to take quizzes and view results
          </p>
        </div>

        <LoginForm role="STUDENT" redirectTo="/student/dashboard" />

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-4">
            Don't have an account?{' '}
            <Link href="/student/register" className="text-blue-600 hover:underline font-medium">
              Create Account here
            </Link>
          </p>
          <Link href="/">
            <Button variant="ghost" className="text-gray-600">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
