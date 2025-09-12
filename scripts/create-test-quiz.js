const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTestQuiz() {
  try {
    console.log('Creating test quiz with chat enabled...')
    
    // First, find an admin user to be the creator
    const adminUser = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      }
    })
    
    if (!adminUser) {
      console.log('No admin user found. Creating one...')
      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@test.com',
          name: 'Test Admin',
          role: 'ADMIN',
          password: 'hashedpassword' // In real app, this would be properly hashed
        }
      })
      console.log('Created admin user:', newAdmin.email)
    }
    
    const creator = adminUser || await prisma.user.findFirst({ where: { role: 'ADMIN' } })
    
    // Create a test quiz with chat enabled
    const quiz = await prisma.quiz.create({
      data: {
        title: 'JavaScript Fundamentals Test',
        description: 'Test your knowledge of JavaScript basics',
        passingScore: 70,
        timeLimit: 30,
        isActive: true,
        enableChat: true,
        creatorId: creator.id,
        questions: {
          create: [
            {
              text: 'What is the correct way to declare a variable in JavaScript?',
              type: 'MULTIPLE_CHOICE',
              order: 1,
              options: {
                create: [
                  { text: 'var myVar = 5;', isCorrect: true, order: 1 },
                  { text: 'variable myVar = 5;', isCorrect: false, order: 2 },
                  { text: 'v myVar = 5;', isCorrect: false, order: 3 },
                  { text: 'declare myVar = 5;', isCorrect: false, order: 4 }
                ]
              }
            },
            {
              text: 'Which of the following is NOT a JavaScript data type?',
              type: 'MULTIPLE_CHOICE',
              order: 2,
              options: {
                create: [
                  { text: 'String', isCorrect: false, order: 1 },
                  { text: 'Boolean', isCorrect: false, order: 2 },
                  { text: 'Integer', isCorrect: true, order: 3 },
                  { text: 'Object', isCorrect: false, order: 4 }
                ]
              }
            }
          ]
        }
      },
      include: {
        questions: {
          include: {
            options: true
          }
        }
      }
    })
    
    console.log('Created quiz:', quiz.title)
    
    // Now create the chat room (simulating the API logic)
    const roomName = `${quiz.title} - Discussion`
    
    const chatRoom = await prisma.chatRoom.create({
      data: {
        name: roomName,
        type: 'QUIZ_DISCUSSION',
        quizId: quiz.id,
        createdBy: creator.id,
        allowChatDuringQuiz: false,
        isActive: true,
      }
    })
    
    console.log('Created chat room:', chatRoom.name)
    
    // Create system message
    await prisma.chatMessage.create({
      data: {
        roomId: chatRoom.id,
        userId: creator.id,
        content: `📚 Discussion room created for quiz: ${quiz.title}. Students can join after completing the quiz.`,
        isSystemMessage: true
      }
    })
    
    console.log('Created system message for chat room')
    
    // List all chat rooms to verify
    const allRooms = await prisma.chatRoom.findMany({
      include: {
        quiz: {
          select: {
            title: true
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      }
    })
    
    console.log('\nAll chat rooms:')
    allRooms.forEach(room => {
      console.log(`- ${room.name} (${room.type}) - Active: ${room.isActive} - Messages: ${room._count.messages}${room.quiz ? ` - Quiz: ${room.quiz.title}` : ''}`)
    })
    
  } catch (error) {
    console.error('Error creating test quiz:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestQuiz()
