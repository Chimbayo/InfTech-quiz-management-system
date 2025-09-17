# InfTech Quiz & Chatboard Management System

A comprehensive, intelligent quiz and collaborative learning platform built with Next.js, TypeScript, and modern real-time technologies. This advanced system combines quiz management with WhatsApp-style real-time messaging, learning analytics, academic integrity monitoring, and gamification features to create a complete educational ecosystem.

## Features

### 🎯 Core Quiz Management

#### Admin Features
- **Enhanced Dashboard**: Comprehensive analytics with learning insights and predictive intelligence
- **Quiz Creation**: Advanced quiz builder with chat integration options
- **Quiz Management**: Full CRUD operations with real-time collaboration features
- **Results Analytics**: Detailed performance analytics with AI-powered insights
- **Academic Integrity Monitoring**: Automated detection and reporting of potential violations
- **Quiz Announcements**: Broadcast system with templates and scheduling
- **Discussion Schedule Management**: Control chat phases (pre-quiz, during-quiz, post-quiz)

#### Student Features
- **Interactive Quiz Taking**: Enhanced quiz experience with real-time timer and chat integration
- **Instant Feedback**: Immediate results with detailed explanations
- **Results Review**: Comprehensive answer analysis with learning recommendations
- **Achievement System**: Gamified progress tracking with badges and streaks
- **Study History**: Complete academic journey tracking

### 💬 Real-Time Chat & Collaboration

#### WhatsApp-Style Messaging
- **Real-time Messaging**: Instant message delivery with Socket.IO
- **Typing Indicators**: Live typing status with animated dots
- **Message Actions**: Reply, edit, delete, copy, and react to messages
- **Emoji Reactions**: Quick reactions with real-time updates
- **Message Status**: Comprehensive delivery and read receipts
- **User Presence**: Online/offline status and room participant counts

#### Chat Room Management
- **Quiz-Specific Chat Rooms**: Automatic creation for quiz discussions
- **General Study Rooms**: Open collaboration spaces
- **Study Group Creation**: Organized group discussions with automatic chat integration
- **Room Navigation**: Direct links and seamless room switching

### 📊 Advanced Analytics & Intelligence

#### Learning Analytics Dashboard
- **Performance Correlation**: Chat engagement vs quiz performance analysis
- **Peer Learning Metrics**: Collaboration effectiveness tracking
- **Teacher Intervention Tracking**: Support activity monitoring
- **Study Group Effectiveness**: Group performance analytics

#### Predictive Analytics
- **AI-Powered Success Prediction**: Student performance forecasting
- **Risk Assessment**: Early identification of struggling students
- **Intervention Recommendations**: Data-driven support suggestions
- **Early Warning System**: Proactive academic support alerts

#### Academic Integrity Monitoring
- **Keyword Detection**: Automated suspicious content identification
- **Behavioral Pattern Analysis**: Unusual activity detection
- **Comprehensive Reporting**: Detailed violation tracking and analysis
- **Real-time Alerts**: Immediate notification of potential issues

### 🎮 Gamification & Engagement

#### Achievement System
- **Study Streaks**: Consecutive learning day tracking
- **Peer Helper Badges**: Recognition for collaborative assistance
- **Quiz Mastery Levels**: Progressive skill recognition
- **Study Group Achievements**: Team-based accomplishments
- **Progress Milestones**: Celebration of learning goals

#### Engagement Features
- **Interactive Progress Tracking**: Visual learning journey
- **Leaderboards**: Friendly competition and motivation
- **Achievement Notifications**: Real-time celebration of milestones
- **Personalized Learning Paths**: Adaptive content recommendations

## Tech Stack

### Core Technologies
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui with Radix UI primitives, Lucide React icons
- **Backend**: Next.js API Routes and Server Actions
- **Database**: SQLite with Prisma ORM (production-ready with PostgreSQL support)
- **Authentication**: Custom session-based authentication with role-based access control
- **Validation**: Zod for comprehensive schema validation

### Real-Time & Communication
- **WebSocket**: Socket.IO for real-time messaging and live updates
- **Custom Server**: Enhanced Next.js server with Socket.IO integration
- **Event Handling**: Real-time chat events, typing indicators, and presence management

