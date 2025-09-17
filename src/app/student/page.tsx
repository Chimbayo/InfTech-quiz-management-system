import { LoginForm } from '@/components/auth/login-form'
import { Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function StudentLoginPage() {
  return (
    <div className="min-h-screen bg-inftech-student flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-all duration-300">
              <Users className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold heading-inftech-primary mb-4">Student Portal</h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Access your personalized dashboard to take quizzes, join study groups, and track your academic progress
          </p>
        </div>

        <div className="card-inftech card-inftech-primary p-8">
          <LoginForm role="STUDENT" redirectTo="/student/dashboard" />
        </div>

        <div className="mt-8 text-center">
          <p className="text-base text-slate-600 mb-6">
            Don't have an account?{' '}
            <Link href="/student/register" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors">
              Create Account Here
            </Link>
          </p>
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
