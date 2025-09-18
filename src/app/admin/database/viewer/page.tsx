'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Database, Users, BookOpen, MessageSquare, BarChart3, RefreshCw } from 'lucide-react'

interface DatabaseRecord {
  [key: string]: any
}

interface TableData {
  name: string
  count: number
  records: DatabaseRecord[]
}

export default function DatabaseViewerPage() {
  const [tables, setTables] = useState<TableData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTable, setActiveTable] = useState('users')

  useEffect(() => {
    fetchTableData()
  }, [])

  const fetchTableData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/database/viewer')
      const data = await response.json()
      setTables(data.tables || [])
    } catch (error) {
      console.error('Failed to fetch table data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTableIcon = (tableName: string) => {
    switch (tableName.toLowerCase()) {
      case 'users':
        return <Users className="h-4 w-4" />
      case 'quizzes':
        return <BookOpen className="h-4 w-4" />
      case 'chatrooms':
      case 'chatmessages':
        return <MessageSquare className="h-4 w-4" />
      case 'quizattempts':
        return <BarChart3 className="h-4 w-4" />
      default:
        return <Database className="h-4 w-4" />
    }
  }

  const formatValue = (value: any) => {
    if (value === null) return <span className="text-gray-400">null</span>
    if (typeof value === 'boolean') return value ? 'true' : 'false'
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 50) + '...'
    }
    return String(value)
  }

  const activeTableData = tables.find(t => t.name === activeTable)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold heading-inftech-admin mb-2">Database Viewer</h1>
            <p className="text-slate-600">Browse and view your database records</p>
          </div>
          <Button onClick={fetchTableData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg">Loading database tables...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Table Overview Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tables.map((table) => (
              <Card 
                key={table.name}
                className={`cursor-pointer transition-all duration-200 ${
                  activeTable === table.name 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setActiveTable(table.name)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTableIcon(table.name)}
                      <span className="font-medium capitalize">{table.name}</span>
                    </div>
                    <Badge variant="secondary">{table.count}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Table Data Display */}
          {activeTableData && (
            <Card className="card-inftech">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getTableIcon(activeTableData.name)}
                  <span className="capitalize">{activeTableData.name} Table</span>
                  <Badge variant="outline">{activeTableData.count} records</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeTableData.records.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No records found in this table
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          {Object.keys(activeTableData.records[0] || {}).map((key) => (
                            <th key={key} className="text-left p-3 font-medium text-gray-700 bg-gray-50">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {activeTableData.records.slice(0, 10).map((record, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            {Object.entries(record).map(([key, value]) => (
                              <td key={key} className="p-3 text-sm">
                                {formatValue(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {activeTableData.records.length > 10 && (
                      <div className="mt-4 text-center text-sm text-gray-500">
                        Showing first 10 of {activeTableData.records.length} records
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