### Analytics & Intelligence
- **Data Processing**: Advanced analytics with correlation analysis
- **Predictive Modeling**: AI-powered student success prediction algorithms
- **Pattern Recognition**: Behavioral analysis for academic integrity monitoring

### Design & User Experience
- **Professional Design System**: Consistent color palette and typography
- **Responsive Design**: Mobile-first approach with modern UI patterns
- **Accessibility**: WCAG compliant components and interactions
- **Animation**: Smooth transitions and micro-interactions

## Getting Started

### Prerequisites

- Node.js 18+ 
- SQLite (included) or PostgreSQL for production
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
   # For development (SQLite)
   DATABASE_URL="file:./dev.db"
   
   # For production (PostgreSQL)
   # DATABASE_URL="postgresql://username:password@localhost:5432/quiz_management"
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
   
   **Note**: The system uses a custom Socket.IO server for real-time features. The `npm run dev` command automatically starts both the Next.js application and the Socket.IO server.

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
│   │   ├── dashboard/     # Enhanced admin dashboard
│   │   ├── analytics/     # Learning & predictive analytics
│   │   ├── integrity/     # Academic integrity monitoring
│   │   └── chat/          # Admin chat management
│   ├── student/           # Student portal pages
│   │   ├── dashboard/     # Enhanced student dashboard
│   │   ├── chat/          # Real-time chat rooms
│   │   └── achievements/  # Gamification features
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── quizzes/       # Quiz management APIs
│   │   ├── chat/          # Chat and messaging APIs
│   │   ├── analytics/     # Analytics and reporting APIs
│   │   └── achievements/  # Gamification APIs
│   └── globals.css        # Global styles with design system
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── admin/            # Admin-specific components
│   │   ├── analytics/    # Analytics dashboards
│   │   ├── integrity/    # Academic integrity tools
│   │   └── chat/         # Admin chat management
│   ├── student/          # Student-specific components
│   │   ├── chat/         # Real-time chat components
│   │   ├── gamification/ # Achievement and progress tracking
│   │   └── dashboard/    # Enhanced dashboard components
│   ├── auth/             # Authentication components
│   └── shared/           # Shared utility components
├── lib/                  # Utility functions
│   ├── auth.ts          # Authentication helpers
│   ├── prisma.ts        # Prisma client
│   ├── socket.ts        # Socket.IO client utilities
│   ├── analytics.ts     # Analytics processing
│   └── utils.ts         # General utilities
├── hooks/                # Custom React hooks
│   ├── useWebSocket.ts  # Socket.IO connection hook
│   ├── useChat.ts       # Chat functionality hook
│   └── useAnalytics.ts  # Analytics data hook
├── types/                # TypeScript type definitions
│   ├── chat.ts          # Chat and messaging types
│   ├── analytics.ts     # Analytics data types
│   └── gamification.ts  # Achievement system types
└── server.js             # Custom Socket.IO server
```

## Database Schema

The application uses a comprehensive database schema with the following main entities:

### Core Quiz System
- **Users**: Admin and student accounts with role-based access and profile information
- **Quizzes**: Quiz metadata, settings, creator information, and chat integration flags
- **Questions**: Individual quiz questions with type, order, and content
- **QuestionOptions**: Answer options for each question with correctness indicators
- **QuizAttempts**: Student quiz attempts with scores, timing, and completion status
- **Answers**: Individual question answers within attempts with correctness tracking

### Real-Time Chat System
- **ChatRooms**: Chat room management with types (GENERAL, QUIZ_DISCUSSION, STUDY_GROUP)
- **ChatMessages**: Individual messages with content, timestamps, and user information
- **MessageReactions**: Emoji reactions to messages with user tracking
- **ChatRoomMembers**: User membership in chat rooms with join timestamps

### Analytics & Intelligence
- **LearningAnalytics**: Performance correlation data and engagement metrics
- **PredictiveAnalytics**: AI-powered student success predictions and risk assessments
- **IntegrityReports**: Academic integrity violation tracking and analysis
- **UserActivity**: Comprehensive activity logging for behavioral analysis

### Gamification System
- **Achievements**: Achievement definitions with criteria and rewards
- **UserAchievements**: User progress and earned achievements
- **StudyStreaks**: Consecutive learning day tracking
- **ProgressMilestones**: Learning goal tracking and celebration points

### Study Groups & Collaboration
- **StudyGroups**: Organized study group management with automatic chat integration
- **StudyGroupMembers**: Membership tracking with roles and permissions
- **GroupAchievements**: Team-based accomplishments and recognition

## API Endpoints

### Authentication & User Management
- `POST /api/auth/login` - User login with role-based routing
- `POST /api/auth/logout` - User logout with session cleanup
- `GET /api/auth/me` - Get current user profile and permissions

### Quiz Management
- `GET /api/quizzes` - Get quizzes with role-based filtering and chat room data
- `POST /api/quizzes` - Create new quiz with automatic chat room creation (admin only)
- `PUT /api/quizzes/[id]` - Update quiz settings and configuration (admin only)
- `DELETE /api/quizzes/[id]` - Delete quiz and associated data (admin only)
- `GET /api/quizzes/[id]/results` - Get detailed quiz results and analytics (admin only)

### Quiz Attempts & Results
- `POST /api/quiz-attempts` - Submit quiz attempt with real-time scoring (student only)
- `GET /api/quiz-attempts/[id]` - Get specific attempt details
- `GET /api/quiz-attempts/user/[userId]` - Get user's quiz attempt history

### Real-Time Chat & Messaging
- `GET /api/chat/rooms` - Get available chat rooms for user
- `POST /api/chat/rooms` - Create new chat room (admin/study group creation)
- `GET /api/chat/rooms/[id]/messages` - Get chat room message history
- `POST /api/chat/rooms/[id]/messages` - Send new message to chat room
- `PUT /api/chat/messages/[id]` - Edit existing message
- `DELETE /api/chat/messages/[id]` - Delete message (soft delete)
- `POST /api/chat/messages/[id]/reactions` - Add/toggle emoji reaction
- `GET /api/chat/messages/[id]/reactions` - Get message reactions

### Analytics & Intelligence
- `GET /api/analytics/learning` - Get learning analytics dashboard data (admin only)
- `GET /api/analytics/predictive` - Get predictive analytics and risk assessments (admin only)
- `GET /api/analytics/integrity` - Get academic integrity reports (admin only)
- `POST /api/analytics/integrity/report` - Report potential integrity violation (admin only)
- `GET /api/analytics/engagement` - Get chat engagement vs quiz performance data (admin only)

### Gamification & Achievements
- `GET /api/achievements` - Get available achievements and user progress
- `POST /api/achievements/unlock` - Unlock achievement for user
- `GET /api/achievements/leaderboard` - Get achievement leaderboard
- `GET /api/streaks/[userId]` - Get user's study streak information
- `POST /api/streaks/[userId]/update` - Update study streak progress

### Study Groups
- `GET /api/study-groups` - Get available study groups
- `POST /api/study-groups` - Create new study group with chat integration
- `POST /api/study-groups/[id]/join` - Join study group
- `DELETE /api/study-groups/[id]/leave` - Leave study group

### Admin Management
- `GET /api/admin/dashboard` - Get comprehensive admin dashboard data
- `POST /api/admin/announcements` - Create quiz announcements
- `GET /api/admin/chat/overview` - Get chat system overview and statistics
- `POST /api/admin/chat/schedule` - Manage discussion schedule phases

## Key Features Implementation

### Real-Time Communication Architecture
- **Socket.IO Integration**: Custom server with real-time event handling
- **Event System**: Comprehensive event broadcasting for chat, typing, presence
- **Connection Management**: Automatic reconnection and connection status tracking
- **Room Management**: Dynamic room joining/leaving with user presence updates

### Advanced Analytics Engine
- **Correlation Analysis**: Chat engagement vs quiz performance tracking
- **Predictive Modeling**: AI-powered student success prediction algorithms
- **Behavioral Analysis**: Pattern recognition for academic integrity monitoring
- **Real-time Insights**: Live dashboard updates with actionable intelligence

### Professional Design System
- **Consistent Branding**: Professional color palette with role-specific themes
- **Modern UI Components**: Enhanced cards, buttons, and interactive elements
- **Responsive Design**: Mobile-first approach with seamless cross-device experience
- **Accessibility**: WCAG compliant components with keyboard navigation support

### Enhanced Role-Based Access Control
- **Multi-tier Permissions**: Admin, student, and system-level access controls
- **Protected Routes**: Comprehensive route protection with role validation
- **API Security**: Endpoint-level authorization with request validation
- **Session Management**: Secure session handling with automatic cleanup

### Advanced Quiz Creation & Management
- **Dynamic Quiz Builder**: Intuitive interface with real-time preview
- **Chat Integration**: Automatic chat room creation for quiz discussions
- **Question Types**: Support for multiple-choice, true/false, and future question types
- **Advanced Settings**: Configurable passing scores, time limits, and discussion phases
- **Bulk Operations**: Efficient quiz management with batch operations

### Interactive Quiz Taking Experience
- **Real-time Features**: Live timer with automatic submission and progress tracking
- **Chat Integration**: Seamless access to quiz discussion rooms
- **Enhanced Navigation**: Intuitive question navigation with progress indicators
- **Immediate Feedback**: Instant scoring with detailed explanations
- **Achievement Integration**: Real-time achievement unlocking during quiz completion

### Comprehensive Results & Analytics System
- **Detailed Review**: Complete answer analysis with learning recommendations
- **Performance Tracking**: Historical attempt tracking with trend analysis
- **Peer Comparison**: Anonymous performance benchmarking
- **Learning Insights**: AI-powered recommendations for improvement
- **Export Capabilities**: Comprehensive reporting with data export options

## Development

### Available Scripts

#### Core Development
- `npm run dev` - Start development server with Socket.IO integration
- `npm run build` - Build for production with optimizations
- `npm run start` - Start production server with custom Socket.IO server
- `npm run lint` - Run ESLint with TypeScript support
- `npm run type-check` - Run TypeScript type checking

#### Database Management
- `npm run db:generate` - Generate Prisma client with latest schema
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio for database management
- `npm run db:seed` - Seed database with comprehensive sample data
- `npm run db:reset` - Reset database and reseed with fresh data
- `npm run db:migrate` - Run database migrations (production)

#### Testing & Quality
- `npm run test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run format` - Format code with Prettier

#### Analytics & Monitoring
- `npm run analyze` - Analyze bundle size and dependencies
- `npm run performance` - Run performance benchmarks

### Database Management

```bash
# View and manage database in Prisma Studio
npm run db:studio

