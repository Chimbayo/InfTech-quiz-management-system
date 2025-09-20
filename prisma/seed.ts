import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Hash the password
  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  // Create student user
  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      email: 'student@example.com',
      name: 'Student User',
      password: hashedPassword,
      role: 'STUDENT',
    },
  })

  // Create sample quiz
  const quiz = await prisma.quiz.upsert({
    where: { id: 'sample-quiz-1' },
    update: {},
    create: {
      id: 'sample-quiz-1',
      title: 'JavaScript Fundamentals',
      description: 'Test your knowledge of JavaScript basics including variables, functions, and data types.',
      passingScore: 70,
      timeLimit: 30,
      creatorId: admin.id,
      questions: {
        create: [
          {
            text: 'What is the correct way to declare a variable in JavaScript?',
            type: 'MULTIPLE_CHOICE',
            order: 1,
            options: {
              create: [
                { text: 'var myVar = 5;', isCorrect: true, order: 1 },
                { text: 'variable myVar = 5;', isCorrect: false, order: 2 },
                { text: 'v myVar = 5;', isCorrect: false, order: 3 },
                { text: 'declare myVar = 5;', isCorrect: false, order: 4 },
              ],
            },
          },
          {
            text: 'Which of the following is NOT a JavaScript data type?',
            type: 'MULTIPLE_CHOICE',
            order: 2,
            options: {
              create: [
                { text: 'String', isCorrect: false, order: 1 },
                { text: 'Boolean', isCorrect: false, order: 2 },
                { text: 'Float', isCorrect: true, order: 3 },
                { text: 'Number', isCorrect: false, order: 4 },
              ],
            },
          },
          {
            text: 'JavaScript is a case-sensitive language.',
            type: 'TRUE_FALSE',
            order: 3,
            options: {
              create: [
                { text: 'True', isCorrect: true, order: 1 },
                { text: 'False', isCorrect: false, order: 2 },
              ],
            },
          },
          {
            text: 'What does the "===" operator do in JavaScript?',
            type: 'MULTIPLE_CHOICE',
            order: 4,
            options: {
              create: [
                { text: 'Assigns a value', isCorrect: false, order: 1 },
                { text: 'Compares values and types', isCorrect: true, order: 2 },
                { text: 'Compares only values', isCorrect: false, order: 3 },
                { text: 'Checks if a variable exists', isCorrect: false, order: 4 },
              ],
            },
          },
          {
            text: 'Functions in JavaScript can be declared using the "function" keyword.',
            type: 'TRUE_FALSE',
            order: 5,
            options: {
              create: [
                { text: 'True', isCorrect: true, order: 1 },
                { text: 'False', isCorrect: false, order: 2 },
              ],
            },
          },
        ],
      },
    },
  })

  // Create another sample quiz
  const quiz2 = await prisma.quiz.upsert({
    where: { id: 'sample-quiz-2' },
    update: {},
    create: {
      id: 'sample-quiz-2',
      title: 'React Basics',
      description: 'Test your understanding of React fundamentals including components, props, and state.',
      passingScore: 60,
      timeLimit: 20,
      creatorId: admin.id,
      questions: {
        create: [
          {
            text: 'What is React?',
            type: 'MULTIPLE_CHOICE',
            order: 1,
            options: {
              create: [
                { text: 'A JavaScript library for building user interfaces', isCorrect: true, order: 1 },
                { text: 'A programming language', isCorrect: false, order: 2 },
                { text: 'A database', isCorrect: false, order: 3 },
                { text: 'A CSS framework', isCorrect: false, order: 4 },
              ],
            },
          },
          {
            text: 'React components must return JSX.',
            type: 'TRUE_FALSE',
            order: 2,
            options: {
              create: [
                { text: 'True', isCorrect: false, order: 1 },
                { text: 'False', isCorrect: true, order: 2 },
              ],
            },
          },
          {
            text: 'What is the purpose of props in React?',
            type: 'MULTIPLE_CHOICE',
            order: 3,
            options: {
              create: [
                { text: 'To store component state', isCorrect: false, order: 1 },
                { text: 'To pass data to components', isCorrect: true, order: 2 },
                { text: 'To handle events', isCorrect: false, order: 3 },
                { text: 'To style components', isCorrect: false, order: 4 },
              ],
            },
          },
        ],
      },
    },
  })

  console.log('Database seeded successfully!')
  console.log('Admin user:', admin.email)
  console.log('Student user:', student.email)
  console.log('Sample quizzes created:', quiz.title, 'and', quiz2.title)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
