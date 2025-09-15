'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar,
  Clock,
  MessageSquare,
  Shield,
  Users,
  CheckCircle,
  AlertTriangle,
  Settings
} from 'lucide-react'

interface ChatSettings {
  preQuizDiscussion: {
    enabled: boolean
    startTime: string | null
    endTime: string | null
    topics: string[]
  }
  postQuizDiscussion: {
    enabled: boolean
    startTime: string | null
    endTime: string | null
    allowAnswerSharing: boolean
  }
  duringQuizRestriction: {
    enabled: boolean
    allowedMessageTypes: string[]
    emergencyContactAllowed: boolean
  }
  allowedDiscussionTopics: string[]
}

interface DiscussionScheduleManagerProps {
  roomId: string
  quizTitle?: string
}

export function DiscussionScheduleManager({ roomId, quizTitle }: DiscussionScheduleManagerProps) {
  const [chatSettings, setChatSettings] = useState<ChatSettings>({
    preQuizDiscussion: {
      enabled: false,
      startTime: null,
      endTime: null,
      topics: []
    },
    postQuizDiscussion: {
      enabled: false,
      startTime: null,
      endTime: null,
      allowAnswerSharing: false
    },
    duringQuizRestriction: {
      enabled: true,
      allowedMessageTypes: [],
      emergencyContactAllowed: true
    },
    allowedDiscussionTopics: []
  })

  const [currentMode, setCurrentMode] = useState<string>('normal')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [newTopic, setNewTopic] = useState('')

  useEffect(() => {
    fetchDiscussionSchedule()
  }, [roomId])

  const fetchDiscussionSchedule = async () => {
    try {
      const response = await fetch(`/api/chat/discussion-schedule/${roomId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.chatSettings) {
          setChatSettings(data.chatSettings)
        }
        setCurrentMode(data.currentMode || 'normal')
      }
    } catch (error) {
      console.error('Error fetching discussion schedule:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveDiscussionSchedule = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/chat/discussion-schedule/${roomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(chatSettings)
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentMode(data.currentMode || 'normal')
        // Show success message
      }
    } catch (error) {
      console.error('Error saving discussion schedule:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const addTopic = () => {
    if (newTopic.trim() && !chatSettings.allowedDiscussionTopics.includes(newTopic.trim())) {
      setChatSettings(prev => ({
        ...prev,
        allowedDiscussionTopics: [...prev.allowedDiscussionTopics, newTopic.trim()]
      }))
      setNewTopic('')
    }
  }

  const removeTopic = (topic: string) => {
    setChatSettings(prev => ({
      ...prev,
      allowedDiscussionTopics: prev.allowedDiscussionTopics.filter(t => t !== topic)
    }))
  }

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'exam': return 'bg-red-100 text-red-800 border-red-200'
      case 'pre-quiz': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'post-quiz': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'exam': return <Shield className="h-4 w-4" />
      case 'pre-quiz': return <Calendar className="h-4 w-4" />
      case 'post-quiz': return <CheckCircle className="h-4 w-4" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Mode Status */}
      <Alert className={getModeColor(currentMode)}>
        <div className="flex items-center space-x-2">
          {getModeIcon(currentMode)}
          <div>
            <h4 className="font-semibold">
              Current Chat Mode: {currentMode.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h4>
            <p className="text-sm mt-1">
              {currentMode === 'exam' && 'Chat is restricted during quiz time'}
              {currentMode === 'pre-quiz' && 'Pre-quiz discussion period is active'}
              {currentMode === 'post-quiz' && 'Post-quiz discussion period is active'}
              {currentMode === 'normal' && 'Normal chat mode - no restrictions'}
            </p>
          </div>
        </div>
      </Alert>

      {/* Quiz Information */}
      {quizTitle && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Discussion Schedule for: {quizTitle}
            </CardTitle>
            <CardDescription>
              Configure when and how students can discuss quiz-related topics
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Pre-Quiz Discussion Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Pre-Quiz Discussion
          </CardTitle>
          <CardDescription>
            Allow students to discuss quiz topics before the quiz starts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={chatSettings.preQuizDiscussion.enabled}
              onCheckedChange={(checked) =>
                setChatSettings(prev => ({
                  ...prev,
                  preQuizDiscussion: { ...prev.preQuizDiscussion, enabled: checked }
                }))
              }
            />
            <Label>Enable pre-quiz discussion</Label>
          </div>

          {chatSettings.preQuizDiscussion.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
              <div>
                <Label htmlFor="preStartTime">Discussion Start Time</Label>
                <Input
                  id="preStartTime"
                  type="datetime-local"
                  value={chatSettings.preQuizDiscussion.startTime || ''}
                  onChange={(e) =>
                    setChatSettings(prev => ({
                      ...prev,
                      preQuizDiscussion: { ...prev.preQuizDiscussion, startTime: e.target.value }
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="preEndTime">Discussion End Time</Label>
                <Input
                  id="preEndTime"
                  type="datetime-local"
                  value={chatSettings.preQuizDiscussion.endTime || ''}
                  onChange={(e) =>
                    setChatSettings(prev => ({
                      ...prev,
                      preQuizDiscussion: { ...prev.preQuizDiscussion, endTime: e.target.value }
                    }))
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* During Quiz Restrictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            During Quiz Restrictions
          </CardTitle>
          <CardDescription>
            Control chat access while students are taking the quiz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={chatSettings.duringQuizRestriction.enabled}
              onCheckedChange={(checked) =>
                setChatSettings(prev => ({
                  ...prev,
                  duringQuizRestriction: { ...prev.duringQuizRestriction, enabled: checked }
                }))
              }
            />
            <Label>Restrict chat during quiz</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={chatSettings.duringQuizRestriction.emergencyContactAllowed}
              onCheckedChange={(checked) =>
                setChatSettings(prev => ({
                  ...prev,
                  duringQuizRestriction: { ...prev.duringQuizRestriction, emergencyContactAllowed: checked }
                }))
              }
            />
            <Label>Allow emergency contact during quiz</Label>
          </div>
        </CardContent>
      </Card>

      {/* Post-Quiz Discussion Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Post-Quiz Discussion
          </CardTitle>
          <CardDescription>
            Configure discussion after quiz completion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={chatSettings.postQuizDiscussion.enabled}
              onCheckedChange={(checked) =>
                setChatSettings(prev => ({
                  ...prev,
                  postQuizDiscussion: { ...prev.postQuizDiscussion, enabled: checked }
                }))
              }
            />
            <Label>Enable post-quiz discussion</Label>
          </div>

          {chatSettings.postQuizDiscussion.enabled && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                <div>
                  <Label htmlFor="postStartTime">Discussion Start Time</Label>
                  <Input
                    id="postStartTime"
                    type="datetime-local"
                    value={chatSettings.postQuizDiscussion.startTime || ''}
                    onChange={(e) =>
                      setChatSettings(prev => ({
                        ...prev,
                        postQuizDiscussion: { ...prev.postQuizDiscussion, startTime: e.target.value }
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="postEndTime">Discussion End Time (Optional)</Label>
                  <Input
                    id="postEndTime"
                    type="datetime-local"
                    value={chatSettings.postQuizDiscussion.endTime || ''}
                    onChange={(e) =>
                      setChatSettings(prev => ({
                        ...prev,
                        postQuizDiscussion: { ...prev.postQuizDiscussion, endTime: e.target.value }
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pl-6">
                <Switch
                  checked={chatSettings.postQuizDiscussion.allowAnswerSharing}
                  onCheckedChange={(checked) =>
                    setChatSettings(prev => ({
                      ...prev,
                      postQuizDiscussion: { ...prev.postQuizDiscussion, allowAnswerSharing: checked }
                    }))
                  }
                />
                <Label>Allow answer sharing in post-quiz discussion</Label>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Allowed Discussion Topics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-600" />
            Allowed Discussion Topics
          </CardTitle>
          <CardDescription>
            Define specific topics students can discuss
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Add a discussion topic..."
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTopic()}
            />
            <Button onClick={addTopic} variant="outline">
              Add Topic
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {chatSettings.allowedDiscussionTopics.map((topic, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="cursor-pointer hover:bg-red-100 hover:text-red-800"
                onClick={() => removeTopic(topic)}
              >
                {topic} ×
              </Badge>
            ))}
          </div>

          {chatSettings.allowedDiscussionTopics.length === 0 && (
            <p className="text-sm text-gray-500 italic">
              No specific topics defined. Students can discuss any quiz-related topics.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={saveDiscussionSchedule} 
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSaving ? 'Saving...' : 'Save Discussion Schedule'}
        </Button>
      </div>
    </div>
  )
}