# Reset and reseed database with comprehensive data
npm run db:reset

# Push schema changes and seed
npm run db:push
npm run db:seed

# Generate analytics sample data
npm run db:seed:analytics

# Create sample chat rooms and messages
npm run db:seed:chat
```

### Real-Time Development

```bash
# Start development with Socket.IO debugging
DEBUG=socket.io* npm run dev

# Monitor real-time events
npm run dev:socket-monitor

# Test WebSocket connections
npm run test:websocket
```

### Production Deployment

```bash
# Build and optimize for production
npm run build

# Start production server with PM2
npm run start:prod

# Monitor production performance
npm run monitor:prod
```

## System Requirements

### Minimum Requirements
- **Node.js**: 18.0.0 or higher
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 2GB free space for development
- **Browser**: Modern browsers with WebSocket support

### Recommended for Production
- **Node.js**: 20.0.0 LTS
- **Memory**: 16GB RAM for optimal performance
- **Storage**: 10GB+ for production data
- **Database**: PostgreSQL 14+ for production deployment
- **Load Balancer**: For high-availability deployments

## Security Features

### Authentication & Authorization
- **Session-based Authentication**: Secure session management with automatic cleanup
- **Role-based Access Control**: Multi-tier permission system (Admin, Student, System)
- **API Security**: Comprehensive endpoint protection with request validation
- **CSRF Protection**: Cross-site request forgery prevention

### Data Protection
- **Input Validation**: Comprehensive Zod schema validation on all inputs
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **XSS Protection**: Content sanitization and secure rendering
- **Academic Integrity**: Automated monitoring and violation detection

### Real-Time Security
- **WebSocket Authentication**: Secure Socket.IO connections with session validation
- **Rate Limiting**: API and WebSocket connection rate limiting
- **Message Validation**: Real-time message content validation and filtering
- **Room Access Control**: Secure chat room access with permission validation

## Deployment Options

### Development Deployment
```bash
# Quick start for development
git clone <repository-url>
cd inftech-quiz-management-system
npm install
npm run db:push
npm run db:seed
npm run dev
```

### Production Deployment

#### Option 1: Traditional Server
```bash
# Build and deploy
npm run build
DATABASE_URL="postgresql://..." npm run start
```

#### Option 2: Docker Deployment
```bash
# Using Docker Compose
docker-compose up -d
```

#### Option 3: Cloud Deployment
- **Vercel**: Automatic deployment with database integration
- **Railway**: Full-stack deployment with PostgreSQL
- **Heroku**: Traditional cloud deployment option
- **AWS/GCP/Azure**: Enterprise-grade cloud deployment

### Environment Configuration

#### Required Environment Variables
```env
# Database
DATABASE_URL="your-database-connection-string"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Socket.IO (optional)
SOCKET_IO_PORT="3001"

