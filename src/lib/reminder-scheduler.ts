/**
 * Study Reminder Scheduler
 * Handles automatic checking and sending of study reminder emails
 */

import { prisma } from './prisma'
import nodemailer from 'nodemailer'

export class ReminderScheduler {
  private static instance: ReminderScheduler
  private intervalId: NodeJS.Timeout | null = null
  private isRunning = false

  private constructor() {}

  public static getInstance(): ReminderScheduler {
    if (!ReminderScheduler.instance) {
      ReminderScheduler.instance = new ReminderScheduler()
    }
    return ReminderScheduler.instance
  }

  /**
   * Start the scheduler to check for due reminders every minute
   */
  public start(intervalMinutes: number = 1): void {
    if (this.isRunning) {
      console.log('Reminder scheduler is already running')
      return
    }

    console.log(`Starting reminder scheduler - checking every ${intervalMinutes} minutes`)
    
    // Run immediately on start
    this.checkDueReminders()

    // Then run at intervals
    this.intervalId = setInterval(() => {
      this.checkDueReminders()
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
    console.log('Reminder scheduler stopped')
  }

  /**
   * Check for due reminders and send emails
   */
  private async checkDueReminders(): Promise<void> {
    try {
      console.log('🔍 Checking for due study reminders...')
      
      const now = new Date()
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000) // 5 minutes ago
      
      // Find reminders that are due (within the last 5 minutes)
      const dueReminders = await prisma.studyReminder.findMany({
        where: {
          isActive: true,
          reminderTime: {
            gte: fiveMinutesAgo,
            lte: now
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              notificationSettings: true
            }
          },
          quiz: {
            select: {
              title: true,
              description: true,
              passingScore: true
            }
          }
        }
      })

      if (dueReminders.length === 0) {
        console.log('📝 No due reminders found')
        return
      }

      console.log(`📧 Found ${dueReminders.length} due reminders`)

      for (const reminder of dueReminders) {
        try {
          // Check if user has email notifications enabled
          const user = (reminder as any).user
          const notificationSettings = user.notificationSettings as any
          const emailEnabled = notificationSettings?.emailNotifications !== false

          if (!emailEnabled) {
            console.log(`⏭️ Skipping email for ${user.email} - email notifications disabled`)
            continue
          }

          if (!user.email) {
            console.log(`⏭️ Skipping reminder ${reminder.id} - user has no email`)
            continue
          }

          // Send email
          await this.sendReminderEmail(reminder)

          console.log(`✅ Sent reminder email to ${(reminder as any).user.email} for: ${reminder.title}`)

        } catch (error) {
          console.error(`❌ Failed to send reminder email for ${reminder.id}:`, error)
        }
      }

    } catch (error) {
      console.error('❌ Error checking due reminders:', error)
    }
  }

  /**
   * Send reminder email
   */
  private async sendReminderEmail(reminder: any): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    // Create email content based on reminder type
    let emailSubject = ''
    let emailContent = ''
    
    const reminderTime = new Date(reminder.reminderTime).toLocaleString()
    
    switch (reminder.type) {
      case 'QUIZ_DEADLINE':
        emailSubject = `📚 Quiz Reminder: ${reminder.quiz?.title || reminder.title}`
        emailContent = this.createQuizReminderEmail(reminder, reminderTime)
        break
        
      case 'STUDY_SESSION':
        emailSubject = `📅 Study Session Reminder: ${reminder.title}`
        emailContent = this.createStudySessionEmail(reminder, reminderTime)
        break
        
      default:
        emailSubject = `🔔 Study Reminder: ${reminder.title}`
        emailContent = this.createCustomReminderEmail(reminder, reminderTime)
    }

    await transporter.sendMail({
      from: `"InfTech Quiz System" <${process.env.SMTP_USER}>`,
      to: reminder.user.email,
      subject: emailSubject,
      html: emailContent,
    })
  }

  private createQuizReminderEmail(reminder: any, reminderTime: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">📚 Quiz Reminder</h1>
          <p style="color: #e2e8f0; margin: 10px 0 0 0; font-size: 16px;">InfTech Quiz Management System</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #1e293b; margin-bottom: 20px;">Hello ${reminder.user.name}!</h2>
          
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            This is a friendly reminder about your upcoming quiz:
          </p>
          
          <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h3 style="color: #1e293b; margin: 0 0 10px 0;">${reminder.quiz?.title || reminder.title}</h3>
            <p style="color: #64748b; margin: 0; font-size: 14px;">
              ${reminder.quiz?.description || reminder.description}
            </p>
            ${reminder.quiz?.passingScore ? `<p style="color: #059669; margin: 10px 0 0 0; font-weight: bold;">Passing Score: ${reminder.quiz.passingScore}%</p>` : ''}
          </div>
          
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            <strong>Reminder Time:</strong> ${reminderTime}
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}/student/dashboard" 
               style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 30px;">
            Good luck with your studies! 🎯
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 12px;">
          <p>This email was sent by InfTech Quiz Management System</p>
          <p>If you no longer wish to receive these notifications, you can disable them in your dashboard settings.</p>
        </div>
      </div>
    `
  }

  private createStudySessionEmail(reminder: any, reminderTime: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">📅 Study Session Reminder</h1>
          <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">InfTech Quiz Management System</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #1e293b; margin-bottom: 20px;">Hello ${reminder.user.name}!</h2>
          
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            Don't forget about your upcoming study session:
          </p>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="color: #1e293b; margin: 0 0 10px 0;">${reminder.title}</h3>
            <p style="color: #64748b; margin: 0; font-size: 14px;">
              ${reminder.description}
            </p>
          </div>
          
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            <strong>Session Time:</strong> ${reminderTime}
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}/student/dashboard" 
               style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Join Study Session
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 30px;">
            Happy studying! 📖
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 12px;">
          <p>This email was sent by InfTech Quiz Management System</p>
          <p>If you no longer wish to receive these notifications, you can disable them in your dashboard settings.</p>
        </div>
      </div>
    `
  }

  private createCustomReminderEmail(reminder: any, reminderTime: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🔔 Study Reminder</h1>
          <p style="color: #e9d5ff; margin: 10px 0 0 0; font-size: 16px;">InfTech Quiz Management System</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #1e293b; margin-bottom: 20px;">Hello ${reminder.user.name}!</h2>
          
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            Here's your personalized study reminder:
          </p>
          
          <div style="background: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
            <h3 style="color: #1e293b; margin: 0 0 10px 0;">${reminder.title}</h3>
            <p style="color: #64748b; margin: 0; font-size: 14px;">
              ${reminder.description}
            </p>
          </div>
          
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            <strong>Reminder Time:</strong> ${reminderTime}
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}/student/dashboard" 
               style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 30px;">
            Keep up the great work! 💪
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 12px;">
          <p>This email was sent by InfTech Quiz Management System</p>
          <p>If you no longer wish to receive these notifications, you can disable them in your dashboard settings.</p>
        </div>
      </div>
    `
  }

  /**
   * Manually trigger a check for due reminders
   */
  public async triggerCheck(): Promise<void> {
    await this.checkDueReminders()
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
export const reminderScheduler = ReminderScheduler.getInstance()

// Auto-start the scheduler
if (process.env.NODE_ENV === 'production') {
  reminderScheduler.start(1) // Check every 1 minute in production
} else if (process.env.NODE_ENV === 'development') {
  reminderScheduler.start(1) // Check every 1 minute in development for testing
}
