'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Megaphone, 
  Send, 
  Clock, 
  Users, 
  BookOpen,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

interface Quiz {
  id: string
  title: string
  isActive: boolean
}

interface Announcement {
  id: string
  message: string
  type: string
  quizId?: string
  createdAt: string
  sender: {
    name: string
    role: string
  }
  quiz?: {
    title: string
  }
}

export function QuizAnnouncementManager() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedQuiz, setSelectedQuiz] = useState<string>('')
  const [announcementType, setAnnouncementType] = useState<string>('GENERAL')

  useEffect(() => {
    fetchQuizzes()
    fetchAnnouncements()
  }, [])

  const fetchQuizzes = async () => {
    try {
      const response = await fetch('/api/quizzes?role=admin')
      if (response.ok) {
        const data = await response.json()
        setQuizzes(data)
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error)
    }
  }

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/announcements?limit=20')
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data)
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const sendAnnouncement = async () => {
    if (!message.trim()) return

    setIsSending(true)
    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message.trim(),
          type: announcementType,
          quizId: selectedQuiz || undefined
        })
      })

      if (response.ok) {
        setMessage('')
        setSelectedQuiz('')
        setAnnouncementType('GENERAL')
        fetchAnnouncements()
        
        // Show success message
        alert('Announcement sent successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to send announcement: ${error.error}`)
      }
    } catch (error) {
      console.error('Error sending announcement:', error)
      alert('Failed to send announcement')
    } finally {
      setIsSending(false)
    }
  }

  const getAnnouncementTypeColor = (type: string) => {
    switch (type) {
      case 'QUIZ_SPECIFIC': return 'bg-blue-100 text-blue-800'
      case 'URGENT': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case 'QUIZ_SPECIFIC': return <BookOpen className="h-4 w-4" />
      case 'URGENT': return <AlertTriangle className="h-4 w-4" />
      default: return <Megaphone className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Send New Announcement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Send Quiz Announcement
          </CardTitle>
          <CardDescription>
            Broadcast important information to all students about quizzes or general updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="announcementType">Announcement Type</Label>
              <Select value={announcementType} onValueChange={setAnnouncementType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">General Announcement</SelectItem>
                  <SelectItem value="QUIZ_SPECIFIC">Quiz-Specific</SelectItem>
                  <SelectItem value="URGENT">Urgent Notice</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {announcementType === 'QUIZ_SPECIFIC' && (
              <div>
                <Label htmlFor="selectedQuiz">Select Quiz</Label>
                <Select value={selectedQuiz} onValueChange={setSelectedQuiz}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a quiz" />
                  </SelectTrigger>
                  <SelectContent>
                    {quizzes.map(quiz => (
                      <SelectItem key={quiz.id} value={quiz.id}>
                        {quiz.title} {!quiz.isActive && '(Inactive)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="message">Announcement Message</Label>
            <Textarea
              id="message"
              placeholder="Enter your announcement message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              {message.length}/500 characters
            </p>
          </div>

          {/* Preview */}
          {message.trim() && (
            <Alert>
              <Megaphone className="h-4 w-4" />
              <AlertDescription>
                <strong>Preview:</strong> 📢 {announcementType === 'QUIZ_SPECIFIC' && selectedQuiz 
                  ? `New announcement about "${quizzes.find(q => q.id === selectedQuiz)?.title}": `
                  : 'General announcement: '
                }{message}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button 
              onClick={sendAnnouncement}
              disabled={!message.trim() || isSending || (announcementType === 'QUIZ_SPECIFIC' && !selectedQuiz)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSending ? 'Sending...' : 'Send Announcement'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Announcement Templates</CardTitle>
          <CardDescription>
            Use these pre-made templates for common announcements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => setMessage('New quiz available! Check your dashboard to get started.')}
              className="h-auto p-4 text-left"
            >
              <div>
                <div className="font-semibold">New Quiz Available</div>
                <div className="text-xs text-gray-500">Notify about new quiz</div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => setMessage('Quiz deadline reminder: Don\'t forget to complete your assigned quiz before the deadline.')}
              className="h-auto p-4 text-left"
            >
              <div>
                <div className="font-semibold">Deadline Reminder</div>
                <div className="text-xs text-gray-500">Remind about deadlines</div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => setMessage('Study group sessions are now available! Join your classmates for collaborative learning.')}
              className="h-auto p-4 text-left"
            >
              <div>
                <div className="font-semibold">Study Group Notice</div>
                <div className="text-xs text-gray-500">Promote study groups</div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => setMessage('Technical maintenance scheduled. The system may be temporarily unavailable.')}
              className="h-auto p-4 text-left"
            >
              <div>
                <div className="font-semibold">Maintenance Notice</div>
                <div className="text-xs text-gray-500">System maintenance</div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => setMessage('Great job on your recent quiz performance! Keep up the excellent work.')}
              className="h-auto p-4 text-left"
            >
              <div>
                <div className="font-semibold">Encouragement</div>
                <div className="text-xs text-gray-500">Motivate students</div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => setMessage('Chat rooms are now available for quiz discussions. Join the conversation!')}
              className="h-auto p-4 text-left"
            >
              <div>
                <div className="font-semibold">Chat Available</div>
                <div className="text-xs text-gray-500">Promote discussions</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Announcements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Announcements
          </CardTitle>
          <CardDescription>
            View previously sent announcements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading announcements...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8">
              <Megaphone className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Announcements Yet</h3>
              <p className="text-gray-600">Send your first announcement to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getAnnouncementIcon(announcement.type)}
                      <Badge className={getAnnouncementTypeColor(announcement.type)}>
                        {announcement.type.replace('_', ' ')}
                      </Badge>
                      {announcement.quiz && (
                        <Badge variant="outline">
                          {announcement.quiz.title}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(announcement.createdAt).toLocaleString()}
                    </span>
                  </div>
                  
                  <p className="text-gray-900 mb-2">{announcement.message}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Sent by {announcement.sender.name}</span>
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>Broadcast to all students</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
