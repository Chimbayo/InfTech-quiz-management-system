const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createTestStudyData() {
  try {
    console.log('Creating test study data...')

    // Find or create a test student user
    let student = await prisma.user.findFirst({
      where: { role: 'STUDENT' }
    })

    if (!student) {
      student = await prisma.user.create({
        data: {
          email: 'student@test.com',
          name: 'Test Student',
          password: 'password123',
          role: 'STUDENT'
        }
      })
      console.log('Created test student:', student.email)
    }

    // Find or create a test teacher
    let teacher = await prisma.user.findFirst({
      where: { role: 'TEACHER' }
    })

    if (!teacher) {
      teacher = await prisma.user.create({
        data: {
          email: 'teacher@test.com',
          name: 'Test Teacher',
          password: 'password123',
          role: 'TEACHER'
        }
      })
      console.log('Created test teacher:', teacher.email)
    }

    // Create test quizzes with chat enabled
    const testQuizzes = [
      {
        title: 'Mathematics - Algebra Basics',
        description: 'Test your knowledge of algebraic equations and functions',
        passingScore: 70,
        timeLimit: 30,
        enableChat: true,
        creatorId: teacher.id
      },
      {
        title: 'Science - Physics Fundamentals',
        description: 'Understanding motion, forces, and energy',
        passingScore: 75,
        timeLimit: 45,
        enableChat: true,
        creatorId: teacher.id
      },
      {
        title: 'Computer Science - JavaScript Basics',
        description: 'Learn the fundamentals of JavaScript programming',
        passingScore: 80,
        timeLimit: 60,
        enableChat: true,
        creatorId: teacher.id
      }
    ]

    for (const quizData of testQuizzes) {
      const existingQuiz = await prisma.quiz.findFirst({
        where: { title: quizData.title }
      })

      if (!existingQuiz) {
        const quiz = await prisma.quiz.create({
          data: quizData
        })

        // Add sample questions
        await prisma.question.createMany({
          data: [
            {
              text: 'What is 2 + 2?',
              type: 'MULTIPLE_CHOICE',
              order: 1,
              quizId: quiz.id
            },
            {
              text: 'Is the sky blue?',
              type: 'TRUE_FALSE',
              order: 2,
              quizId: quiz.id
            }
          ]
        })

        // Create study group for this quiz
        const studyGroup = await prisma.studyGroup.create({
          data: {
            name: `${quiz.title} - Study Group`,
            description: `Collaborative study group for ${quiz.title}`,
            quizId: quiz.id,
            createdBy: teacher.id
          }
        })

        // Add student to study group
        await prisma.userStudyGroup.create({
          data: {
            userId: student.id,
            groupId: studyGroup.id,
            role: 'member'
          }
        })

        // Create study group chat room
        const chatRoom = await prisma.chatRoom.create({
          data: {
            name: `${quiz.title} - Study Group Chat`,
            description: 'Private chat for study group members',
            type: 'STUDY_GROUP',
            studyGroupId: studyGroup.id,
            createdBy: teacher.id,
            allowChatDuringQuiz: true,
            isActive: true
          }
        })

        // Add welcome message
        await prisma.chatMessage.create({
          data: {
            roomId: chatRoom.id,
            userId: teacher.id,
            content: `Welcome to the "${quiz.title}" study group! This is your space to collaborate and help each other succeed.`,
            isSystemMessage: true
          }
        })

        console.log(`Created quiz: ${quiz.title} with study group and chat room`)
      }
    }

    // Create sample study sessions
    const studyGroups = await prisma.studyGroup.findMany({
      where: {
        members: {
          some: {
            userId: student.id
          }
        }
      }
    })

    for (const group of studyGroups) {
      const existingSession = await prisma.studySession.findFirst({
        where: { studyGroupId: group.id }
      })

      if (!existingSession) {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 1) // Tomorrow
        futureDate.setHours(14, 0, 0, 0) // 2 PM

        await prisma.studySession.create({
          data: {
            name: `${group.name} - Study Session`,
            description: 'Group study session to prepare for the quiz',
            studyGroupId: group.id,
            quizId: group.quizId,
            createdBy: teacher.id,
            startTime: futureDate,
            endTime: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000) // 2 hours later
          }
        })

        console.log(`Created study session for: ${group.name}`)
      }
    }

    // Create sample help requests
    const quizzes = await prisma.quiz.findMany()
    
    for (const quiz of quizzes.slice(0, 2)) {
      const existingRequest = await prisma.helpRequest.findFirst({
        where: { 
          userId: student.id,
          quizId: quiz.id 
        }
      })

      if (!existingRequest) {
        await prisma.helpRequest.create({
          data: {
            topic: `Understanding ${quiz.title.split(' - ')[1] || quiz.title}`,
            question: `I'm having trouble understanding some concepts in ${quiz.title}. Could someone help explain the basics?`,
            priority: 'MEDIUM',
            status: 'OPEN',
            userId: student.id,
            quizId: quiz.id
          }
        })

        console.log(`Created help request for: ${quiz.title}`)
      }
    }

    // Create sample study reminders
    try {
      const existingReminder = await prisma.studyReminder.findFirst({
        where: { userId: student.id }
      })

      if (!existingReminder) {
        const reminderDate = new Date()
        reminderDate.setDate(reminderDate.getDate() + 1)
        reminderDate.setHours(10, 0, 0, 0) // 10 AM tomorrow

        await prisma.studyReminder.create({
          data: {
            title: 'Study for Math Quiz',
            description: 'Review algebra concepts before the quiz',
            type: 'QUIZ_DEADLINE',
            reminderTime: reminderDate,
            userId: student.id,
            quizId: quizzes[0].id,
            isActive: true
          }
        })

        console.log('Created sample study reminder')
      }
    } catch (error) {
      console.log('Skipping study reminder creation - model may not exist')
    }

    // Skip progress milestones for now
    console.log('Skipping progress milestone creation')

    // Create notification settings
    const existingSettings = await prisma.userNotificationSettings.findFirst({
      where: { userId: student.id }
    })

    if (!existingSettings) {
      await prisma.userNotificationSettings.create({
        data: {
          userId: student.id,
          emailNotifications: true,
          pushNotifications: true,
          reminderFrequency: '1_HOUR',
          autoReminders: true
        }
      })

      console.log('Created notification settings')
    }

    console.log('✅ Test study data creation completed successfully!')
    
    // Display summary
    const summary = {
      users: await prisma.user.count(),
      quizzes: await prisma.quiz.count(),
      studyGroups: await prisma.studyGroup.count(),
      studySessions: await prisma.studySession.count(),
      chatRooms: await prisma.chatRoom.count()
    }

    console.log('\n📊 Database Summary:')
    console.table(summary)

  } catch (error) {
    console.error('Error creating test data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestStudyData()
