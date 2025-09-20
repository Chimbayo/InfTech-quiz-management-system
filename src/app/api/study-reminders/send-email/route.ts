import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'

// Email configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole('STUDENT')
    const { reminderId, userEmail } = await request.json()

    if (!reminderId || !userEmail) {
      return NextResponse.json(
        { error: 'Reminder ID and email are required' },
        { status: 400 }
      )
    }

    // Get the reminder details
    const reminder = await prisma.studyReminder.findUnique({
      where: { id: reminderId },
      include: {
        quiz: {
          select: {
            title: true,
            description: true,
            passingScore: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!reminder) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      )
    }

    // Verify the reminder belongs to the authenticated user
    if (reminder.userId !== session.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Create email content based on reminder type
    let emailSubject = ''
    let emailContent = ''
    
    const reminderTime = new Date(reminder.reminderTime).toLocaleString()
    
    switch (reminder.type) {
      case 'QUIZ_DEADLINE':
        emailSubject = `📚 Quiz Reminder: ${reminder.quiz?.title || reminder.title}`
        emailContent = `
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
        break
        
      case 'STUDY_SESSION':
        emailSubject = `📅 Study Session Reminder: ${reminder.title}`
        emailContent = `
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
        break
        
      default:
        emailSubject = `🔔 Study Reminder: ${reminder.title}`
        emailContent = `
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

    // Send email
    const transporter = createTransporter()
    
    await transporter.sendMail({
      from: `"InfTech Quiz System" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: emailSubject,
      html: emailContent,
    })

    // Log the email send
    console.log(`📧 Study reminder email sent to ${userEmail} for reminder: ${reminder.title}`)

    return NextResponse.json({
      success: true,
      message: 'Reminder email sent successfully'
    })

  } catch (error) {
    console.error('Send reminder email error:', error)
    return NextResponse.json(
      { error: 'Failed to send reminder email' },
      { status: 500 }
    )
  }
}
