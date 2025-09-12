import { Server as HTTPServer } from 'http'
import { Socket as NetSocket } from 'net'
import { NextApiResponse } from 'next'
import { Server as IOServer, Socket } from 'socket.io'
import { prisma } from './prisma'

interface SocketServer extends HTTPServer {
  io?: IOServer | undefined
}

interface SocketWithIO extends NetSocket {
  server: SocketServer
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO
}

interface ExtendedSocket extends Socket {
  userId?: string
  userName?: string
  userRole?: string
}

// Helper function to update user presence
async function updateUserPresence(
  userId: string, 
  isOnline: boolean, 
  socketId?: string | null, 
  currentRoom?: string | null
) {
  try {
    await prisma.userPresence.upsert({
      where: { userId },
      update: {
        isOnline,
        lastSeen: new Date(),
        socketId: socketId || undefined,
        currentRoom: currentRoom || undefined,
        updatedAt: new Date()
      },
      create: {
        userId,
        isOnline,
        lastSeen: new Date(),
        socketId: socketId || undefined,
        currentRoom: currentRoom || undefined
      }
    })
  } catch (error) {
    console.error('Error updating user presence:', error)
  }
}

export const initializeWebSocket = (res: NextApiResponseWithSocket) => {
  if (!res.socket.server.io) {
    console.log('Setting up Socket.IO server...')
    
    const io = new IOServer(res.socket.server, {
      path: '/api/socketio',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.NEXTAUTH_URL 
          : 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    })

    // Handle real-time connections
    io.on('connection', (socket: ExtendedSocket) => {
      console.log('User connected:', socket.id)

      // User authentication and presence
      socket.on('authenticate', async (data: { userId: string, name: string, role: string }) => {
        socket.userId = data.userId
        socket.userName = data.name
        socket.userRole = data.role

        // Update user presence
        await updateUserPresence(data.userId, true, socket.id)
        
        // Notify about instructor presence
        if (data.role === 'TEACHER' || data.role === 'ADMIN') {
          socket.broadcast.emit('instructor-online', {
            userId: data.userId,
            name: data.name,
            role: data.role
          })
        }
      })

      // Join a chat room
      socket.on('join-room', async (roomId: string) => {
        socket.join(roomId)
        console.log(`User ${socket.id} joined room ${roomId}`)
        
        // Update current room in presence
        if (socket.userId) {
          await updateUserPresence(socket.userId, true, socket.id, roomId)
        }
        
        socket.to(roomId).emit('user-joined', { 
          userId: socket.userId, 
          userName: socket.userName,
          userRole: socket.userRole 
        })
      })

      // Leave a chat room
      socket.on('leave-room', async (roomId: string) => {
        socket.leave(roomId)
        console.log(`User ${socket.id} left room ${roomId}`)
        
        // Update presence to remove current room
        if (socket.userId) {
          await updateUserPresence(socket.userId, true, socket.id, null)
        }
        
        socket.to(roomId).emit('user-left', { 
          userId: socket.userId,
          userName: socket.userName 
        })
      })

      // Join study session
      socket.on('join-study-session', async (data: { sessionId: string, userId: string }) => {
        socket.join(`study-session-${data.sessionId}`)
        
        // Update participant status
        await prisma.studySessionParticipant.upsert({
          where: {
            sessionId_userId: {
              sessionId: data.sessionId,
              userId: data.userId
            }
          },
          update: {
            isActive: true,
            leftAt: null
          },
          create: {
            sessionId: data.sessionId,
            userId: data.userId,
            isActive: true
          }
        })

        // Notify other participants
        socket.to(`study-session-${data.sessionId}`).emit('participant-joined', {
          userId: data.userId,
          userName: socket.userName
        })
      })

      // Leave study session
      socket.on('leave-study-session', async (data: { sessionId: string, userId: string }) => {
        socket.leave(`study-session-${data.sessionId}`)
        
        // Update participant status
        await prisma.studySessionParticipant.updateMany({
          where: {
            sessionId: data.sessionId,
            userId: data.userId
          },
          data: {
            isActive: false,
            leftAt: new Date()
          }
        })

        // Notify other participants
        socket.to(`study-session-${data.sessionId}`).emit('participant-left', {
          userId: data.userId,
          userName: socket.userName
        })
      })

      // Handle new messages
      socket.on('send-message', (data: {
        roomId: string
        message: string
        user: {
          id: string
          name: string
          role: string
        }
      }) => {
        // Broadcast message to all users in the room
        io.to(data.roomId).emit('new-message', {
          id: Date.now().toString(),
          message: data.message,
          user: data.user,
          createdAt: new Date().toISOString(),
          isSystemMessage: false
        })
      })

      // Handle typing indicators
      socket.on('typing', (data: { roomId: string, userName: string }) => {
        socket.to(data.roomId).emit('user-typing', data)
      })

      socket.on('stop-typing', (data: { roomId: string, userName: string }) => {
        socket.to(data.roomId).emit('user-stop-typing', data)
      })

      // Study session collaboration
      socket.on('study-session-update', (data: {
        sessionId: string
        type: 'progress' | 'note' | 'question'
        content: string
        userId: string
      }) => {
        socket.to(`study-session-${data.sessionId}`).emit('session-update', {
          ...data,
          userName: socket.userName,
          timestamp: new Date().toISOString()
        })
      })

      // Handle disconnection
      socket.on('disconnect', async () => {
        console.log('User disconnected:', socket.id)
        
        if (socket.userId) {
          // Update user presence to offline
          await updateUserPresence(socket.userId, false, null)
          
          // Notify about instructor going offline
          if (socket.userRole === 'TEACHER' || socket.userRole === 'ADMIN') {
            socket.broadcast.emit('instructor-offline', {
              userId: socket.userId,
              name: socket.userName,
              role: socket.userRole
            })
          }
        }
      })
    })

    res.socket.server.io = io
  }
  
  return res.socket.server.io
}

export type { NextApiResponseWithSocket }
