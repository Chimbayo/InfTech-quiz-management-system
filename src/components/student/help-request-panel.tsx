'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  HelpCircle, 
  Plus, 
  MessageCircle, 
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  BookOpen
} from 'lucide-react'

interface HelpRequest {
  id: string
  topic: string
  question: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
  quiz: {
    id: string
    title: string
  }
  responses: {
    id: string
    response: string
    createdAt: string
    responder: {
      id: string
      name: string
      role: string
    }
  }[]
}

interface Quiz {
  id: string
  title: string
}

interface HelpRequestPanelProps {
  userId: string
  selectedQuizId?: string
}

export function HelpRequestPanel({ userId, selectedQuizId }: HelpRequestPanelProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [requests, setRequests] = useState<HelpRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    quizId: selectedQuizId || '',
    topic: '',
    question: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH'
  })
  const [filterQuizId, setFilterQuizId] = useState<string>('all')

  useEffect(() => {
    fetchHelpRequests()
    fetchQuizzes()
  }, [])

  const fetchQuizzes = async () => {
    try {
      const response = await fetch('/api/quizzes')
      if (response.ok) {
        const data = await response.json()
        setQuizzes(data)
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error)
    }
  }

  const fetchHelpRequests = async () => {
    try {
      const response = await fetch('/api/help-requests')
      if (response.ok) {
        const data = await response.json()
        setRequests(data)
      }
    } catch (error) {
      console.error('Error fetching help requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createHelpRequest = async () => {
    try {
      const response = await fetch('/api/help-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const newRequest = await response.json()
        setRequests(prev => [newRequest, ...prev])
        setIsCreateDialogOpen(false)
        setFormData({
          quizId: selectedQuizId || '',
          topic: '',
          question: '',
          priority: 'MEDIUM'
        })
      }
    } catch (error) {
      console.error('Error creating help request:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-orange-100 text-orange-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'RESOLVED': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN': return <Clock className="h-4 w-4" />
      case 'IN_PROGRESS': return <MessageCircle className="h-4 w-4" />
      case 'RESOLVED': return <CheckCircle className="h-4 w-4" />
      default: return <HelpCircle className="h-4 w-4" />
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'HIGH': return <AlertTriangle className="h-4 w-4" />
      case 'MEDIUM': return <HelpCircle className="h-4 w-4" />
      case 'LOW': return <Clock className="h-4 w-4" />
      default: return <HelpCircle className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading help requests...</span>
      </div>
    )
  }

  // Filter requests based on selected quiz
  const filteredRequests = filterQuizId === 'all' 
    ? requests 
    : requests.filter(request => request.quiz.id === filterQuizId)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Question Clarification</h3>
          <p className="text-gray-600">Get help from peers and teachers on quiz topics</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Ask for Help
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Request Help</DialogTitle>
              <DialogDescription>
                Ask a question about a quiz topic and get help from peers and teachers
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="quiz">Related Quiz</Label>
                <Select value={formData.quizId} onValueChange={(value) => setFormData(prev => ({ ...prev, quizId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a quiz" />
                  </SelectTrigger>
                  <SelectContent>
                    {quizzes.map((quiz) => (
                      <SelectItem key={quiz.id} value={quiz.id}>
                        {quiz.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  value={formData.topic}
                  onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                  placeholder="e.g., Quadratic Equations, JavaScript Functions"
                />
              </div>
              
              <div>
                <Label htmlFor="question">Your Question</Label>
                <Textarea
                  id="question"
                  value={formData.question}
                  onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="Describe what you need help with..."
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH') => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low - General question</SelectItem>
                    <SelectItem value="MEDIUM">Medium - Need clarification</SelectItem>
                    <SelectItem value="HIGH">High - Urgent help needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createHelpRequest} disabled={!formData.quizId || !formData.topic || !formData.question}>
                Submit Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quiz Filter */}
      <div className="flex items-center gap-4">
        <Label htmlFor="quiz-filter" className="text-sm font-medium">Filter by Quiz:</Label>
        <Select value={filterQuizId} onValueChange={setFilterQuizId}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Quizzes</SelectItem>
            {quizzes.map((quiz) => (
              <SelectItem key={quiz.id} value={quiz.id}>
                {quiz.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="outline" className="ml-2">
          {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid gap-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Help Requests</h4>
              <p className="text-gray-600 mb-4">Ask your first question to get help from peers and teachers</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ask for Help
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                      {request.topic}
                      <Badge className={getPriorityColor(request.priority)}>
                        {getPriorityIcon(request.priority)}
                        <span className="ml-1">{request.priority}</span>
                      </Badge>
                      <Badge className={getStatusColor(request.status)}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1">{request.status.replace('_', ' ')}</span>
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Quiz: {request.quiz.title}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="mb-4">
                  <p className="text-gray-700">{request.question}</p>
                </div>
                
                {request.responses.length > 0 && (
                  <div className="space-y-3 mb-4">
                    <h5 className="font-medium text-gray-900 flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Responses ({request.responses.length})
                    </h5>
                    {request.responses.map((response) => (
                      <div key={response.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-sm">{response.responder.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {response.responder.role}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(response.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{response.response}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Asked by {request.user.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {new Date(request.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
