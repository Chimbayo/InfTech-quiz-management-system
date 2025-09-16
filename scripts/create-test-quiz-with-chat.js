const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTestQuizWithChat() {
  try {
    console.log('🎯 Creating test quiz with chat functionality...')
    
    // Get admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    
    if (!adminUser) {
      console.error('❌ No admin user found. Please create an admin user first.')
      return
    }
    
    console.log(`📝 Using admin: ${adminUser.name} (${adminUser.email})`)
    
    // Create quiz with chat enabled
    const quiz = await prisma.quiz.create({
      data: {
        title: 'JavaScript Fundamentals - Test Quiz',
        description: 'Test your knowledge of JavaScript basics with chat functionality enabled',
        passingScore: 70,
        timeLimit: 15,
        isActive: true,
        enableChat: true,
        creatorId: adminUser.id,
        questions: {
          create: [
            {
              text: 'What is the correct way to declare a variable in JavaScript?',
              type: 'MULTIPLE_CHOICE',
              order: 1,
              options: {
                create: [
                  { text: 'var myVariable = 5;', isCorrect: true, order: 1 },
                  { text: 'variable myVariable = 5;', isCorrect: false, order: 2 },
                  { text: 'v myVariable = 5;', isCorrect: false, order: 3 },
                  { text: 'declare myVariable = 5;', isCorrect: false, order: 4 }
                ]
              }
            },
            {
              text: 'Which of the following is a JavaScript data type?',
              type: 'MULTIPLE_CHOICE',
              order: 2,
              options: {
                create: [
                  { text: 'string', isCorrect: true, order: 1 },
                  { text: 'float', isCorrect: false, order: 2 },
                  { text: 'char', isCorrect: false, order: 3 },
                  { text: 'int', isCorrect: false, order: 4 }
                ]
              }
            },
            {
              text: 'JavaScript is a case-sensitive language.',
              type: 'TRUE_FALSE',
              order: 3,
              options: {
                create: [
                  { text: 'True', isCorrect: true, order: 1 },
                  { text: 'False', isCorrect: false, order: 2 }
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
    
    console.log(`✅ Quiz created: "${quiz.title}" (ID: ${quiz.id})`)
    console.log(`   - ${quiz.questions.length} questions`)
    console.log(`   - Passing score: ${quiz.passingScore}%`)
    console.log(`   - Time limit: ${quiz.timeLimit} minutes`)
    console.log(`   - Chat enabled: ${quiz.enableChat}`)
    
    // Create Pre-Quiz Discussion Room
    const preQuizRoom = await prisma.chatRoom.create({
      data: {
        name: `${quiz.title} - Pre-Quiz Discussion`,
        description: 'Discuss quiz topics and prepare together before attempting',
        type: 'PRE_QUIZ_DISCUSSION',
        quizId: quiz.id,
        createdBy: adminUser.id,
        allowChatDuringQuiz: false,
        isActive: true,
      }
    })
    
    await prisma.chatMessage.create({
      data: {
        roomId: preQuizRoom.id,
        userId: adminUser.id,
        content: `📚 Pre-Quiz Discussion for "${quiz.title}" is now open! Discuss topics, ask questions, and prepare together before attempting the quiz.`,
        isSystemMessage: true
      }
    })
    
    console.log(`   ✅ Pre-Quiz Discussion Room created: ${preQuizRoom.name}`)
    
    // Create Post-Quiz Review Room (initially inactive)
    const postQuizRoom = await prisma.chatRoom.create({
      data: {
        name: `${quiz.title} - Post-Quiz Review`,
        description: 'Review answers and discuss explanations after completing the quiz',
        type: 'POST_QUIZ_REVIEW',
        quizId: quiz.id,
        createdBy: adminUser.id,
        allowChatDuringQuiz: false,
        isActive: false, // Will be activated when first student completes quiz
      }
    })
    
    await prisma.chatMessage.create({
      data: {
        roomId: postQuizRoom.id,
        userId: adminUser.id,
        content: `🎯 Post-Quiz Review for "${quiz.title}" will be available after you complete the quiz. Discuss answers, explanations, and learn from each other!`,
        isSystemMessage: true
      }
    })
    
    console.log(`   ✅ Post-Quiz Review Room created: ${postQuizRoom.name} (inactive until first completion)`)
    
    // Create General Quiz Discussion Room
    const generalRoom = await prisma.chatRoom.create({
      data: {
        name: `${quiz.title} - General Discussion`,
        description: 'General discussion about the quiz topic',
        type: 'QUIZ_DISCUSSION',
        quizId: quiz.id,
        createdBy: adminUser.id,
        allowChatDuringQuiz: false,
        isActive: true,
      }
    })
    
    await prisma.chatMessage.create({
      data: {
        roomId: generalRoom.id,
        userId: adminUser.id,
        content: `💬 General discussion room for "${quiz.title}" is now available! Share insights, ask questions, and collaborate with your peers.`,
        isSystemMessage: true
      }
    })
    
    console.log(`   ✅ General Discussion Room created: ${generalRoom.name}`)
    
    // Create Study Group
    const studyGroup = await prisma.studyGroup.create({
      data: {
        name: `${quiz.title} - Study Group`,
        description: `Collaborative study group for ${quiz.title}. Join to study together and help each other succeed!`,
        quizId: quiz.id,
        createdBy: adminUser.id,
      }
    })
    
    // Create study group chat room
    const studyGroupRoom = await prisma.chatRoom.create({
      data: {
        name: `${quiz.title} - Study Group Chat`,
        description: 'Private chat for study group members',
        type: 'STUDY_GROUP',
        studyGroupId: studyGroup.id,
        createdBy: adminUser.id,
        allowChatDuringQuiz: true,
        isActive: true,
      }
    })
    
    await prisma.chatMessage.create({
      data: {
        roomId: studyGroupRoom.id,
        userId: adminUser.id,
        content: `👥 Welcome to the "${quiz.title}" study group! This is your private space to collaborate, share resources, and help each other prepare for the quiz. Good luck!`,
        isSystemMessage: true
      }
    })
    
    // Auto-add creator as moderator
    await prisma.userStudyGroup.create({
      data: {
        userId: adminUser.id,
        groupId: studyGroup.id,
        role: 'moderator'
      }
    })
    
    console.log(`   ✅ Study Group created: ${studyGroup.name}`)
    console.log(`   ✅ Study Group Chat Room created: ${studyGroupRoom.name}`)
    
    console.log('\n🎉 Test quiz with complete chat functionality created successfully!')
    console.log('\n📋 Summary:')
    console.log(`   - Quiz: "${quiz.title}"`)
    console.log(`   - Pre-Quiz Discussion Room (active)`)
    console.log(`   - Post-Quiz Review Room (will activate after first completion)`)
    console.log(`   - General Discussion Room (active)`)
    console.log(`   - Study Group with Chat Room (active)`)
    console.log('\n🚀 You can now test the study chat functionality in the student dashboard!')
    
  } catch (error) {
    console.error('❌ Error creating test quiz:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
createTestQuizWithChat()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
