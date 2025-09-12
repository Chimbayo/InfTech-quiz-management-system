import React, { useEffect, useState } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Users, MessageCircle, Clock, Play, Square, UserPlus, UserMinus } from 'lucide-react'

interface LiveStudySessionProps {
  sessionId: string
  userId: string
  userName: string
  userRole: string
  onSessionEnd?: () => void
}

interface SessionParticipant {
  userId: string
  userName: string
  joinedAt: string
}

interface SessionUpdate {
  type: 'progress' | 'note' | 'question'
  content: string
  userId: string
  userName: string
  timestamp: string
}

const LiveStudySession: React.FC<LiveStudySessionProps> = ({
  sessionId,
  userId,
  userName,
  userRole,
  onSessionEnd
}) => {
  const [participants, setParticipants] = useState<SessionParticipant[]>([])
  const [updates, setUpdates] = useState<SessionUpdate[]>([])
  const [newUpdate, setNewUpdate] = useState('')
  const [updateType, setUpdateType] = useState<'progress' | 'note' | 'question'>('note')
  const [isActive, setIsActive] = useState(true)

  const { 
    on, 
    off, 
    joinStudySession, 
    leaveStudySession, 
    sendStudySessionUpdate,
    isConnected 
  } = useWebSocket({
    userId,
    userName,
    userRole
  })

  useEffect(() => {
    if (isConnected) {
      joinStudySession(sessionId, userId)
    }

    return () => {
      if (isConnected) {
        leaveStudySession(sessionId, userId)
      }
    }
  }, [isConnected, sessionId, userId, joinStudySession, leaveStudySession])

  useEffect(() => {
    const handleParticipantJoined = (data: { userId: string; userName: string }) => {
      setParticipants(prev => {
        const exists = prev.find(p => p.userId === data.userId)
        if (!exists) {
          return [...prev, {
            userId: data.userId,
            userName: data.userName,
            joinedAt: new Date().toISOString()
          }]
        }
        return prev
      })
    }

    const handleParticipantLeft = (data: { userId: string; userName: string }) => {
      setParticipants(prev => prev.filter(p => p.userId !== data.userId))
    }

    const handleSessionUpdate = (data: SessionUpdate) => {
      setUpdates(prev => [data, ...prev.slice(0, 49)]) // Keep last 50 updates
    }

    const handleStudySessionUpdate = (data: any) => {
      if (data.type === 'SESSION_ENDED') {
        setIsActive(false)
        onSessionEnd?.()
      }
    }

    on('participant-joined', handleParticipantJoined)
    on('participant-left', handleParticipantLeft)
    on('session-update', handleSessionUpdate)
    on('study-session-update', handleStudySessionUpdate)

    return () => {
      off('participant-joined', handleParticipantJoined)
      off('participant-left', handleParticipantLeft)
      off('session-update', handleSessionUpdate)
      off('study-session-update', handleStudySessionUpdate)
    }
  }, [on, off, onSessionEnd])

  const handleSendUpdate = () => {
    if (!newUpdate.trim()) return

    sendStudySessionUpdate(sessionId, updateType, newUpdate.trim(), userId)
    setNewUpdate('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendUpdate()
    }
  }

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'progress':
        return <Play className="w-4 h-4 text-green-500" />
      case 'question':
        return <MessageCircle className="w-4 h-4 text-blue-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (!isActive) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <Square className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Session Ended</h3>
        <p className="text-gray-600">This study session has been completed.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="text-lg font-semibold text-gray-900">Live Study Session</h3>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{participants.length} participants</span>
          </div>
        </div>
      </div>

      <div className="flex h-96">
        {/* Participants Sidebar */}
        <div className="w-1/4 border-r border-gray-200 p-4">
          <h4 className="font-medium text-gray-900 mb-3">Participants</h4>
          <div className="space-y-2">
            {participants.map((participant) => (
              <div key={participant.userId} className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">
                    {participant.userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-gray-700">{participant.userName}</span>
                {participant.userId === userId && (
                  <span className="text-xs text-gray-500">(You)</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Updates Feed */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-3">
              {updates.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No updates yet. Share your progress or ask questions!</p>
                </div>
              ) : (
                updates.map((update, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    {getUpdateIcon(update.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {update.userName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTime(update.timestamp)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          update.type === 'progress' ? 'bg-green-100 text-green-700' :
                          update.type === 'question' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {update.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{update.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <select
                value={updateType}
                onChange={(e) => setUpdateType(e.target.value as any)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="note">Note</option>
                <option value="progress">Progress</option>
                <option value="question">Question</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <textarea
                value={newUpdate}
                onChange={(e) => setNewUpdate(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Share an update, progress, or ask a question..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                rows={2}
              />
              <button
                onClick={handleSendUpdate}
                disabled={!newUpdate.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LiveStudySession
