import React, { useEffect, useState } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Trophy, Target, BookOpen, Users, TrendingUp } from 'lucide-react'

interface StudyProgressUpdatesProps {
  userId: string
  userName: string
  userRole: string
  studyGroupId?: string
}

interface ProgressUpdate {
  studyGroupId: string
  studyGroupName: string
  userId: string
  userName: string
  progressType: 'QUIZ_COMPLETED' | 'MILESTONE_REACHED' | 'STUDY_SESSION_JOINED'
  message: string
  data?: any
  timestamp: string
}

const StudyProgressUpdates: React.FC<StudyProgressUpdatesProps> = ({
  userId,
  userName,
  userRole,
  studyGroupId
}) => {
  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([])
  const [showUpdates, setShowUpdates] = useState(false)

  const { on, off } = useWebSocket({
    userId,
    userName,
    userRole
  })

  useEffect(() => {
    const handleStudyProgressUpdate = (data: ProgressUpdate) => {
      // Filter updates for specific study group if provided
      if (studyGroupId && data.studyGroupId !== studyGroupId) {
        return
      }

      setProgressUpdates(prev => [data, ...prev.slice(0, 19)]) // Keep last 20 updates
    }

    on('study-progress-update', handleStudyProgressUpdate)

    return () => {
      off('study-progress-update', handleStudyProgressUpdate)
    }
  }, [on, off, studyGroupId])

  const getProgressIcon = (type: string) => {
    switch (type) {
      case 'QUIZ_COMPLETED':
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case 'MILESTONE_REACHED':
        return <Target className="w-5 h-5 text-green-500" />
      case 'STUDY_SESSION_JOINED':
        return <BookOpen className="w-5 h-5 text-blue-500" />
      default:
        return <TrendingUp className="w-5 h-5 text-purple-500" />
    }
  }

  const getProgressColor = (type: string) => {
    switch (type) {
      case 'QUIZ_COMPLETED':
        return 'bg-yellow-50 border-yellow-200'
      case 'MILESTONE_REACHED':
        return 'bg-green-50 border-green-200'
      case 'STUDY_SESSION_JOINED':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-purple-50 border-purple-200'
    }
  }

  const formatTime = (timestamp: string) => {
    const now = new Date()
    const updateTime = new Date(timestamp)
    const diffMinutes = Math.floor((now.getTime() - updateTime.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return updateTime.toLocaleDateString()
  }

  const getProgressTypeLabel = (type: string) => {
    switch (type) {
      case 'QUIZ_COMPLETED':
        return 'Quiz Completed'
      case 'MILESTONE_REACHED':
        return 'Milestone Reached'
      case 'STUDY_SESSION_JOINED':
        return 'Study Session'
      default:
        return 'Progress Update'
    }
  }

  const recentUpdates = progressUpdates.slice(0, 5)
  const hasNewUpdates = progressUpdates.length > 0

  return (
    <div className="relative">
      {/* Progress Updates Button */}
      <button
        onClick={() => setShowUpdates(!showUpdates)}
        className="relative flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <TrendingUp className="w-5 h-5" />
        <span className="text-sm font-medium">Progress</span>
        {hasNewUpdates && (
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {progressUpdates.length > 9 ? '9+' : progressUpdates.length}
          </span>
        )}
      </button>

      {/* Progress Updates Dropdown */}
      {showUpdates && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Study Group Progress</span>
            </h3>
            {hasNewUpdates && (
              <p className="text-sm text-gray-600 mt-1">
                {progressUpdates.length} recent updates
              </p>
            )}
          </div>

          <div className="divide-y divide-gray-100">
            {progressUpdates.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No progress updates yet</p>
                <p className="text-sm mt-1">
                  Complete quizzes or join study sessions to see updates here
                </p>
              </div>
            ) : (
              progressUpdates.map((update, index) => (
                <div
                  key={index}
                  className={`p-4 hover:bg-gray-50 transition-colors ${getProgressColor(update.progressType)}`}
                >
                  <div className="flex items-start space-x-3">
                    {getProgressIcon(update.progressType)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-900 bg-white px-2 py-1 rounded-full border">
                          {getProgressTypeLabel(update.progressType)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTime(update.timestamp)}
                        </span>
                      </div>
                      
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {update.userName}
                        {update.userId === userId && ' (You)'}
                      </p>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {update.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {update.studyGroupName}
                        </span>
                        
                        {update.data && (
                          <div className="text-xs text-gray-600">
                            {update.data.score && (
                              <span className="bg-gray-100 px-2 py-1 rounded">
                                Score: {update.data.score}%
                              </span>
                            )}
                            {update.data.milestone && (
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                                {update.data.milestone}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {progressUpdates.length > 0 && (
            <div className="p-3 border-t border-gray-200">
              <button
                onClick={() => setProgressUpdates([])}
                className="w-full text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Clear progress updates
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating Recent Updates */}
      {recentUpdates.length > 0 && !showUpdates && (
        <div className="fixed bottom-20 right-4 max-w-sm z-30">
          {recentUpdates.slice(0, 3).map((update, index) => (
            <div
              key={index}
              className={`mb-2 p-3 bg-white border rounded-lg shadow-lg animate-slide-in-right ${getProgressColor(update.progressType)}`}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="flex items-center space-x-2">
                {getProgressIcon(update.progressType)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {update.userName} - {getProgressTypeLabel(update.progressType)}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {update.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default StudyProgressUpdates
