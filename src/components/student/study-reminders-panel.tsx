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
      case 'QUIZ_DEADLINE': return (
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-md">
          <BookOpen className="h-5 w-5 text-white" />
        </div>
      )
      case 'STUDY_SESSION': return (
        <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-md">
          <Users className="h-5 w-5 text-white" />
        </div>
      )
      case 'PROGRESS_CHECK': return (
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl flex items-center justify-center shadow-md">
          <Target className="h-5 w-5 text-white" />
        </div>
      )
      default: return (
        <div className="w-10 h-10 bg-gradient-to-r from-slate-500 to-gray-500 rounded-xl flex items-center justify-center shadow-md">
          <Bell className="h-5 w-5 text-white" />
        </div>
      )
    }
  }

  const getReminderColor = (type: string) => {
    switch (type) {
      case 'QUIZ_DEADLINE': return 'badge-inftech badge-inftech-primary'
      case 'STUDY_SESSION': return 'badge-inftech badge-inftech-success'
      case 'PROGRESS_CHECK': return 'badge-inftech badge-inftech-warning'
      default: return 'badge-inftech bg-slate-100 text-slate-800 border-slate-200'
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
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg text-slate-600">Loading reminders...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold heading-inftech-primary">Your Study Reminders</h3>
          <p className="text-slate-600 text-lg mt-1">Stay on track with personalized study notifications and smart scheduling</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-inftech-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] card-inftech">
            <DialogHeader className="pb-6">
              <DialogTitle className="text-2xl heading-inftech-primary">Create Study Reminder</DialogTitle>
              <DialogDescription className="text-base text-slate-600">
                Set up a personalized reminder to stay on track with your studies and never miss important deadlines
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-base font-semibold text-slate-700">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Study for Math Quiz"
                  className="input-inftech mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="description" className="text-base font-semibold text-slate-700">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Additional details about this reminder..."
                  rows={3}
                  className="input-inftech mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="type" className="text-base font-semibold text-slate-700">Reminder Type</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger className="input-inftech mt-2">
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
                <Label htmlFor="reminderTime" className="text-base font-semibold text-slate-700">Reminder Time</Label>
                <Input
                  id="reminderTime"
                  type="datetime-local"
                  value={formData.reminderTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, reminderTime: e.target.value }))}
                  className="input-inftech mt-2"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-8">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="btn-inftech-secondary">
                Cancel
              </Button>
              <Button onClick={createReminder} disabled={!formData.title || !formData.reminderTime} className="btn-inftech-primary">
                Create Reminder
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Notification Settings */}
      <Card className="card-inftech card-inftech-hover">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl heading-inftech-primary">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl flex items-center justify-center">
              <Settings className="h-5 w-5 text-white" />
            </div>
            Notification Settings
          </CardTitle>
          <CardDescription className="text-base text-slate-600">
            Customize how and when you receive study reminders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
            <div>
              <Label htmlFor="email-notifications" className="text-base font-semibold text-slate-700">Email Notifications</Label>
              <p className="text-sm text-slate-600 mt-1">Receive reminders via email</p>
            </div>
            <Switch
              id="email-notifications"
              checked={notificationSettings.emailNotifications}
              onCheckedChange={(checked) => updateNotificationSettings({ emailNotifications: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-green-50 rounded-xl border border-slate-200">
            <div>
              <Label htmlFor="push-notifications" className="text-base font-semibold text-slate-700">Push Notifications</Label>
              <p className="text-sm text-slate-600 mt-1">Receive browser notifications</p>
            </div>
            <Switch
              id="push-notifications"
              checked={notificationSettings.pushNotifications}
              onCheckedChange={(checked) => updateNotificationSettings({ pushNotifications: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-purple-50 rounded-xl border border-slate-200">
            <div>
              <Label htmlFor="auto-reminders" className="text-base font-semibold text-slate-700">Auto Reminders</Label>
              <p className="text-sm text-slate-600 mt-1">Automatically create quiz deadline reminders</p>
            </div>
            <Switch
              id="auto-reminders"
              checked={notificationSettings.autoReminders}
              onCheckedChange={(checked) => updateNotificationSettings({ autoReminders: checked })}
            />
          </div>
          
          <div className="p-4 bg-gradient-to-r from-slate-50 to-amber-50 rounded-xl border border-slate-200">
            <Label htmlFor="reminder-frequency" className="text-base font-semibold text-slate-700">Default Reminder Frequency</Label>
            <Select 
              value={notificationSettings.reminderFrequency} 
              onValueChange={(value) => updateNotificationSettings({ reminderFrequency: value })}
            >
              <SelectTrigger className="input-inftech mt-3">
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
      <div className="grid gap-6">
        {reminders.length === 0 ? (
          <Card className="card-inftech">
            <CardContent className="text-center py-16">
              <Bell className="h-16 w-16 text-slate-300 mx-auto mb-6" />
              <h4 className="text-2xl font-bold text-slate-900 mb-3">No Reminders Set</h4>
              <p className="text-slate-600 text-lg mb-6">Create your first reminder to stay on track with your studies and never miss important deadlines</p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="btn-inftech-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Reminder
              </Button>
            </CardContent>
          </Card>
        ) : (
          reminders.map((reminder) => (
            <Card key={reminder.id} className={`card-inftech card-inftech-hover ${isUpcoming(reminder.reminderTime) ? 'ring-2 ring-orange-300 shadow-lg' : ''}`}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getReminderIcon(reminder.type)}
                    <div>
                      <CardTitle className="text-xl heading-inftech-primary">{reminder.title}</CardTitle>
                      <CardDescription className="text-base text-slate-600 mt-1">{reminder.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isUpcoming(reminder.reminderTime) && (
                      <Badge className="badge-inftech badge-inftech-warning">
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
                      className="btn-inftech-error"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-base">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">{formatReminderTime(reminder.reminderTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {reminder.isActive ? (
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <X className="h-5 w-5 text-red-500" />
                    )}
                    <span className={`font-medium ${reminder.isActive ? 'text-emerald-600' : 'text-red-600'}`}>
                      {reminder.isActive ? 'Active' : 'Inactive'}
                    </span>
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
