'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Database, ExternalLink, Shield, AlertTriangle, RefreshCw, Download, Upload } from 'lucide-react'

export default function DatabaseManagementPage() {
  const [isStudioRunning, setIsStudioRunning] = useState(false)
  const [dbStats, setDbStats] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkStudioStatus()
    fetchDbStats()
  }, [])

  const checkStudioStatus = async () => {
    try {
      const response = await fetch('/api/admin/database/studio')
      const data = await response.json()
      setIsStudioRunning(data.running)
    } catch (error) {
      console.error('Failed to check studio status:', error)
    }
  }

  const fetchDbStats = async () => {
    try {
      const response = await fetch('/api/admin/database/stats')
      const data = await response.json()
      setDbStats(data)
    } catch (error) {
      console.error('Failed to fetch database stats:', error)
    }
  }

  const startPrismaStudio = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/database/studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      if (response.ok) {
        setIsStudioRunning(true)
        // Open Prisma Studio in new tab
        window.open(data.url, '_blank')
      }
    } catch (error) {
      console.error('Failed to start Prisma Studio:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportDatabase = async () => {
    try {
      const response = await fetch('/api/admin/database/export')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `database-backup-${new Date().toISOString().split('T')[0]}.db`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to export database:', error)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold heading-inftech-admin mb-2">Database Management</h1>
        <p className="text-slate-600">Manage and view your production database data</p>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {/* Prisma Studio Card */}
        <Card className="card-inftech">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Database className="h-6 w-6 text-emerald-600" />
              Prisma Studio (Production)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Security Notice</p>
                  <p className="text-sm text-amber-700">
                    This provides direct access to production data. Only use with proper authentication.
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-slate-600">
                  Access Prisma Studio to view and edit database records directly.
                </p>
                <ul className="text-sm text-slate-500 space-y-1">
                  <li>• View all tables and relationships</li>
                  <li>• Edit records with a visual interface</li>
                  <li>• Run queries and filters</li>
                  <li>• Export data as needed</li>
                </ul>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3">
                  <Button 
                    onClick={startPrismaStudio}
                    className="btn-inftech-success flex-1"
                    disabled={isStudioRunning || loading}
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ExternalLink className="h-4 w-4 mr-2" />
                    )}
                    {isStudioRunning ? 'Studio Running' : 'Launch Prisma Studio'}
                  </Button>
                  <Button 
                    onClick={exportDatabase}
                    variant="outline"
                    className="btn-inftech-secondary"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export DB
                  </Button>
                </div>
                <Button 
                  onClick={() => window.open('/admin/database/viewer', '_blank')}
                  variant="outline"
                  className="w-full btn-inftech-primary"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Open Web Database Viewer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Stats Card */}
        <Card className="card-inftech">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-blue-600" />
              Database Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <h4 className="font-medium text-slate-800 mb-2">Database Type</h4>
                <p className="text-slate-600">SQLite</p>
              </div>
              <div>
                <h4 className="font-medium text-slate-800 mb-2">Total Users</h4>
                <p className="text-slate-600">{dbStats?.users || 'Loading...'}</p>
              </div>
              <div>
                <h4 className="font-medium text-slate-800 mb-2">Total Quizzes</h4>
                <p className="text-slate-600">{dbStats?.quizzes || 'Loading...'}</p>
              </div>
              <div>
                <h4 className="font-medium text-slate-800 mb-2">Quiz Submissions</h4>
                <p className="text-slate-600">{dbStats?.submissions || 'Loading...'}</p>
              </div>
              <div>
                <h4 className="font-medium text-slate-800 mb-2">Chat Messages</h4>
                <p className="text-slate-600">{dbStats?.messages || 'Loading...'}</p>
              </div>
              <div>
                <h4 className="font-medium text-slate-800 mb-2">Database Size</h4>
                <p className="text-slate-600">{dbStats?.size || 'Loading...'}</p>
              </div>
              <div>
                <h4 className="font-medium text-slate-800 mb-2">Last Backup</h4>
                <p className="text-slate-600">{dbStats?.lastBackup || 'Never'}</p>
              </div>
              <div>
                <h4 className="font-medium text-slate-800 mb-2">Studio Status</h4>
                <p className={`font-medium ${isStudioRunning ? 'text-green-600' : 'text-slate-600'}`}>
                  {isStudioRunning ? 'Running' : 'Stopped'}
                </p>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-slate-800 mb-1">Quick Actions</h4>
                  <p className="text-sm text-slate-600">Manage your database efficiently</p>
                </div>
                <Button 
                  onClick={fetchDbStats}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Stats
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
