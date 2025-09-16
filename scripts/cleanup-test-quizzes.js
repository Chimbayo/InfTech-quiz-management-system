const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanupTestQuizzes() {
  try {
    console.log('🧹 Starting cleanup of test quizzes...')
    
    // Get all quizzes to see what we're working with
    const allQuizzes = await prisma.quiz.findMany({
      include: {
        creator: {
          select: { name: true, email: true }
        },
        _count: {
          select: {
            attempts: true,
            questions: true
          }
        }
      }
    })
    
    console.log(`\n📊 Found ${allQuizzes.length} total quizzes:`)
    allQuizzes.forEach((quiz, index) => {
      console.log(`${index + 1}. "${quiz.title}" by ${quiz.creator.name} (${quiz._count.questions} questions, ${quiz._count.attempts} attempts)`)
    })
    
    if (allQuizzes.length === 0) {
      console.log('✅ No quizzes found to delete.')
      return
    }
    
    // Delete all quiz-related data in the correct order to respect foreign key constraints
    console.log('\n🗑️  Deleting quiz data...')
    
    // Delete answers first (they reference quiz attempts)
    const deletedAnswers = await prisma.answer.deleteMany({})
    console.log(`   Deleted ${deletedAnswers.count} answers`)
    
    // Delete quiz attempts
    const deletedAttempts = await prisma.quizAttempt.deleteMany({})
    console.log(`   Deleted ${deletedAttempts.count} quiz attempts`)
    
    // Delete question options
    const deletedOptions = await prisma.questionOption.deleteMany({})
    console.log(`   Deleted ${deletedOptions.count} question options`)
    
    // Delete questions
    const deletedQuestions = await prisma.question.deleteMany({})
    console.log(`   Deleted ${deletedQuestions.count} questions`)
    
    // Delete chat messages in quiz-related chat rooms
    const quizChatRooms = await prisma.chatRoom.findMany({
      where: { quizId: { not: null } }
    })
    
    if (quizChatRooms.length > 0) {
      // Delete message reactions first
      await prisma.messageReaction.deleteMany({
        where: {
          message: {
            chatRoomId: { in: quizChatRooms.map(room => room.id) }
          }
        }
      })
      
      // Delete chat messages
      const deletedMessages = await prisma.chatMessage.deleteMany({
        where: {
          chatRoomId: { in: quizChatRooms.map(room => room.id) }
        }
      })
      console.log(`   Deleted ${deletedMessages.count} chat messages`)
      
      // Delete quiz chat rooms
      const deletedChatRooms = await prisma.chatRoom.deleteMany({
        where: { quizId: { not: null } }
      })
      console.log(`   Deleted ${deletedChatRooms.count} quiz chat rooms`)
    }
    
    // Delete study groups related to quizzes
    const quizStudyGroups = await prisma.studyGroup.findMany({
      where: { quizId: { not: null } }
    })
    
    if (quizStudyGroups.length > 0) {
      // Delete user study group memberships
      await prisma.userStudyGroup.deleteMany({
        where: {
          groupId: { in: quizStudyGroups.map(group => group.id) }
        }
      })
      
      // Delete study groups
      const deletedStudyGroups = await prisma.studyGroup.deleteMany({
        where: { quizId: { not: null } }
      })
      console.log(`   Deleted ${deletedStudyGroups.count} quiz study groups`)
    }
    
    // Delete other quiz-related data
    const deletedBroadcasts = await prisma.quizBroadcast.deleteMany({})
    console.log(`   Deleted ${deletedBroadcasts.count} quiz broadcasts`)
    
    const deletedAnnouncements = await prisma.announcement.deleteMany({})
    console.log(`   Deleted ${deletedAnnouncements.count} announcements`)
    
    const deletedReminders = await prisma.studyReminder.deleteMany({})
    console.log(`   Deleted ${deletedReminders.count} study reminders`)
    
    const deletedHelpRequests = await prisma.helpRequest.deleteMany({})
    console.log(`   Deleted ${deletedHelpRequests.count} help requests`)
    
    const deletedHelpResponses = await prisma.helpResponse.deleteMany({})
    console.log(`   Deleted ${deletedHelpResponses.count} help responses`)
    
    // Finally, delete all quizzes
    const deletedQuizzes = await prisma.quiz.deleteMany({})
    console.log(`   Deleted ${deletedQuizzes.count} quizzes`)
    
    console.log('\n✅ Cleanup completed successfully!')
    console.log('🎉 All test quizzes and related data have been removed.')
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the cleanup
cleanupTestQuizzes()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
