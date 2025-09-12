'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  MessageSquare, 
  Settings,
  Search,
  Plus,
  Trash2,
  Eye
} from 'lucide-react'

interface StudyGroup {
  id: string
  name: string
  description: string
  isActive: boolean
  createdAt: string
  _count: {
    members: number
  }
  chatRoom?: {
    id: string
    name: string
    _count: {
      messages: number
    }
  }
  members: {
    id: string
    user: {
      id: string
      name: string
      email: string
    }
  }[]
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

export function StudyGroupManager() {
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [newGroup, setNewGroup] = useState({ name: '', description: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchStudyGroups()
    fetchUsers()
  }, [])

  const fetchStudyGroups = async () => {
    try {
      const response = await fetch('/api/study-groups')
      if (response.ok) {
        const groups = await response.json()
        setStudyGroups(groups)
      }
    } catch (error) {
      console.error('Error fetching study groups:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users?role=STUDENT')
      if (response.ok) {
        const userData = await response.json()
        setUsers(userData)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const createStudyGroup = async () => {
    if (!newGroup.name.trim()) {
      setError('Group name is required')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/study-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGroup)
      })

      if (response.ok) {
        setNewGroup({ name: '', description: '' })
        setSuccess('Study group created successfully!')
        fetchStudyGroups()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create study group')
      }
    } catch (error) {
      setError('An error occurred while creating the study group')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteStudyGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this study group? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/study-groups/${groupId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccess('Study group deleted successfully!')
        fetchStudyGroups()
      } else {
        setError('Failed to delete study group')
      }
    } catch (error) {
      setError('An error occurred while deleting the study group')
    }
  }

  const addMemberToGroup = async (groupId: string, userId: string) => {
    try {
      const response = await fetch(`/api/study-groups/${groupId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        setSuccess('Member added successfully!')
        fetchStudyGroups()
      } else {
        setError('Failed to add member to group')
      }
    } catch (error) {
      setError('An error occurred while adding the member')
    }
  }

  const removeMemberFromGroup = async (groupId: string, userId: string) => {
    try {
      const response = await fetch(`/api/study-groups/${groupId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        setSuccess('Member removed successfully!')
        fetchStudyGroups()
      } else {
        setError('Failed to remove member from group')
      }
    } catch (error) {
      setError('An error occurred while removing the member')
    }
  }

  const filteredGroups = studyGroups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getAvailableUsersForGroup = (groupId: string) => {
    const group = studyGroups.find(g => g.id === groupId)
    if (!group) return users

    const memberIds = group.members.map(m => m.user.id)
    return users.filter(user => !memberIds.includes(user.id))
  }

  return (
    <div className="space-y-6">
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

      {/* Create New Study Group */}
      <Card className="card-professional">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create New Study Group
          </CardTitle>
          <CardDescription>
            Study groups automatically get their own chat rooms for collaboration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                value={newGroup.name}
                onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter study group name"
              />
            </div>
            <div>
              <Label htmlFor="groupDescription">Description</Label>
              <Input
                id="groupDescription"
                value={newGroup.description}
                onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter group description"
              />
            </div>
          </div>
          <Button 
            onClick={createStudyGroup} 
            disabled={isLoading || !newGroup.name.trim()}
            className="btn-primary-professional"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Study Group
          </Button>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card className="card-professional">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search study groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Study Groups List */}
      <div className="grid gap-6">
        {filteredGroups.length === 0 ? (
          <Card className="card-professional">
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No matching study groups' : 'No study groups yet'}
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? 'Try adjusting your search criteria.'
                  : 'Create your first study group to get started.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredGroups.map((group) => (
            <Card key={group.id} className="card-professional">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      {group.name}
                      <Badge variant={group.isActive ? 'default' : 'secondary'}>
                        {group.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {group.description || 'No description provided'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {group.chatRoom && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/chat?room=${group.chatRoom?.id}`, '_blank')}
                        className="btn-secondary-professional"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat Room
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedGroup(selectedGroup === group.id ? '' : group.id)}
                      className="btn-secondary-professional"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteStudyGroup(group.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{group._count.members}</div>
                    <div className="text-sm text-gray-600">Members</div>
                  </div>
                  {group.chatRoom && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{group.chatRoom._count.messages}</div>
                      <div className="text-sm text-gray-600">Messages</div>
                    </div>
                  )}
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {new Date(group.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-600">Created</div>
                  </div>
                </div>

                {/* Group Management Panel */}
                {selectedGroup === group.id && (
                  <div className="border-t pt-4 space-y-4">
                    <h4 className="font-semibold text-gray-900">Group Members</h4>
                    
                    {/* Current Members */}
                    <div className="space-y-2">
                      {group.members.length === 0 ? (
                        <p className="text-gray-500 text-sm">No members yet</p>
                      ) : (
                        group.members.map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <p className="font-medium">{member.user.name}</p>
                              <p className="text-sm text-gray-600">{member.user.email}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeMemberFromGroup(group.id, member.user.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Members */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Add Members</h5>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {getAvailableUsersForGroup(group.id).map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-gray-600">{user.email}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addMemberToGroup(group.id, user.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
