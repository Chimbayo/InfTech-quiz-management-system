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
  Calendar, 
  Clock, 
  Users, 
  Plus, 
  MapPin,
  UserPlus,
  CheckCircle,
  AlertCircle,
  Trash2
} from 'lucide-react'

interface StudySession {
  id: string
  name: string
  description?: string
  startTime: string
  studyGroupId?: string
  quizId?: string
  creator: {
    id: string
    name: string
    email: string
  }
  studyGroup?: {
    id: string
    name: string
  }
  quiz?: {
    id: string
    title: string
  }
  participants?: {
    user: {
      id: string
      name: string
      email: string
    }
  }[]
  _count?: {
    participants: number
  }
}

interface StudyGroup {
  id: string
  name: string
}

interface Quiz {
  id: string
  title: string
}

interface StudySchedulingPanelProps {
  studyGroups: StudyGroup[]
  userId: string
  selectedQuizId?: string
}

export function StudySchedulingPanel({ studyGroups, userId, selectedQuizId }: StudySchedulingPanelProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    duration: 60,
    studyGroupId: 'none',
    quizId: selectedQuizId || 'none',
    maxParticipants: 10
  })
  const [filterQuizId, setFilterQuizId] = useState<string>('all')

  useEffect(() => {
    fetchStudySessions()
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

  const fetchStudySessions = async () => {
    try {
      const response = await fetch('/api/study-sessions')
      if (response.ok) {
        const data = await response.json()
        setSessions(data)
      }
    } catch (error) {
      console.error('Error fetching study sessions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createStudySession = async () => {
    try {
      console.log('Creating study session with data:', formData)
      
      const sessionData = {
        ...formData,
        studyGroupId: formData.studyGroupId === 'none' ? null : formData.studyGroupId,
        quizId: formData.quizId === 'none' ? null : formData.quizId
      }

      console.log('Sending session data:', sessionData)

      const response = await fetch('/api/study-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      })

      console.log('Response status:', response.status)

      if (response.ok) {
        const newSession = await response.json()
        console.log('Created session:', newSession)
        setSessions(prev => [newSession, ...prev])
        setIsCreateDialogOpen(false)
        setFormData({
          title: '',
          description: '',
          scheduledAt: '',
          duration: 60,
          studyGroupId: 'none',
          quizId: selectedQuizId || 'none',
          maxParticipants: 10
        })
      } else {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        alert(`Error creating study session: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error creating study session:', error)
      alert(`Error creating study session: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const joinSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/study-sessions/${sessionId}/join`, {
        method: 'POST'
      })

      if (response.ok) {
        fetchStudySessions()
        alert('Successfully joined the study session!')
      } else {
        const errorData = await response.json()
        alert(`Error joining session: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error joining study session:', error)
      alert('Error joining study session')
    }
  }

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this study session? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/study-sessions/${sessionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchStudySessions()
        alert('Study session deleted successfully!')
      } else {
        const errorData = await response.json()
        alert(`Error deleting session: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting study session:', error)
      alert('Error deleting study session')
    }
  }

  const isUserParticipant = (session: StudySession) => {
    return session.participants?.some(p => p.user.id === userId) || false
  }

  const getSessionStatus = (session: StudySession) => {
    const now = new Date()
    const sessionTime = new Date(session.startTime)
    // Since duration is not stored in schema, assume 60 minutes default
    const sessionEnd = new Date(sessionTime.getTime() + 60 * 60000)

    if (now < sessionTime) return 'upcoming'
    if (now >= sessionTime && now <= sessionEnd) return 'active'
    return 'completed'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming': return <Clock className="h-4 w-4" />
      case 'active': return <CheckCircle className="h-4 w-4" />
      case 'completed': return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading study sessions...</span>
      </div>
    )
  }

  // Filter sessions based on selected quiz
  const filteredSessions = filterQuizId === 'all' 
    ? sessions 
    : sessions.filter(session => session.quiz?.id === filterQuizId)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Study Sessions</h3>
          <p className="text-gray-600">Schedule and join collaborative study sessions</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Session
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Schedule Study Session</DialogTitle>
              <DialogDescription>
                Create a new study session for your group or quiz preparation
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Session Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Math Quiz Prep Session"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What will you study together?"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduledAt">Date & Time</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    min="15"
                    max="300"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="studyGroup">Study Group (Optional)</Label>
                <Select value={formData.studyGroupId} onValueChange={(value) => setFormData(prev => ({ ...prev, studyGroupId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a study group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific group</SelectItem>
                    {studyGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="quiz">Related Quiz (Optional)</Label>
                <Select value={formData.quizId} onValueChange={(value) => setFormData(prev => ({ ...prev, quizId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a quiz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific quiz</SelectItem>
                    {quizzes.map((quiz) => (
                      <SelectItem key={quiz.id} value={quiz.id}>
                        {quiz.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="maxParticipants">Max Participants</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) }))}
                  min="2"
                  max="50"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createStudySession} disabled={!formData.title || !formData.scheduledAt}>
                Create Session
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
          {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid gap-4">
        {filteredSessions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Study Sessions</h4>
              <p className="text-gray-600 mb-4">Schedule your first study session to collaborate with peers</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Session
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredSessions.map((session) => {
            const status = getSessionStatus(session)
            const isParticipant = isUserParticipant(session)
            
            return (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {session.name}
                        <Badge className={getStatusColor(status)}>
                          {getStatusIcon(status)}
                          <span className="ml-1 capitalize">{status}</span>
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {session.description || 'Collaborative study session'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      {new Date(session.startTime).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      {new Date(session.startTime).toLocaleTimeString()} (60m)
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      {session._count?.participants || 0} participants
                    </div>
                  </div>
                  
                  {session.studyGroup && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 mb-2">
                      <MapPin className="h-4 w-4" />
                      Study Group: {session.studyGroup.name}
                    </div>
                  )}
                  
                  {session.quiz && (
                    <div className="flex items-center gap-2 text-sm text-purple-600 mb-4">
                      <CheckCircle className="h-4 w-4" />
                      Quiz: {session.quiz.title}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Organized by {session.creator.name}
                    </div>
                    
                    <div className="flex gap-2">
                      {!isParticipant && status === 'upcoming' && (
                        <Button
                          size="sm"
                          onClick={() => joinSession(session.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Join Session
                        </Button>
                      )}
                      
                      {session.creator.id === userId && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteSession(session.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                    
                    {isParticipant && (
                      <Badge className="bg-blue-100 text-blue-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Joined
                      </Badge>
                    )}
                    
                    {status === 'active' && isParticipant && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Join Now
                      </Button>
                    )}
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
