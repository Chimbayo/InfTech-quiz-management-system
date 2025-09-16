'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  TrendingUp, 
  Plus, 
  Trophy, 
  Target,
  Flame,
  Star,
  CheckCircle,
  BarChart3,
  Users,
  Share
} from 'lucide-react'

interface StudyMilestone {
  id: string
  type: string
  description: string
  value: number
  achievedAt: string
}

interface StudyGroup {
  id: string
  name: string
}

interface ProgressSharingPanelProps {
  studyGroups: StudyGroup[]
  userId: string
}

export function ProgressSharingPanel({ studyGroups, userId }: ProgressSharingPanelProps) {
  const [milestones, setMilestones] = useState<StudyMilestone[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    type: 'QUIZ_COMPLETED',
    description: '',
    value: 0,
    studyGroupIds: [] as string[]
  })

  useEffect(() => {
    fetchMilestones()
  }, [])

  const fetchMilestones = async () => {
    try {
      const response = await fetch('/api/progress')
      if (response.ok) {
        const data = await response.json()
        setMilestones(data)
      }
    } catch (error) {
      console.error('Error fetching milestones:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const shareProgress = async () => {
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const newMilestone = await response.json()
        setMilestones(prev => [newMilestone, ...prev])
        setIsShareDialogOpen(false)
        setFormData({
          type: 'QUIZ_COMPLETED',
          description: '',
          value: 0,
          studyGroupIds: []
        })
      }
    } catch (error) {
      console.error('Error sharing progress:', error)
    }
  }

  const getMilestoneIcon = (type: string) => {
    switch (type) {
      case 'QUIZ_COMPLETED': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'STREAK_ACHIEVED': return <Flame className="h-5 w-5 text-orange-600" />
      case 'SCORE_IMPROVED': return <TrendingUp className="h-5 w-5 text-blue-600" />
      case 'STUDY_GOAL_MET': return <Target className="h-5 w-5 text-purple-600" />
      case 'BADGE_EARNED': return <Trophy className="h-5 w-5 text-yellow-600" />
      default: return <Star className="h-5 w-5 text-gray-600" />
    }
  }

  const getMilestoneColor = (type: string) => {
    switch (type) {
      case 'QUIZ_COMPLETED': return 'bg-green-100 text-green-800'
      case 'STREAK_ACHIEVED': return 'bg-orange-100 text-orange-800'
      case 'SCORE_IMPROVED': return 'bg-blue-100 text-blue-800'
      case 'STUDY_GOAL_MET': return 'bg-purple-100 text-purple-800'
      case 'BADGE_EARNED': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleStudyGroupToggle = (groupId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      studyGroupIds: checked 
        ? [...prev.studyGroupIds, groupId]
        : prev.studyGroupIds.filter(id => id !== groupId)
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading progress...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Progress Sharing</h3>
          <p className="text-gray-600">Share your study milestones with study groups</p>
        </div>
        
        <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Share Progress
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Share Progress Milestone</DialogTitle>
              <DialogDescription>
                Celebrate your achievements and motivate your study groups
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="type">Milestone Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="QUIZ_COMPLETED">Quiz Completed</SelectItem>
                    <SelectItem value="STREAK_ACHIEVED">Study Streak Achieved</SelectItem>
                    <SelectItem value="SCORE_IMPROVED">Score Improved</SelectItem>
                    <SelectItem value="STUDY_GOAL_MET">Study Goal Met</SelectItem>
                    <SelectItem value="BADGE_EARNED">Badge Earned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your achievement..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="value">Value (Optional)</Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: parseInt(e.target.value) || 0 }))}
                  placeholder="e.g., score, streak days, etc."
                />
              </div>
              
              <div>
                <Label>Share with Study Groups</Label>
                <div className="space-y-2 mt-2">
                  {studyGroups.map((group) => (
                    <div key={group.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={group.id}
                        checked={formData.studyGroupIds.includes(group.id)}
                        onCheckedChange={(checked) => handleStudyGroupToggle(group.id, checked as boolean)}
                      />
                      <Label htmlFor={group.id} className="text-sm font-normal">
                        {group.name}
                      </Label>
                    </div>
                  ))}
                  {studyGroups.length === 0 && (
                    <p className="text-sm text-gray-500">No study groups available</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={shareProgress} disabled={!formData.description}>
                Share Progress
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {milestones.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Progress Shared</h4>
              <p className="text-gray-600 mb-4">Share your first milestone to motivate your study groups</p>
              <Button onClick={() => setIsShareDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Share Progress
              </Button>
            </CardContent>
          </Card>
        ) : (
          milestones.map((milestone) => (
            <Card key={milestone.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getMilestoneIcon(milestone.type)}
                    <div>
                      <CardTitle className="text-base">{milestone.description}</CardTitle>
                      <CardDescription>
                        {new Date(milestone.achievedAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getMilestoneColor(milestone.type)}>
                      {milestone.type.replace('_', ' ')}
                    </Badge>
                    {milestone.value > 0 && (
                      <Badge variant="outline">
                        {milestone.value}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      {/* Quick Progress Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Your Progress Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {milestones.filter(m => m.type === 'QUIZ_COMPLETED').length}
              </div>
              <div className="text-sm text-green-700">Quizzes Completed</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {milestones.filter(m => m.type === 'STREAK_ACHIEVED').length}
              </div>
              <div className="text-sm text-orange-700">Streaks Achieved</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {milestones.filter(m => m.type === 'SCORE_IMPROVED').length}
              </div>
              <div className="text-sm text-blue-700">Scores Improved</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {milestones.filter(m => m.type === 'STUDY_GOAL_MET').length}
              </div>
              <div className="text-sm text-purple-700">Goals Met</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