# Analytics (optional)
ANALYTICS_ENABLED="true"
```

#### Optional Environment Variables
```env
# Email notifications
SMTP_HOST="your-smtp-host"
SMTP_PORT="587"
SMTP_USER="your-email"
SMTP_PASS="your-password"

# File uploads
UPLOAD_MAX_SIZE="10MB"
UPLOAD_ALLOWED_TYPES="image/*,application/pdf"

# Performance
REDIS_URL="redis://localhost:6379"
CACHE_TTL="3600"
```

## Performance Optimization

### Frontend Optimization
- **Code Splitting**: Automatic route-based code splitting
- **Image Optimization**: Next.js Image component with lazy loading
- **Bundle Analysis**: Regular bundle size monitoring and optimization
- **Caching**: Intelligent caching strategies for static and dynamic content

### Backend Optimization
- **Database Indexing**: Optimized database queries with proper indexing
- **Connection Pooling**: Efficient database connection management
- **API Caching**: Redis-based caching for frequently accessed data
- **WebSocket Optimization**: Efficient real-time event handling

### Monitoring & Analytics
- **Performance Metrics**: Built-in performance monitoring
- **Error Tracking**: Comprehensive error logging and reporting
- **User Analytics**: Learning analytics and engagement tracking
- **System Health**: Real-time system health monitoring

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database connection
npm run db:studio

# Reset database if corrupted
npm run db:reset
```

