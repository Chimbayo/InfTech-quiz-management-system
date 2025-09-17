import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Users, BarChart3, Settings } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-inftech-gradient">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-all duration-300">
              <BookOpen className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-6xl font-bold heading-inftech-primary mb-6">
            QUIZ MANAGEMENT SYSTEM
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Professional quiz creation and assessment platform designed for modern educational excellence
          </p>
        </div>

        {/* Portal Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          <Card className="card-inftech card-inftech-hover card-inftech-primary">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl heading-inftech-primary">Student Portal</CardTitle>
                  <CardDescription className="text-slate-600 text-base">
                    Take quizzes and track your academic progress
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-8 text-lg leading-relaxed">
                Access comprehensive quizzes, participate in study discussions, and monitor your learning journey with detailed analytics.
              </p>
              <div className="space-y-4">
                <Link href="/student">
                  <Button className="w-full btn-inftech-primary">
                    Student Login
                  </Button>
                </Link>
                <Link href="/student/register">
                  <Button variant="outline" className="w-full btn-inftech-secondary">
                    Don't have an account? Create One
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="card-inftech card-inftech-hover card-inftech-success">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Settings className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl heading-inftech-admin">Admin Portal</CardTitle>
                  <CardDescription className="text-slate-600 text-base">
                    Create and manage comprehensive assessments
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-8 text-lg leading-relaxed">
                Design sophisticated quizzes, monitor student performance, and leverage advanced analytics for educational insights.
              </p>
              <Link href="/admin">
                <Button className="w-full btn-inftech-success">
                  Admin Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mt-24 text-center">
          <h2 className="text-4xl font-bold heading-inftech mb-6">Key Features</h2>
          <p className="text-xl text-slate-600 mb-16 max-w-3xl mx-auto leading-relaxed">
            Everything you need for professional quiz management and comprehensive educational assessment
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="card-inftech card-inftech-hover text-center p-8">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-violet-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl transform hover:scale-105 transition-all duration-300">
                <BookOpen className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold heading-inftech-primary mb-4">Advanced Quiz Creation</h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Design sophisticated quizzes with multiple question types, intelligent scoring, and real-time collaboration features.
              </p>
            </Card>
            <Card className="card-inftech card-inftech-hover text-center p-8">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl transform hover:scale-105 transition-all duration-300">
                <BarChart3 className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold heading-inftech-primary mb-4">Learning Analytics</h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Comprehensive performance tracking with predictive analytics, learning insights, and detailed progress reporting.
              </p>
            </Card>
            <Card className="card-inftech card-inftech-hover text-center p-8">
              <div className="w-20 h-20 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl transform hover:scale-105 transition-all duration-300">
                <Users className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold heading-inftech-primary mb-4">Collaborative Learning</h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Real-time chat discussions, study groups, and peer learning with advanced academic integrity monitoring.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
