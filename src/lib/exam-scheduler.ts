/**
 * Exam Scheduler Utility
 * Handles the scheduling and automatic creation of post-exam chat rooms
 */

import { prisma } from '@/lib/prisma'

export class ExamScheduler {
  private static instance: ExamScheduler
  private intervalId: NodeJS.Timeout | null = null
  private isRunning = false

  private constructor() {}

  public static getInstance(): ExamScheduler {
    if (!ExamScheduler.instance) {
      ExamScheduler.instance = new ExamScheduler()
    }
    return ExamScheduler.instance
  }

  /**
   * Start the scheduler to check for ended exams every 5 minutes
   */
  public start(intervalMinutes: number = 5): void {
    if (this.isRunning) {
      console.log('Exam scheduler is already running')
      return
    }

    console.log(`Starting exam scheduler - checking every ${intervalMinutes} minutes`)
    
    // Run immediately on start
    this.checkEndedExams()

    // Then run at intervals
    this.intervalId = setInterval(() => {
      this.checkEndedExams()
    }, intervalMinutes * 60 * 1000)

    this.isRunning = true
  }

  /**
   * Stop the scheduler
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('Exam scheduler stopped')
  }

  /**
   * Check for ended exams and create post-exam chat rooms
   */
  private async checkEndedExams(): Promise<void> {
    try {
      console.log('🔍 Checking for ended exams...')
      
      const now = new Date()
      
      // Find exams that have ended but don't have post-exam chat rooms yet
      const endedExams = await prisma.quiz.findMany({
        where: {
          // @ts-ignore - isExam field exists in schema but may not be in generated types yet
          isExam: true,
          // @ts-ignore - examEndTime field exists in schema but may not be in generated types yet
          examEndTime: {
            lte: now
          },
          chatRooms: {
            none: {
              type: {
                in: ['POST_EXAM_DISCUSSION', 'EXAM_GENERAL_DISCUSSION']
              }
            }
          }
        },
        include: {
          chatRooms: true,
          creator: true
        }
      })

      if (endedExams.length === 0) {
        console.log('📝 No ended exams found that need post-exam rooms')
        return
      }

      console.log(`📚 Found ${endedExams.length} ended exams that need post-exam rooms`)

      // Create post-exam chat rooms for each ended exam
      for (const exam of endedExams) {
        try {
          // Create post-exam discussion room
          const postExamRoom = await prisma.chatRoom.create({
            data: {
              name: `${exam.title} - Post-Exam Discussion`,
              description: `Discussion room for ${exam.title} exam participants`,
              type: 'POST_EXAM_DISCUSSION',
              quizId: exam.id,
              createdBy: exam.creatorId,
              isActive: true
            }
          })

          // Create general discussion room for the exam
          const generalRoom = await prisma.chatRoom.create({
            data: {
              name: `${exam.title} - General Discussion`,
              description: `General discussion about ${exam.title} exam`,
              type: 'EXAM_GENERAL_DISCUSSION',
              quizId: exam.id,
              createdBy: exam.creatorId,
              isActive: true
            }
          })

          // Add welcome messages to both rooms
          await prisma.chatMessage.createMany({
            data: [
              {
                content: `Welcome to the post-exam discussion for ${exam.title}! You can now discuss the exam content and share your thoughts with fellow students. Please maintain academic integrity and avoid sharing specific answers.`,
                userId: exam.creatorId,
                roomId: postExamRoom.id,
                isSystemMessage: true
              },
              {
                content: `This is the general discussion room for ${exam.title}. Feel free to discuss study strategies, concepts, and general thoughts about the exam. Remember to be respectful and supportive of your peers.`,
                userId: exam.creatorId,
                roomId: generalRoom.id,
                isSystemMessage: true
              }
            ]
          })

          console.log(`✅ Created post-exam rooms for: ${exam.title}`)

        } catch (error) {
          console.error(`❌ Failed to create rooms for: ${exam.title} - ${error}`)
        }
      }

    } catch (error) {
      console.error('❌ Error checking ended exams:', error)
    }
  }

  /**
   * Manually trigger a check for ended exams
   */
  public async triggerCheck(): Promise<void> {
    await this.checkEndedExams()
  }

  /**
   * Get the current status of the scheduler
   */
  public getStatus(): { isRunning: boolean; intervalId: NodeJS.Timeout | null } {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId
    }
  }
}

// Export a singleton instance
export const examScheduler = ExamScheduler.getInstance()

// Auto-start the scheduler in production
// Temporarily disabled to prevent connection errors during development
// if (process.env.NODE_ENV === 'production') {
//   examScheduler.start(5) // Check every 5 minutes in production
// } else if (process.env.NODE_ENV === 'development') {
//   examScheduler.start(1) // Check every 1 minute in development for testing
// }
