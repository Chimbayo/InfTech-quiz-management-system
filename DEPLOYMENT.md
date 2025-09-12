# Deployment Guide for Render

## Prerequisites

1. A Render account
2. A PostgreSQL database (can be created through Render)

## Step-by-Step Deployment

### 1. Create a PostgreSQL Database on Render

1. Go to your Render dashboard
2. Click "New +" → "PostgreSQL"
3. Choose a name (e.g., "quiz-db")
4. Select the free plan
5. Click "Create Database"
6. Wait for the database to be created
7. Copy the **External Database URL** (you'll need this)

### 2. Deploy the Web Service

1. Go to your Render dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:

**Basic Settings:**
- **Name**: `quiz-management-system`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main` or `master`

**Build & Deploy:**
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**Environment Variables:**
- **NODE_ENV**: `production`
- **DATABASE_URL**: Paste the External Database URL from step 1

### 3. Alternative: Use render.yaml (Recommended)

If you prefer, you can use the included `render.yaml` file:

1. Push the `render.yaml` file to your repository
2. In Render dashboard, click "New +" → "Blueprint"
3. Connect your repository
4. Render will automatically detect and use the `render.yaml` configuration

### 4. Database Setup

After deployment, the database schema will be automatically created when the app starts. If you need to seed the database with initial data:

1. Go to your Render service dashboard
2. Open the "Shell" tab
3. Run: `npm run db:seed`

## Environment Variables

Make sure these environment variables are set in your Render service:

- `NODE_ENV=production`
- `DATABASE_URL=postgresql://username:password@host:port/database`

## Local Development Setup

For local development, the system uses SQLite by default:

1. **No additional setup required** - SQLite database will be created automatically
2. **Database file**: `prisma/dev.db` (created automatically)
3. **Seed data**: Run `npm run db:seed` to populate with sample data

### Default Login Credentials (after seeding):
- **Admin**: `admin@example.com` / `password123`
- **Student**: `student@example.com` / `password123`

## Troubleshooting

### Common Issues:

1. **"Environment variable not found: DATABASE_URL"**
   - Make sure you've set the DATABASE_URL environment variable in Render
   - Check that the database URL is correct

2. **"Build failed"**
   - Check the build logs in Render dashboard
   - Make sure all dependencies are properly installed

3. **"Database connection failed"**
   - Verify the DATABASE_URL is correct
   - Check that the database is running and accessible

### Build Commands:

- **Standard build**: `npm install && npm run build`
- **Production build**: `npm run build:prod` (includes database setup)

## Post-Deployment

1. **Test the application**: Visit your deployed URL
2. **Create admin user**: Use the registration form to create an admin account
3. **Create quizzes**: Log in as admin and create some sample quizzes
4. **Test student flow**: Register as a student and take a quiz

## Security Notes

- The current implementation uses simple password authentication
- In production, consider implementing proper password hashing
- Use HTTPS (Render provides this automatically)
- Consider implementing proper session management with JWT tokens
