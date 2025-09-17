const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize Socket.IO
  const io = new Server(server, {
    path: '/api/socketio',
    cors: {
      origin: dev ? 'http://localhost:3000' : process.env.NEXTAUTH_URL,
      methods: ['GET', 'POST']
    }
  })

  // Store connected users and their rooms
  const connectedUsers = new Map()
  const roomUsers = new Map()

  // Function to broadcast global online users count
  const broadcastGlobalOnlineUsers = () => {
    const onlineUsers = Array.from(connectedUsers.values())
    const totalStudents = onlineUsers.filter(user => user.userRole === 'STUDENT').length
    const allUsers = onlineUsers.map(user => user.userName)
    
    io.emit('global-online-users', {
      totalStudents,
      allUsers
    })
  }

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    // Handle user authentication
    socket.on('authenticate', (data) => {
      socket.userId = data.userId
      socket.userName = data.name
      socket.userRole = data.role
      
      connectedUsers.set(socket.id, {
        userId: data.userId,
        userName: data.name,
        userRole: data.role
      })
      
      // Broadcast updated online users count
      broadcastGlobalOnlineUsers()
      
      console.log(`User authenticated: ${data.name} (${data.role})`)
    })

    // Handle joining a room
    socket.on('join-room', (roomId) => {
      socket.join(roomId)
      
      // Track users in room
      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, new Set())
      }
      roomUsers.get(roomId).add(socket.id)
      
      // Notify others in room
      socket.to(roomId).emit('user-joined', {
        userId: socket.userId,
        userName: socket.userName,
        userRole: socket.userRole
      })
      
      // Send current room users
      const currentUsers = Array.from(roomUsers.get(roomId))
        .map(id => connectedUsers.get(id))
        .filter(Boolean)
      
      socket.emit('room-users', currentUsers.map(u => u.userName))
      
      console.log(`User ${socket.userName} joined room ${roomId}`)
    })

    // Handle leaving a room
    socket.on('leave-room', (roomId) => {
      socket.leave(roomId)
      
      if (roomUsers.has(roomId)) {
        roomUsers.get(roomId).delete(socket.id)
      }
      
      socket.to(roomId).emit('user-left', {
        userId: socket.userId,
        userName: socket.userName
      })
      
      console.log(`User ${socket.userName} left room ${roomId}`)
    })

    // Handle new messages
    socket.on('send-message', async (data) => {
      try {
        const { roomId, content, replyToId } = data
        
        if (!content || !content.trim()) {
          socket.emit('error', { message: 'Message content is required' })
          return
        }

        // Send message via API to ensure proper validation and storage
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/chat/rooms/${roomId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': socket.handshake.headers.cookie || ''
          },
          body: JSON.stringify({ content, replyToId })
        })

        if (response.ok) {
          const message = await response.json()
          
          // Broadcast to all users in the room
          io.to(roomId).emit('new-message', {
            ...message,
            status: 'delivered'
          })
          
          // Send confirmation to sender
          socket.emit('message-sent', {
            tempId: data.tempId,
            message: {
              ...message,
              status: 'sent'
            }
          })
        } else {
          socket.emit('error', { message: 'Failed to send message' })
        }
      } catch (error) {
        console.error('Error sending message:', error)
        socket.emit('error', { message: 'Internal server error' })
      }
    })

    // Handle typing indicators
    socket.on('typing', (data) => {
      socket.to(data.roomId).emit('user-typing', {
        userId: socket.userId,
        userName: socket.userName
      })
    })

    socket.on('stop-typing', (data) => {
      socket.to(data.roomId).emit('user-stopped-typing', {
        userId: socket.userId,
        userName: socket.userName
      })
    })

    // Handle message editing
    socket.on('edit-message', async (data) => {
      try {
        const { messageId, content } = data
        
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/chat/messages/${messageId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': socket.handshake.headers.cookie || ''
          },
          body: JSON.stringify({ content })
        })

        if (response.ok) {
          const updatedMessage = await response.json()
          
          // Broadcast to all users in the room
          io.to(data.roomId).emit('message-edited', {
            ...updatedMessage,
            isEdited: true
          })
        } else {
          socket.emit('error', { message: 'Failed to edit message' })
        }
      } catch (error) {
        console.error('Error editing message:', error)
        socket.emit('error', { message: 'Internal server error' })
      }
    })

    // Handle message deletion
    socket.on('delete-message', async (data) => {
      try {
        const { messageId } = data
        
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/chat/messages/${messageId}`, {
          method: 'DELETE',
          headers: {
            'Cookie': socket.handshake.headers.cookie || ''
          }
        })

        if (response.ok) {
          // Broadcast to all users in the room
          io.to(data.roomId).emit('message-deleted', {
            messageId,
            isDeleted: true,
            deletedAt: new Date().toISOString()
          })
        } else {
          socket.emit('error', { message: 'Failed to delete message' })
        }
      } catch (error) {
        console.error('Error deleting message:', error)
        socket.emit('error', { message: 'Internal server error' })
      }
    })

    // Handle message reactions
    socket.on('react-to-message', async (data) => {
      try {
        const { messageId, emoji } = data
        
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/chat/messages/${messageId}/reactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': socket.handshake.headers.cookie || ''
          },
          body: JSON.stringify({ emoji })
        })

        if (response.ok) {
          const result = await response.json()
          
          // Broadcast to all users in the room
          io.to(data.roomId).emit('message-reaction-updated', {
            messageId,
            reactions: result.reactions
          })
        } else {
          socket.emit('error', { message: 'Failed to react to message' })
        }
      } catch (error) {
        console.error('Error reacting to message:', error)
        socket.emit('error', { message: 'Internal server error' })
      }
    })

    // Handle message status updates
    socket.on('message-delivered', (data) => {
      socket.to(data.roomId).emit('message-status', {
        messageId: data.messageId,
        status: 'delivered'
      })
    })

    socket.on('message-read', (data) => {
      socket.to(data.roomId).emit('message-status', {
        messageId: data.messageId,
        status: 'read'
      })
    })

    // Handle global online users request
    socket.on('get-global-online-users', () => {
      const onlineUsers = Array.from(connectedUsers.values())
      const totalStudents = onlineUsers.filter(user => user.userRole === 'STUDENT').length
      const allUsers = onlineUsers.map(user => user.userName)
      
      socket.emit('global-online-users', {
        totalStudents,
        allUsers
      })
    })

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id)
      
      // Remove from all rooms
      roomUsers.forEach((users, roomId) => {
        if (users.has(socket.id)) {
          users.delete(socket.id)
          socket.to(roomId).emit('user-left', {
            userId: socket.userId,
            userName: socket.userName
          })
        }
      })
      
      connectedUsers.delete(socket.id)
      
      // Broadcast updated online users count
      broadcastGlobalOnlineUsers()
    })
  })

  server
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log('> Socket.IO server initialized')
    })
})
