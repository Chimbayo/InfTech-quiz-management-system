import { Server as IOServer } from 'socket.io'
import { prisma } from './prisma'

export interface QuizBroadcastData {
  quizId: string
  type: 'PUBLISHED' | 'CLOSED' | 'STARTED' | 'ENDED'
  message: string
  sentBy: string
}

export interface StudyProgressData {
  studyGroupId: string
  userId: string
  quizId?: string
  progressType: 'QUIZ_COMPLETED' | 'MILESTONE_REACHED' | 'STUDY_SESSION_JOINED'
  message: string
  data?: any
}

export class RealtimeBroadcast {
  private io: IOServer

  constructor(io: IOServer) {
    this.io = io
  }

  // Quiz Status Broadcasting
  async broadcastQuizStatus(data: QuizBroadcastData) {
    try {
      // Save broadcast to database
      const broadcast = await prisma.quizBroadcast.create({
        data: {
          quizId: data.quizId,
          type: data.type,
          message: data.message,
          sentBy: data.sentBy
        },
        include: {
          quiz: {
            select: {
              title: true,
              chatRooms: {
                select: { id: true }
              },
              studyGroups: {
                select: { 
                  id: true,
                  chatRooms: {
                    select: { id: true }
                  }
                }
              }
            }
          },
          sender: {
            select: {
              name: true,
              role: true
            }
          }
        }
      })

      // Broadcast to all quiz-related chat rooms
      const roomIds = [
        ...broadcast.quiz.chatRooms.map(room => room.id),
        ...broadcast.quiz.studyGroups.flatMap(group => 
          group.chatRooms.map(room => room.id)
        )
      ]

      for (const roomId of roomIds) {
        this.io.to(roomId).emit('quiz-status-update', {
          id: broadcast.id,
          quizId: data.quizId,
          quizTitle: broadcast.quiz.title,
          type: data.type,
          message: data.message,
          sender: broadcast.sender,
          timestamp: broadcast.timestamp
        })
      }

      // Also broadcast to general announcement channel
      this.io.emit('quiz-announcement', {
        id: broadcast.id,
        quizId: data.quizId,
        quizTitle: broadcast.quiz.title,
        type: data.type,
        message: data.message,
        sender: broadcast.sender,
        timestamp: broadcast.timestamp
      })

      return broadcast
    } catch (error) {
      console.error('Error broadcasting quiz status:', error)
      throw error
    }
  }

  // Study Group Progress Updates
  async broadcastStudyProgress(data: StudyProgressData) {
    try {
      // Get study group details
      const studyGroup = await prisma.studyGroup.findUnique({
        where: { id: data.studyGroupId },
        include: {
          chatRooms: { select: { id: true } },
          members: {
            include: {
              user: { select: { id: true, name: true } }
            }
          }
        }
      })

      if (!studyGroup) {
        throw new Error('Study group not found')
      }

      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { name: true, role: true }
      })

      // Broadcast to study group chat rooms
      for (const room of studyGroup.chatRooms) {
        this.io.to(room.id).emit('study-progress-update', {
          studyGroupId: data.studyGroupId,
          studyGroupName: studyGroup.name,
          userId: data.userId,
          userName: user?.name,
          progressType: data.progressType,
          message: data.message,
          data: data.data,
          timestamp: new Date().toISOString()
        })
      }

      // Send system message to chat rooms
      for (const room of studyGroup.chatRooms) {
        await prisma.chatMessage.create({
          data: {
            roomId: room.id,
            userId: data.userId,
            content: data.message,
            isSystemMessage: true
          }
        })

        this.io.to(room.id).emit('new-message', {
          id: Date.now().toString(),
          content: data.message,
          user: {
            id: data.userId,
            name: user?.name || 'System',
            role: user?.role || 'SYSTEM'
          },
          createdAt: new Date().toISOString(),
          isSystemMessage: true
        })
      }

    } catch (error) {
      console.error('Error broadcasting study progress:', error)
      throw error
    }
  }

  // Instructor Presence Broadcasting
  async broadcastInstructorPresence(userId: string, isOnline: boolean, roomId?: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, role: true }
      })

      if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
        return
      }

      const presenceData = {
        userId,
        userName: user.name,
        userRole: user.role,
        isOnline,
        timestamp: new Date().toISOString()
      }

      if (roomId) {
        // Broadcast to specific room
        this.io.to(roomId).emit('instructor-presence-update', {
          ...presenceData,
          roomId
        })
      } else {
        // Broadcast globally
        this.io.emit('instructor-presence-update', presenceData)
      }

    } catch (error) {
      console.error('Error broadcasting instructor presence:', error)
    }
  }

  // Live Study Session Updates
  async broadcastStudySessionUpdate(sessionId: string, updateData: {
    type: 'PARTICIPANT_JOINED' | 'PARTICIPANT_LEFT' | 'SESSION_STARTED' | 'SESSION_ENDED' | 'PROGRESS_UPDATE'
    userId?: string
    message: string
    data?: any
  }) {
    try {
      const session = await prisma.studySession.findUnique({
        where: { id: sessionId },
        include: {
          creator: { select: { name: true } },
          studyGroup: { select: { name: true } },
          quiz: { select: { title: true } }
        }
      })

      if (!session) {
        throw new Error('Study session not found')
      }

      const broadcastData = {
        sessionId,
        sessionName: session.name,
        studyGroupName: session.studyGroup?.name,
        quizTitle: session.quiz?.title,
        type: updateData.type,
        message: updateData.message,
        data: updateData.data,
        timestamp: new Date().toISOString()
      }

      // Broadcast to study session participants
      this.io.to(`study-session-${sessionId}`).emit('study-session-update', broadcastData)

      // Also broadcast to related study group chat rooms if exists
      if (session.studyGroupId) {
        const studyGroup = await prisma.studyGroup.findUnique({
          where: { id: session.studyGroupId },
          include: { chatRooms: { select: { id: true } } }
        })

        if (studyGroup) {
          for (const room of studyGroup.chatRooms) {
            this.io.to(room.id).emit('study-session-update', broadcastData)
          }
        }
      }

    } catch (error) {
      console.error('Error broadcasting study session update:', error)
    }
  }
}

// Singleton instance
let broadcastInstance: RealtimeBroadcast | null = null

export const getBroadcastInstance = (io?: IOServer): RealtimeBroadcast => {
  if (!broadcastInstance && io) {
    broadcastInstance = new RealtimeBroadcast(io)
  }
  if (!broadcastInstance) {
    throw new Error('Broadcast instance not initialized')
  }
  return broadcastInstance
}
