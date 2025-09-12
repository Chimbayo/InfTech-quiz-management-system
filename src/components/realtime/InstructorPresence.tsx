import React, { useEffect, useState } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Users, UserCheck, Clock } from 'lucide-react'

interface InstructorPresenceProps {
  userId?: string
  userName?: string
  userRole?: string
  roomId?: string
}

interface OnlineInstructor {
  userId: string
  userName: string
  userRole: string
  isOnline: boolean
  timestamp: string
  roomId?: string
}

const InstructorPresence: React.FC<InstructorPresenceProps> = ({
  userId,
  userName,
  userRole,
  roomId
}) => {
  const [onlineInstructors, setOnlineInstructors] = useState<OnlineInstructor[]>([])
  const [showPresenceList, setShowPresenceList] = useState(false)
  const { on, off } = useWebSocket({
    userId,
    userName,
    userRole
  })

  useEffect(() => {
    const handleInstructorOnline = (data: OnlineInstructor) => {
      setOnlineInstructors(prev => {
        const exists = prev.find(instructor => instructor.userId === data.userId)
        if (!exists) {
          return [...prev, { ...data, isOnline: true, timestamp: new Date().toISOString() }]
        }
        return prev.map(instructor => 
          instructor.userId === data.userId 
            ? { ...instructor, isOnline: true, timestamp: new Date().toISOString() }
            : instructor
        )
      })
    }

    const handleInstructorOffline = (data: OnlineInstructor) => {
      setOnlineInstructors(prev => 
        prev.filter(instructor => instructor.userId !== data.userId)
      )
    }

    const handleInstructorPresenceUpdate = (data: OnlineInstructor) => {
      if (data.isOnline) {
        handleInstructorOnline(data)
      } else {
        handleInstructorOffline(data)
      }
    }

    on('instructor-online', handleInstructorOnline)
    on('instructor-offline', handleInstructorOffline)
    on('instructor-presence-update', handleInstructorPresenceUpdate)

    return () => {
      off('instructor-online', handleInstructorOnline)
      off('instructor-offline', handleInstructorOffline)
      off('instructor-presence-update', handleInstructorPresenceUpdate)
    }
  }, [on, off])

  // Filter instructors by room if roomId is provided
  const relevantInstructors = roomId 
    ? onlineInstructors.filter(instructor => !instructor.roomId || instructor.roomId === roomId)
    : onlineInstructors

  const formatLastSeen = (timestamp: string) => {
    const now = new Date()
    const lastSeen = new Date(timestamp)
    const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return lastSeen.toLocaleDateString()
  }

  return (
    <div className="relative">
      {/* Presence Indicator */}
      <button
        onClick={() => setShowPresenceList(!showPresenceList)}
        className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Users className="w-5 h-5" />
        <span className="text-sm font-medium">
          Instructors ({relevantInstructors.length})
        </span>
        {relevantInstructors.length > 0 && (
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        )}
      </button>

      {/* Presence List Dropdown */}
      {showPresenceList && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
              <UserCheck className="w-4 h-4" />
              <span>Online Instructors</span>
            </h3>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {relevantInstructors.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No instructors online</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {relevantInstructors.map((instructor) => (
                  <div
                    key={instructor.userId}
                    className="p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {instructor.userName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {instructor.userName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {instructor.userRole}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{formatLastSeen(instructor.timestamp)}</span>
                        </div>
                        {instructor.roomId === roomId && (
                          <span className="inline-block mt-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                            In this room
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Presence Indicators for Current Room */}
      {roomId && relevantInstructors.some(i => i.roomId === roomId) && (
        <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-40">
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-700">
              {relevantInstructors.filter(i => i.roomId === roomId).length} instructor(s) in room
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default InstructorPresence
