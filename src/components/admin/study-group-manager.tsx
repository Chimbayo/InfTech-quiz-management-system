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
  Edit,
  Save,
  X
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
  const [editingGroup, setEditingGroup] = useState<string>('')
  const [editForm, setEditForm] = useState({ name: '', description: '' })
  const [bulkEditingMembers, setBulkEditingMembers] = useState<string>('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

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

  const startEditGroup = (group: StudyGroup) => {
    setEditingGroup(group.id)
    setEditForm({ name: group.name, description: group.description })
    setSelectedGroup(group.id) // Also open the management panel
  }

  const cancelEdit = () => {
    setEditingGroup('')
    setEditForm({ name: '', description: '' })
  }

  const saveGroupEdit = async (groupId: string) => {
    if (!editForm.name.trim()) {
      setError('Group name is required')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/study-groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name.trim(),
          description: editForm.description.trim()
        })
      })

      if (response.ok) {
        setSuccess('Study group updated successfully!')
        setEditingGroup('')
        setEditForm({ name: '', description: '' })
        fetchStudyGroups()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update study group')
      }
    } catch (error) {
      setError('An error occurred while updating the study group')
    } finally {
      setIsLoading(false)
    }
  }

  const saveBulkMemberEdit = async (groupId: string) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/study-groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberIds: selectedMembers
        })
      })

      if (response.ok) {
        setSuccess('Group members updated successfully!')
        setBulkEditingMembers('')
        setSelectedMembers([])
        fetchStudyGroups()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update group members')
      }
    } catch (error) {
      setError('An error occurred while updating group members')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMemberSelection = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
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
                    {editingGroup === group.id ? (
                      // Edit Mode
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Users className="h-4 w-4 text-white" />
                          </div>
                          <Input
                            value={editForm.name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Group name"
                            className="font-semibold text-lg"
                          />
                          <Badge variant={group.isActive ? 'default' : 'secondary'}>
                            {group.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <Input
                          value={editForm.description}
                          onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Group description"
                          className="text-sm"
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => saveGroupEdit(group.id)}
                            disabled={isLoading || !editForm.name.trim()}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEdit}
                            disabled={isLoading}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <>
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
                      </>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {editingGroup !== group.id && (
                      <>
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
                          onClick={() => startEditGroup(group)}
                          className="btn-secondary-professional text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedGroup(selectedGroup === group.id ? '' : group.id)}
                          className="btn-secondary-professional"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Members
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setBulkEditingMembers(group.id)
                            setSelectedMembers(group.members.map(m => m.user.id))
                            setSelectedGroup(group.id)
                          }}
                          className="btn-secondary-professional text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Bulk Edit
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
                      </>
                    )}
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
                  <div className="border-t pt-4 space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Manage Group Members
                      </h4>
                      <Badge variant="outline" className="text-sm">
                        {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    
                    {/* Current Members */}
                    <div className="space-y-3">
                      <h5 className="font-medium text-gray-900 text-sm uppercase tracking-wide">Current Members</h5>
                      {group.members.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                          <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">No members yet</p>
                          <p className="text-gray-400 text-xs">Add students to get started</p>
                        </div>
                      ) : (
                        <div className="grid gap-2">
                          {group.members.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm font-semibold">
                                    {member.user.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{member.user.name}</p>
                                  <p className="text-sm text-gray-600">{member.user.email}</p>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeMemberFromGroup(group.id, member.user.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              >
                                <UserMinus className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Add Members */}
                    <div className="space-y-3">
                      <h5 className="font-medium text-gray-900 text-sm uppercase tracking-wide">Available Students</h5>
                      <div className="max-h-60 overflow-y-auto border rounded-lg">
                        {getAvailableUsersForGroup(group.id).length === 0 ? (
                          <div className="text-center py-6 bg-gray-50">
                            <UserPlus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">All students are already members</p>
                          </div>
                        ) : (
                          <div className="divide-y">
                            {getAvailableUsersForGroup(group.id).map((user) => (
                              <div key={user.id} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-semibold">
                                      {user.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">{user.name}</p>
                                    <p className="text-sm text-gray-600">{user.email}</p>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addMemberToGroup(group.id, user.id)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                >
                                  <UserPlus className="h-4 w-4 mr-1" />
                                  Add
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bulk Edit Members Interface */}
                    {bulkEditingMembers === group.id && (
                      <div className="border-t pt-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-purple-900 flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Bulk Edit Members
                          </h5>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => saveBulkMemberEdit(group.id)}
                              disabled={isLoading}
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              <Save className="h-4 w-4 mr-1" />
                              Save Changes
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setBulkEditingMembers('')
                                setSelectedMembers([])
                              }}
                              disabled={isLoading}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>

                        <div className="bg-purple-50 p-4 rounded-lg">
                          <p className="text-sm text-purple-700 mb-3">
                            Select/deselect students to manage group membership. Selected students will be members of this group.
                          </p>
                          <div className="max-h-60 overflow-y-auto space-y-2">
                            {users.filter(user => user.role === 'STUDENT').map((user) => (
                              <div key={user.id} className="flex items-center gap-3 p-2 bg-white rounded border">
                                <input
                                  type="checkbox"
                                  checked={selectedMembers.includes(user.id)}
                                  onChange={() => toggleMemberSelection(user.id)}
                                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                />
                                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm font-semibold">
                                    {user.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{user.name}</p>
                                  <p className="text-sm text-gray-600">{user.email}</p>
                                </div>
                                <Badge variant={selectedMembers.includes(user.id) ? 'default' : 'outline'}>
                                  {selectedMembers.includes(user.id) ? 'Selected' : 'Available'}
                                </Badge>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 text-sm text-purple-600">
                            {selectedMembers.length} student{selectedMembers.length !== 1 ? 's' : ''} selected
                          </div>
                        </div>
                      </div>
                    )}
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
