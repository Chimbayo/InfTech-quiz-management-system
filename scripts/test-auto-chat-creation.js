const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testAutoChatCreation() {
  try {
    console.log('🧪 Testing automatic chat room creation for admin-created quizzes...')
    
    // Get admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    
    if (!adminUser) {
      console.error('❌ No admin user found.')
      return
    }
    
    console.log(`📝 Using admin: ${adminUser.name}`)
    
    // Create a simple quiz (this should automatically create chat rooms)
    const quiz = await prisma.quiz.create({
      data: {
        title: 'Auto-Chat Test Quiz',
        description: 'Testing automatic chat room creation',
        passingScore: 60,
        timeLimit: 10,
        isActive: true,
        enableChat: false, // Even with this false, rooms should be created
        creatorId: adminUser.id,
        questions: {
          create: [
            {
              text: 'What is 2 + 2?',
              type: 'MULTIPLE_CHOICE',
              order: 1,
              options: {
                create: [
                  { text: '3', isCorrect: false, order: 1 },
                  { text: '4', isCorrect: true, order: 2 },
                  { text: '5', isCorrect: false, order: 3 }
                ]
              }
            }
          ]
        }
      }
    })
    
    console.log(`✅ Quiz created: "${quiz.title}" (ID: ${quiz.id})`)
    
    // Check if chat rooms were automatically created
    const chatRooms = await prisma.chatRoom.findMany({
      where: { quizId: quiz.id },
      include: {
        _count: {
          select: { messages: 1 }
        }
      }
    })
    
    console.log(`\n📊 Chat rooms created: ${chatRooms.length}`)
    
    const roomTypes = {
      'PRE_QUIZ_DISCUSSION': 0,
      'POST_QUIZ_REVIEW': 0,
      'QUIZ_DISCUSSION': 0,
      'STUDY_GROUP': 0
    }
    
    chatRooms.forEach(room => {
      roomTypes[room.type] = (roomTypes[room.type] || 0) + 1
      console.log(`   ${room.type}: "${room.name}" (${room.isActive ? 'Active' : 'Inactive'}) - ${room._count.messages} messages`)
    })
    
    // Verify expected room types
    const expectedRooms = ['PRE_QUIZ_DISCUSSION', 'POST_QUIZ_REVIEW', 'QUIZ_DISCUSSION']
    let allRoomsCreated = true
    
    expectedRooms.forEach(type => {
      if (!roomTypes[type]) {
        console.log(`❌ Missing room type: ${type}`)
        allRoomsCreated = false
      }
    })
    
    if (allRoomsCreated) {
      console.log('\n✅ All expected chat rooms created successfully!')
      
      // Test post-quiz room activation by simulating a quiz attempt
      console.log('\n🎯 Testing post-quiz room activation...')
      
      // Create a student user for testing
      let studentUser = await prisma.user.findFirst({
        where: { role: 'STUDENT' }
      })
      
      if (!studentUser) {
        studentUser = await prisma.user.create({
          data: {
            email: 'test.student@example.com',
            name: 'Test Student',
            password: 'password123',
            role: 'STUDENT'
          }
        })
        console.log(`   Created test student: ${studentUser.name}`)
      }
      
      // Create a quiz attempt to trigger post-quiz room activation
      const attempt = await prisma.quizAttempt.create({
        data: {
          userId: studentUser.id,
          quizId: quiz.id,
          score: 100,
          passed: true,
          timeSpent: 300,
          completedAt: new Date(),
          answers: {
            create: [
              {
                questionId: (await prisma.question.findFirst({ where: { quizId: quiz.id } })).id,
                selectedOptionId: (await prisma.questionOption.findFirst({ 
                  where: { 
                    question: { quizId: quiz.id },
                    isCorrect: true 
                  } 
                })).id,
                isCorrect: true
              }
            ]
          }
        }
      })
      
      console.log(`   Quiz attempt created: Score ${attempt.score}%`)
      
      // Check if post-quiz room was activated
      const postQuizRoom = await prisma.chatRoom.findFirst({
        where: {
          quizId: quiz.id,
          type: 'POST_QUIZ_REVIEW'
        }
      })
      
      if (postQuizRoom && postQuizRoom.isActive) {
        console.log('   ✅ Post-quiz room activated successfully!')
      } else {
        console.log('   ❌ Post-quiz room not activated')
      }
      
    } else {
      console.log('\n❌ Some expected chat rooms were not created')
    }
    
    console.log('\n🎉 Test completed!')
    
  } catch (error) {
    console.error('❌ Error during test:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testAutoChatCreation()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
