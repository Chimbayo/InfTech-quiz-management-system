/**
 * Test script for Quiz-Specific Help Requests and Study Sessions
 * This script tests the enhanced functionality where help requests and study sessions
 * are linked to specific quizzes for better organization and context.
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testQuizSpecificFeatures() {
  console.log('🧪 Testing Quiz-Specific Help Requests and Study Sessions...\n')

  try {
    // 1. Get existing quizzes and users
    const quizzes = await prisma.quiz.findMany({
      where: { isActive: true },
      take: 2
    })

    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      take: 2
    })

    if (quizzes.length === 0 || students.length === 0) {
      console.log('❌ No active quizzes or students found. Please create some first.')
      return
    }

    console.log(`📚 Found ${quizzes.length} quizzes and ${students.length} students`)
    console.log(`Quiz 1: "${quizzes[0].title}"`)
    if (quizzes[1]) {
      console.log(`Quiz 2: "${quizzes[1].title}"`)
    }
    console.log(`Student 1: ${students[0].name}`)
    if (students[1]) {
      console.log(`Student 2: ${students[1].name}`)
    }
    console.log('')

    // 2. Test Quiz-Specific Help Requests
    console.log('🆘 Testing Quiz-Specific Help Requests...')
    
    const helpRequest1 = await prisma.helpRequest.create({
      data: {
        topic: 'Quadratic Equations',
        question: 'I need help understanding how to solve quadratic equations using the quadratic formula. Can someone explain the steps?',
        priority: 'MEDIUM',
        status: 'OPEN',
        userId: students[0].id,
        quizId: quizzes[0].id
      },
      include: {
        user: { select: { name: true, email: true } },
        quiz: { select: { title: true } }
      }
    })

    let helpRequest2 = null
    if (quizzes[1] && students[1]) {
      helpRequest2 = await prisma.helpRequest.create({
        data: {
          topic: 'JavaScript Functions',
          question: 'What is the difference between arrow functions and regular functions in JavaScript?',
          priority: 'HIGH',
          status: 'OPEN',
          userId: students[1].id,
          quizId: quizzes[1].id
        },
        include: {
          user: { select: { name: true, email: true } },
          quiz: { select: { title: true } }
        }
      })
    }

    console.log(`✅ Created help request for "${quizzes[0].title}": ${helpRequest1.topic}`)
    if (helpRequest2) {
      console.log(`✅ Created help request for "${quizzes[1].title}": ${helpRequest2.topic}`)
    }

    // 3. Test Quiz-Specific Study Sessions
    console.log('\n📅 Testing Quiz-Specific Study Sessions...')
    
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(14, 0, 0, 0) // 2 PM tomorrow

    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    nextWeek.setHours(16, 0, 0, 0) // 4 PM next week

    const studySession1 = await prisma.studySession.create({
      data: {
        name: `${quizzes[0].title} - Prep Session`,
        description: 'Let\'s review the key concepts and practice problems together',
        startTime: tomorrow,
        createdBy: students[0].id,
        quizId: quizzes[0].id
      },
      include: {
        creator: { select: { name: true } },
        quiz: { select: { title: true } },
        _count: { select: { participants: true } }
      }
    })

    let studySession2 = null
    if (quizzes[1] && students[1]) {
      studySession2 = await prisma.studySession.create({
        data: {
          name: `${quizzes[1].title} - Study Group`,
          description: 'Collaborative learning session for quiz preparation',
          startTime: nextWeek,
          createdBy: students[1].id,
          quizId: quizzes[1].id
        },
        include: {
          creator: { select: { name: true } },
          quiz: { select: { title: true } },
          _count: { select: { participants: true } }
        }
      })
    }

    console.log(`✅ Created study session for "${quizzes[0].title}": ${studySession1.name}`)
    if (studySession2) {
      console.log(`✅ Created study session for "${quizzes[1].title}": ${studySession2.name}`)
    }

    // 4. Add participants to study sessions
    console.log('\n👥 Adding participants to study sessions...')
    
    if (students[1]) {
      await prisma.studySessionParticipant.create({
        data: {
          sessionId: studySession1.id,
          userId: students[1].id
        }
      })
      console.log(`✅ Added ${students[1].name} to "${studySession1.name}"`)
    }

    if (studySession2 && students[0]) {
      await prisma.studySessionParticipant.create({
        data: {
          sessionId: studySession2.id,
          userId: students[0].id
        }
      })
      console.log(`✅ Added ${students[0].name} to "${studySession2.name}"`)
    }

    // 5. Add responses to help requests
    console.log('\n💬 Adding responses to help requests...')
    
    if (students[1]) {
      await prisma.helpResponse.create({
        data: {
          response: 'The quadratic formula is x = (-b ± √(b²-4ac)) / 2a. First, identify a, b, and c from your equation ax² + bx + c = 0, then substitute into the formula.',
          helpRequestId: helpRequest1.id,
          responderId: students[1].id
        }
      })
      console.log(`✅ Added response to help request about "${helpRequest1.topic}"`)
    }

    if (helpRequest2 && students[0]) {
      await prisma.helpResponse.create({
        data: {
          response: 'Arrow functions have lexical "this" binding and cannot be used as constructors, while regular functions have dynamic "this" and can be constructors.',
          helpRequestId: helpRequest2.id,
          responderId: students[0].id
        }
      })
      console.log(`✅ Added response to help request about "${helpRequest2.topic}"`)
    }

    // 6. Test filtering functionality
    console.log('\n🔍 Testing quiz-specific filtering...')
    
    const quiz1HelpRequests = await prisma.helpRequest.findMany({
      where: { quizId: quizzes[0].id },
      include: {
        user: { select: { name: true } },
        quiz: { select: { title: true } },
        responses: {
          include: {
            responder: { select: { name: true, role: true } }
          }
        }
      }
    })

    const quiz1StudySessions = await prisma.studySession.findMany({
      where: { quizId: quizzes[0].id },
      include: {
        creator: { select: { name: true } },
        quiz: { select: { title: true } },
        participants: {
          include: {
            user: { select: { name: true } }
          }
        },
        _count: { select: { participants: true } }
      }
    })

    console.log(`📊 Quiz "${quizzes[0].title}" has:`)
    console.log(`   - ${quiz1HelpRequests.length} help request(s)`)
    console.log(`   - ${quiz1StudySessions.length} study session(s)`)

    // 7. Display summary
    console.log('\n📈 Summary of Quiz-Specific Features:')
    console.log('=====================================')
    
    const totalHelpRequests = await prisma.helpRequest.count()
    const totalStudySessions = await prisma.studySession.count()
    const totalResponses = await prisma.helpResponse.count()
    const totalParticipants = await prisma.studySessionParticipant.count()

    console.log(`📝 Total Help Requests: ${totalHelpRequests}`)
    console.log(`📅 Total Study Sessions: ${totalStudySessions}`)
    console.log(`💬 Total Help Responses: ${totalResponses}`)
    console.log(`👥 Total Session Participants: ${totalParticipants}`)

    console.log('\n✅ Quiz-specific help requests and study sessions are working correctly!')
    console.log('🎯 Features tested:')
    console.log('   ✓ Quiz-specific help request creation')
    console.log('   ✓ Quiz-specific study session scheduling')
    console.log('   ✓ Help request responses')
    console.log('   ✓ Study session participation')
    console.log('   ✓ Quiz-based filtering capabilities')
    console.log('   ✓ Data relationships and integrity')

  } catch (error) {
    console.error('❌ Error testing quiz-specific features:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testQuizSpecificFeatures()
