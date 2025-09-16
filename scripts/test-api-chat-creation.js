const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testAPIChatCreation() {
  try {
    console.log('🧪 Testing automatic chat room creation via API...')
    
    // Get admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    
    if (!adminUser) {
      console.error('❌ No admin user found.')
      return
    }
    
    console.log(`📝 Using admin: ${adminUser.name}`)
    
    // Test quiz data
    const quizData = {
      title: 'API Test Quiz - Chat Rooms',
      description: 'Testing automatic chat room creation via API',
      passingScore: 60,
      timeLimit: 10,
      isActive: true,
      enableChat: false, // Even with this false, rooms should be created
      creatorId: adminUser.id,
      questions: [
        {
          text: 'What is 2 + 2?',
          type: 'MULTIPLE_CHOICE',
          options: [
            { text: '3', isCorrect: false },
            { text: '4', isCorrect: true },
            { text: '5', isCorrect: false }
          ]
        }
      ]
    }
    
    // Make API call to create quiz
    const response = await fetch('http://localhost:3000/api/quizzes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // In a real scenario, you'd need proper authentication headers
      },
      body: JSON.stringify(quizData)
    })
    
    if (!response.ok) {
      console.error(`❌ API call failed: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.error('Error details:', errorText)
      return
    }
    
    const quiz = await response.json()
    console.log(`✅ Quiz created via API: "${quiz.title}" (ID: ${quiz.id})`)
    
    // Wait a moment for chat rooms to be created
    await new Promise(resolve => setTimeout(resolve, 1000))
    
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
    } else {
      console.log('\n❌ Some expected chat rooms were not created')
    }
    
    console.log('\n🎉 API test completed!')
    
  } catch (error) {
    console.error('❌ Error during test:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testAPIChatCreation()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
