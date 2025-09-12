'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Clock, Calendar, Save } from 'lucide-react'

interface DiscussionSchedulerProps {
  quizId: string
  quizTitle: string
  onScheduleUpdate?: () => void
}

interface DiscussionSettings {
  discussionStartTime?: string
  discussionEndTime?: string
  allowChatDuringQuiz: boolean
}

export function DiscussionScheduler({ quizId, quizTitle, onScheduleUpdate }: DiscussionSchedulerProps) {
  const [settings, setSettings] = useState<DiscussionSettings>({
    allowChatDuringQuiz: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchCurrentSettings()
  }, [quizId])

  const fetchCurrentSettings = async () => {
    try {
      const response = await fetch(`/api/chat/discussion-schedule?quizId=${quizId}`)
      if (response.ok) {
        const quiz = await response.json()
        if (quiz.chatSettings) {
          setSettings(quiz.chatSettings)
        }
      }
    } catch (error) {
      console.error('Error fetching discussion settings:', error)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/chat/discussion-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId,
          ...settings
        })
      })

      if (response.ok) {
        setSuccess('Discussion schedule updated successfully!')
        onScheduleUpdate?.()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update discussion schedule')
      }
    } catch (error) {
      setError('An error occurred while updating the schedule')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDateTime = (dateTime: string) => {
    if (!dateTime) return ''
    return new Date(dateTime).toISOString().slice(0, 16)
  }

  const handleDateTimeChange = (field: keyof DiscussionSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value ? new Date(value).toISOString() : undefined
    }))
  }

  return (
    <Card className="card-professional">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Discussion Scheduling
        </CardTitle>
        <CardDescription>
          Set time windows when quiz discussions are allowed for "{quizTitle}"
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startTime">Discussion Start Time</Label>
            <Input
              id="startTime"
              type="datetime-local"
              value={formatDateTime(settings.discussionStartTime || '')}
              onChange={(e) => handleDateTimeChange('discussionStartTime', e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              When students can start discussing this quiz
            </p>
          </div>

          <div>
            <Label htmlFor="endTime">Discussion End Time</Label>
            <Input
              id="endTime"
              type="datetime-local"
              value={formatDateTime(settings.discussionEndTime || '')}
              onChange={(e) => handleDateTimeChange('discussionEndTime', e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              When quiz discussions should end
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="allowDuringQuiz"
            checked={settings.allowChatDuringQuiz}
            onCheckedChange={(checked) => 
              setSettings(prev => ({ ...prev, allowChatDuringQuiz: checked as boolean }))
            }
          />
          <Label htmlFor="allowDuringQuiz" className="text-sm">
            Allow chat during active quiz attempts
          </Label>
        </div>

        <Alert className="border-yellow-200 bg-yellow-50">
          <Clock className="h-4 w-4" />
          <AlertDescription className="text-yellow-800">
            <strong>Academic Integrity Notice:</strong> Enabling chat during quiz attempts may compromise academic integrity. 
            Consider using this feature only for collaborative or open-book assessments.
          </AlertDescription>
        </Alert>

        <div className="flex justify-end space-x-2">
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="btn-primary-professional"
          >
            {isLoading ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Schedule
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
