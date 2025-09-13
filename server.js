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
    socket.on('send-message', (data) => {
      const messageData = {
        ...data.message,
        id: `${Date.now()}-${socket.id}`,
        createdAt: new Date().toISOString(),
        status: 'sent'
      }
      
      // Broadcast to all users in the room
      io.to(data.roomId).emit('new-message', messageData)
      
      console.log(`Message sent in room ${data.roomId}: ${data.message.message}`)
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
