import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Users, BarChart3, Settings } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-professional-gradient">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Quiz Management System
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Professional quiz creation and assessment platform for educators and students
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="card-professional card-professional-hover">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Student Portal</CardTitle>
                  <CardDescription className="text-gray-600">
                    Take quizzes and track your progress
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                Access available quizzes, attempt them, and view your scores and detailed feedback.
              </p>
              <div className="space-y-3">
                <Link href="/student">
                  <Button className="w-full btn-primary-professional">
                    Student Login
                  </Button>
                </Link>
                <Link href="/student/register">
                  <Button variant="outline" className="w-full btn-secondary-professional">
                    Dont have acoount? Create
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="card-professional card-professional-hover">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Admin Portal</CardTitle>
                  <CardDescription className="text-gray-600">
                    Create and manage assessments
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                Create comprehensive quizzes with multiple question types, 
                set passing criteria, and analyze detailed performance results.
              </p>
              <Link href="/admin">
                <Button className="w-full btn-primary-professional">
                  Admin Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Key Features</h2>
          <p className="text-gray-600 mb-12 max-w-2xl mx-auto">
            Everything you need for professional quiz management and assessment
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="card-professional text-center p-8">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Quiz Creation</h3>
              <p className="text-gray-600">
                Create comprehensive quizzes with multiple question types, correct answer marking, and customizable settings.
              </p>
            </Card>
            <Card className="card-professional text-center p-8">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Performance Analytics</h3>
              <p className="text-gray-600">
                Track student performance with detailed insights, score analysis, and comprehensive reporting.
              </p>
            </Card>
            <Card className="card-professional text-center p-8">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">User Management</h3>
              <p className="text-gray-600">
                Secure role-based access control for administrators and students with professional authentication.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