#### Socket.IO Connection Issues
```bash
# Debug WebSocket connections
DEBUG=socket.io* npm run dev

# Check port availability
netstat -an | grep 3001
```

#### Performance Issues
```bash
# Analyze bundle size
npm run analyze

# Check memory usage
npm run performance
```

### Support & Documentation
- **API Documentation**: Available at `/api/docs` when running
- **Component Storybook**: Interactive component documentation
- **Database Schema**: Visual schema available in Prisma Studio
- **Real-time Events**: Socket.IO event documentation in `/docs/websocket`

## Contributing

### Development Workflow
1. **Fork the repository** and create a feature branch
2. **Set up development environment** with `npm install`
3. **Make your changes** following the coding standards
4. **Add comprehensive tests** for new features
5. **Run quality checks** with `npm run lint` and `npm run type-check`
6. **Test real-time features** with multiple browser sessions
7. **Submit a pull request** with detailed description

### Coding Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Comprehensive linting rules
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Standardized commit messages

### Testing Guidelines
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API endpoint and database testing
- **E2E Tests**: Full user journey testing
- **Real-time Tests**: WebSocket and Socket.IO testing

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Next.js Team**: For the excellent React framework
- **Prisma Team**: For the powerful database toolkit
- **Socket.IO Team**: For real-time communication capabilities
- **Radix UI Team**: For accessible UI components
- **Tailwind CSS Team**: For the utility-first CSS framework

---

**InfTech Quiz & Chatboard Management System** - Transforming education through intelligent collaboration and comprehensive learning analytics.

For support, feature requests, or contributions, please visit our [GitHub repository](https://github.com/your-username/inftech-quiz-management-system) or contact the development team.
