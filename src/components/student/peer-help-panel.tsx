'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  HelpCircle, 
  MessageCircle, 
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  BookOpen,
  Send,
  Users,
  Calendar,
  MessageSquare,
  Heart,
  Award,
  Filter,
  RefreshCw
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

interface PeerHelpPanelProps {
  userId: string
}

export function PeerHelpPanel({ userId }: PeerHelpPanelProps) {
  const [requests, setRequests] = useState<HelpRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null)
  const [responseText, setResponseText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'OPEN' | 'IN_PROGRESS'>('OPEN')
  const [filterQuiz, setFilterQuiz] = useState<string>('all')
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false)
  const [quizzes, setQuizzes] = useState<any[]>([])

  useEffect(() => {
    fetchHelpRequests()
    fetchQuizzes()
  }, [])

  const fetchQuizzes = async () => {
    try {
      const response = await fetch('/api/quizzes?role=student')
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
      setLoading(true)
      // Fetch all help requests (not just user's own)
      const response = await fetch('/api/help-requests')
      if (response.ok) {
        const data = await response.json()
        // Filter out user's own requests and only show open/in-progress
        const peerRequests = data.filter((request: HelpRequest) => 
          request.user.id !== userId && 
          ['OPEN', 'IN_PROGRESS'].includes(request.status)
        )
        setRequests(peerRequests)
      }
    } catch (error) {
      console.error('Error fetching help requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const submitResponse = async () => {
    if (!selectedRequest || !responseText.trim()) return

    try {
      setSubmitting(true)
      const response = await fetch(`/api/help-requests/${selectedRequest.id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: responseText })
      })

      if (response.ok) {
        setResponseText('')
        setIsResponseDialogOpen(false)
        fetchHelpRequests() // Refresh the list
      }
    } catch (error) {
      console.error('Error submitting response:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'HIGH': return <AlertTriangle className="h-3 w-3" />
      case 'MEDIUM': return <Clock className="h-3 w-3" />
      case 'LOW': return <CheckCircle className="h-3 w-3" />
      default: return <HelpCircle className="h-3 w-3" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN': return <HelpCircle className="h-3 w-3" />
      case 'IN_PROGRESS': return <Clock className="h-3 w-3" />
      default: return <HelpCircle className="h-3 w-3" />
    }
  }

  const filteredRequests = requests.filter(request => {
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus
    const matchesQuiz = filterQuiz === 'all' || request.quiz.id === filterQuiz
    return matchesStatus && matchesQuiz
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading peer help requests...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Peer Help
          </h2>
          <p className="text-gray-600 mt-1">Help your fellow students and earn peer helper badges</p>
        </div>
        <Button onClick={fetchHelpRequests} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Award className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Earn Peer Helper Badges!</h3>
              <p className="text-sm text-blue-700 mt-1">
                Help your classmates by answering their questions. You'll earn badges and contribute to a collaborative learning environment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available to Help</p>
                <p className="text-2xl font-bold text-blue-600">{requests.filter(r => r.status === 'OPEN').length}</p>
              </div>
              <HelpCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Being Helped</p>
                <p className="text-2xl font-bold text-yellow-600">{requests.filter(r => r.status === 'IN_PROGRESS').length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
              </div>
              <Users className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>
        
        <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="OPEN">Need Help</SelectItem>
            <SelectItem value="IN_PROGRESS">Being Helped</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterQuiz} onValueChange={setFilterQuiz}>
          <SelectTrigger className="w-48">
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

        <Badge variant="outline" className="ml-auto">
          {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Help Requests List */}
      <div className="grid gap-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Heart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Help Requests</h4>
              <p className="text-gray-600">
                {filterStatus === 'OPEN' 
                  ? "Great! No classmates need help right now." 
                  : "No help requests match the current filters."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => {
            const safeRequest = {
              ...request,
              responses: request.responses || []
            }
            
            return (
              <Card key={request.id} className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
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
                          <span className="ml-1">{request.status === 'OPEN' ? 'Needs Help' : 'Being Helped'}</span>
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Quiz: {request.quiz.title} • Asked by: {request.user.name}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="mb-4">
                    <p className="text-gray-700">{request.question}</p>
                  </div>
                  
                  {safeRequest.responses && safeRequest.responses.length > 0 ? (
                    <div className="space-y-3 mb-4">
                      <h5 className="font-medium text-gray-900 flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Responses ({safeRequest.responses.length})
                      </h5>
                      {safeRequest.responses.slice(0, 2).map((response) => (
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
                      {safeRequest.responses.length > 2 && (
                        <p className="text-xs text-gray-500 text-center">
                          +{safeRequest.responses.length - 2} more responses
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 text-blue-700">
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Be the first to help!</span>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        Your classmate is waiting for assistance. Share your knowledge!
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      {new Date(request.createdAt).toLocaleDateString()}
                    </div>
                    
                    <Dialog 
                      open={isResponseDialogOpen && selectedRequest?.id === request.id} 
                      onOpenChange={(open) => {
                        setIsResponseDialogOpen(open)
                        if (open) setSelectedRequest(request)
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <Heart className="h-4 w-4 mr-1" />
                          Help Out
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Help Your Classmate</DialogTitle>
                          <DialogDescription>
                            Share your knowledge with {request.user.name} about "{request.topic}"
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2">Their Question:</h4>
                            <p className="text-gray-700">{request.question}</p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Your Helpful Response
                            </label>
                            <Textarea
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                              placeholder="Share your knowledge, provide hints, or explain concepts that might help..."
                              rows={4}
                              className="w-full"
                            />
                          </div>
                          
                          <Alert>
                            <Award className="h-4 w-4" />
                            <AlertDescription>
                              Helping peers earns you peer helper badges and contributes to your learning achievements!
                            </AlertDescription>
                          </Alert>
                          
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              onClick={() => setIsResponseDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={submitResponse}
                              disabled={!responseText.trim() || submitting}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              {submitting ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-2" />
                                  Send Help
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
