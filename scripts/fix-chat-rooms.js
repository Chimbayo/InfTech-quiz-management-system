const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixChatRooms() {
  try {
    console.log('Updating existing chat rooms to set isActive = true...')
    
    // Update all chat rooms that don't have isActive set to true
    const result = await prisma.chatRoom.updateMany({
      where: {
        isActive: false
      },
      data: {
        isActive: true
      }
    })
    
    console.log(`Updated ${result.count} chat rooms`)
    
    // List all chat rooms to verify
    const allRooms = await prisma.chatRoom.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        isActive: true,
        quiz: {
          select: {
            title: true
          }
        }
      }
    })
    
    console.log('\nAll chat rooms:')
    allRooms.forEach(room => {
      console.log(`- ${room.name} (${room.type}) - Active: ${room.isActive}${room.quiz ? ` - Quiz: ${room.quiz.title}` : ''}`)
    })
    
  } catch (error) {
    console.error('Error fixing chat rooms:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixChatRooms()
