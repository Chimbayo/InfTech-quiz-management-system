import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Import schedulers to ensure they start
import '@/lib/exam-scheduler'
import '@/lib/reminder-scheduler'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Quiz Management System',
  description: 'A comprehensive quiz management system for admins and students',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-inftech-gradient antialiased`}>
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
