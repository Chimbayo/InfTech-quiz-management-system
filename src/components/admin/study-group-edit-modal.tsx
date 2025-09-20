'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Edit, 
  Save, 
  X, 
  Users,
  UserPlus,
  UserMinus,
  BookOpen
} from 'lucide-react'

interface Student {
  id: string
  name: string
  email: string
  _count: {
    attempts: number
  }
}

interface StudyGroup {
  id: string
  name: string
  description?: string
  quizId?: string
  createdBy: string
  createdAt: string
  creator: {
    name: string
  }
  quiz?: {
    id: string
    title: string
  }
  members: {
    user: {
      id: string
      name: string
    }
    role: string
  }[]
  _count: {
    members: number
  }
}

interface Quiz {
  id: string
  title: string
}

interface StudyGroupEditModalProps {
  group: StudyGroup
  quizzes: Quiz[]
  onUpdate: () => void
  trigger?: React.ReactNode
}

export function StudyGroupEditModal({ group, quizzes, onUpdate, trigger }: StudyGroupEditModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  
  const [formData, setFormData] = useState({
    name: group.name,
    description: group.description || '',
    quizId: group.quizId || '',
    memberIds: group.members.map(m => m.user.id)
  })

  useEffect(() => {
    if (isOpen) {
      fetchStudents()
    }
  }, [isOpen])

  const fetchStudents = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/users/students')
      if (response.ok) {
        const data = await response.json()
        setStudents(data)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleStudentSelection = (studentId: string) => {
    setFormData(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(studentId)
        ? prev.memberIds.filter(id => id !== studentId)
        : [...prev.memberIds, studentId]
    }))
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Group name is required')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/study-groups/${group.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          quizId: formData.quizId || null,
          memberIds: formData.memberIds
        })
      })

      if (response.ok) {
        setIsOpen(false)
        onUpdate()
        alert('Study group updated successfully!')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating study group:', error)
      alert('Failed to update study group')
    } finally {
      setIsSaving(false)
    }
  }

  const getCurrentMembers = () => {
    return students.filter(student => formData.memberIds.includes(student.id))
  }

  const getAvailableStudents = () => {
    return students.filter(student => !formData.memberIds.includes(student.id))
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
            Edit Study Group: {group.name}
          </DialogTitle>
          <DialogDescription>
            Update group details and manage members
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="groupName">Group Name *</Label>
              <Input
                id="groupName"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter group name"
                className="input-professional"
              />
            </div>
            <div>
              <Label htmlFor="quizSelect">Associated Quiz</Label>
              <select
                id="quizSelect"
                value={formData.quizId}
                onChange={(e) => setFormData(prev => ({ ...prev, quizId: e.target.value }))}
                className="w-full p-2 border rounded-md input-professional"
              >
                <option value="">Select a quiz (optional)...</option>
                {quizzes.map((quiz) => (
                  <option key={quiz.id} value={quiz.id}>
                    {quiz.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="groupDescription">Description</Label>
            <Textarea
              id="groupDescription"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter group description (optional)"
              className="input-professional min-h-[80px]"
            />
          </div>

          {/* Member Management */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Members */}
            <div>
              <Label className="text-base font-semibold">Current Members ({formData.memberIds.length})</Label>
              <div className="mt-2 border rounded-lg p-4 bg-green-50 max-h-64 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                    <span className="ml-2">Loading...</span>
                  </div>
                ) : getCurrentMembers().length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No members selected</p>
                ) : (
                  <div className="space-y-2">
                    {getCurrentMembers().map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{student.name}</p>
                            <p className="text-sm text-gray-500">{student.email}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleStudentSelection(student.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Available Students */}
            <div>
              <Label className="text-base font-semibold">Available Students</Label>
              <div className="mt-2 border rounded-lg p-4 bg-blue-50 max-h-64 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading...</span>
                  </div>
                ) : getAvailableStudents().length === 0 ? (
                  <p className="text-gray-500 text-center py-4">All students are already members</p>
                ) : (
                  <div className="space-y-2">
                    {getAvailableStudents().map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{student.name}</p>
                            <p className="text-sm text-gray-500">{student.email}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleStudentSelection(student.id)}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Summary of Changes</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Group Name:</span>
                <p className="font-medium">{formData.name || 'Unnamed Group'}</p>
              </div>
              <div>
                <span className="text-gray-600">Associated Quiz:</span>
                <p className="font-medium">
                  {formData.quizId 
                    ? quizzes.find(q => q.id === formData.quizId)?.title || 'Unknown Quiz'
                    : 'None'
                  }
                </p>
              </div>
              <div>
                <span className="text-gray-600">Total Members:</span>
                <p className="font-medium">{formData.memberIds.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formData.name.trim() || isSaving}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
