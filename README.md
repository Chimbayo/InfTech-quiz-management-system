# Quiz Management System

A comprehensive quiz management system built with Next.js, TypeScript, and PostgreSQL. This application allows admins to create and manage quizzes while students can take quizzes and receive instant feedback.

## Features

### Admin Features
- **Dashboard**: View quiz statistics and manage all quizzes
- **Quiz Creation**: Create quizzes with multiple-choice and true/false questions
- **Quiz Management**: Edit, delete, and view result for quizzes
- **Results Analytics**: View detailed quiz attempt results and statistics

### Student Features
- **Quiz Taking**: Take available quizzes with real-time timer
- **Instant Feedback**: Receive immediate pass/fail results
- **Results Review**: View detailed results with correct answers
- **History**: Track all quiz attempts and scores

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui with Radix UI primitives
- **Backend**: Next.js API Routes and Server Actions
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Custom session-based authentication
- **Validation**: Zod for schema validation

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd quiz-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Update `.env.local` with your database connection string:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/quiz_management"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Seed with sample data
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Demo Credentials

### Admin Login
- **Email**: admin@example.com
- **Password**: password123

### Student Login
- **Email**: student@example.com
- **Password**: password123

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin portal pages
│   ├── student/           # Student portal pages
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── admin/            # Admin-specific components
│   ├── student/          # Student-specific components
│   └── auth/             # Authentication components
├── lib/                  # Utility functions
│   ├── auth.ts          # Authentication helpers
│   ├── prisma.ts        # Prisma client
│   └── utils.ts         # General utilities
└── types/               # TypeScript type definitions
```

## Database Schema

The application uses the following main entities:

- **Users**: Admin and student accounts with role-based access
- **Quizzes**: Quiz metadata, settings, and creator information
- **Questions**: Individual quiz questions with type and order
- **QuestionOptions**: Answer options for each question
- **QuizAttempts**: Student quiz attempts with scores and timing
- **Answers**: Individual question answers within attempts

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Quizzes
- `GET /api/quizzes` - Get quizzes (role-based)
- `POST /api/quizzes` - Create new quiz (admin only)

### Quiz Attempts
- `POST /api/quiz-attempts` - Submit quiz attempt (student only)

## Key Features Implementation

### Role-Based Access Control
- Admin and student roles with different permissions
- Protected routes and API endpoints
- Session-based authentication

### Quiz Creation
- Dynamic question and option management
- Support for multiple-choice and true/false questions
- Configurable passing scores and time limits

### Quiz Taking
- Real-time timer with automatic submission
- Progress tracking and navigation
- Immediate scoring and feedback

### Results System
- Detailed answer review with correct solutions
- Pass/fail determination based on configurable criteria
- Historical attempt tracking

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data

### Database Management

```bash
# View database in Prisma Studio
npm run db:studio

# Reset and reseed database
npm run db:push
npm run db:seed
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
