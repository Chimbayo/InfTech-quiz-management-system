'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Bell, 
  Plus, 
  Clock, 
  Calendar,
  BookOpen,
  Users,
  Target,
  Settings,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react'

interface StudyReminder {
  id: string
  title: string
  description: string
  type: 'QUIZ_DEADLINE' | 'STUDY_SESSION' | 'CUSTOM' | 'PROGRESS_CHECK'
  reminderTime: string
  isActive: boolean
  quizId?: string
  studySessionId?: string
  createdAt: string
}

interface StudyRemindersPanelProps {
  userId: string
}

export function StudyRemindersPanel({ userId }: StudyRemindersPanelProps) {
  const [reminders, setReminders] = useState<StudyReminder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    reminderFrequency: '1_HOUR', // 15_MIN, 30_MIN, 1_HOUR, 2_HOUR, 1_DAY
    autoReminders: true
  })
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'CUSTOM' as const,
    reminderTime: '',
    quizId: '',
    studySessionId: ''
  })

  useEffect(() => {
    fetchReminders()
    fetchNotificationSettings()
  }, [])

  const fetchReminders = async () => {
    try {
      const response = await fetch('/api/study-reminders')
      if (response.ok) {
        const data = await response.json()
        setReminders(data)
      }
    } catch (error) {
      console.error('Error fetching reminders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchNotificationSettings = async () => {
    try {
      const response = await fetch('/api/user/notification-settings')
      if (response.ok) {
        const settings = await response.json()
        setNotificationSettings(prev => ({ ...prev, ...settings }))
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error)
    }
  }

  const createReminder = async () => {
    try {
      const response = await fetch('/api/study-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const newReminder = await response.json()
        setReminders(prev => [newReminder, ...prev])
        setIsCreateDialogOpen(false)
        setFormData({
          title: '',
          description: '',
          type: 'CUSTOM',
          reminderTime: '',
          quizId: '',
          studySessionId: ''
        })
      }
    } catch (error) {
      console.error('Error creating reminder:', error)
    }
  }

  const toggleReminder = async (reminderId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/study-reminders/${reminderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })

      if (response.ok) {
        setReminders(prev => prev.map(reminder => 
          reminder.id === reminderId ? { ...reminder, isActive } : reminder
        ))
      }
    } catch (error) {
      console.error('Error toggling reminder:', error)
    }
  }

  const deleteReminder = async (reminderId: string) => {
    try {
      const response = await fetch(`/api/study-reminders/${reminderId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setReminders(prev => prev.filter(reminder => reminder.id !== reminderId))
      }
    } catch (error) {
      console.error('Error deleting reminder:', error)
    }
  }

  const updateNotificationSettings = async (newSettings: Partial<typeof notificationSettings>) => {
    try {
      const updatedSettings = { ...notificationSettings, ...newSettings }
      const response = await fetch('/api/user/notification-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      })

      if (response.ok) {
        setNotificationSettings(updatedSettings)
      }
    } catch (error) {
      console.error('Error updating notification settings:', error)
    }
  }

  const getReminderIcon = (type: string) => {
    switch (type) {
      case 'QUIZ_DEADLINE': return <BookOpen className="h-5 w-5 text-blue-600" />
      case 'STUDY_SESSION': return <Users className="h-5 w-5 text-green-600" />
      case 'PROGRESS_CHECK': return <Target className="h-5 w-5 text-purple-600" />
      default: return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  const getReminderColor = (type: string) => {
    switch (type) {
      case 'QUIZ_DEADLINE': return 'bg-blue-100 text-blue-800'
      case 'STUDY_SESSION': return 'bg-green-100 text-green-800'
      case 'PROGRESS_CHECK': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatReminderTime = (timeString: string) => {
    const date = new Date(timeString)
    return date.toLocaleString()
  }

  const isUpcoming = (timeString: string) => {
    const reminderTime = new Date(timeString)
    const now = new Date()
    const timeDiff = reminderTime.getTime() - now.getTime()
    return timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000 // Within 24 hours
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading reminders...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Study Reminders</h3>
          <p className="text-gray-600">Stay on track with personalized study notifications</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Study Reminder</DialogTitle>
              <DialogDescription>
                Set up a personalized reminder to stay on track with your studies
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Study for Math Quiz"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Additional details about this reminder..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="type">Reminder Type</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CUSTOM">Custom Reminder</SelectItem>
                    <SelectItem value="QUIZ_DEADLINE">Quiz Deadline</SelectItem>
                    <SelectItem value="STUDY_SESSION">Study Session</SelectItem>
                    <SelectItem value="PROGRESS_CHECK">Progress Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="reminderTime">Reminder Time</Label>
                <Input
                  id="reminderTime"
                  type="datetime-local"
                  value={formData.reminderTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, reminderTime: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createReminder} disabled={!formData.title || !formData.reminderTime}>
                Create Reminder
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-gray-600">Receive reminders via email</p>
            </div>
            <Switch
              id="email-notifications"
              checked={notificationSettings.emailNotifications}
              onCheckedChange={(checked) => updateNotificationSettings({ emailNotifications: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="push-notifications">Push Notifications</Label>
              <p className="text-sm text-gray-600">Receive browser notifications</p>
            </div>
            <Switch
              id="push-notifications"
              checked={notificationSettings.pushNotifications}
              onCheckedChange={(checked) => updateNotificationSettings({ pushNotifications: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-reminders">Auto Reminders</Label>
              <p className="text-sm text-gray-600">Automatically create quiz deadline reminders</p>
            </div>
            <Switch
              id="auto-reminders"
              checked={notificationSettings.autoReminders}
              onCheckedChange={(checked) => updateNotificationSettings({ autoReminders: checked })}
            />
          </div>
          
          <div>
            <Label htmlFor="reminder-frequency">Default Reminder Frequency</Label>
            <Select 
              value={notificationSettings.reminderFrequency} 
              onValueChange={(value) => updateNotificationSettings({ reminderFrequency: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15_MIN">15 minutes before</SelectItem>
                <SelectItem value="30_MIN">30 minutes before</SelectItem>
                <SelectItem value="1_HOUR">1 hour before</SelectItem>
                <SelectItem value="2_HOUR">2 hours before</SelectItem>
                <SelectItem value="1_DAY">1 day before</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Active Reminders */}
      <div className="grid gap-4">
        {reminders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Reminders Set</h4>
              <p className="text-gray-600 mb-4">Create your first reminder to stay on track with your studies</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Reminder
              </Button>
            </CardContent>
          </Card>
        ) : (
          reminders.map((reminder) => (
            <Card key={reminder.id} className={`hover:shadow-md transition-shadow ${isUpcoming(reminder.reminderTime) ? 'ring-2 ring-orange-200' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getReminderIcon(reminder.type)}
                    <div>
                      <CardTitle className="text-base">{reminder.title}</CardTitle>
                      <CardDescription>{reminder.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isUpcoming(reminder.reminderTime) && (
                      <Badge className="bg-orange-100 text-orange-800">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Upcoming
                      </Badge>
                    )}
                    <Badge className={getReminderColor(reminder.type)}>
                      {reminder.type.replace('_', ' ')}
                    </Badge>
                    <Switch
                      checked={reminder.isActive}
                      onCheckedChange={(checked) => toggleReminder(reminder.id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteReminder(reminder.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatReminderTime(reminder.reminderTime)}
                  </div>
                  <div className="flex items-center gap-1">
                    {reminder.isActive ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-600" />
                    )}
                    {reminder.isActive ? 'Active' : 'Inactive'}
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
