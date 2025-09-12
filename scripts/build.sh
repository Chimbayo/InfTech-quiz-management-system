#!/bin/bash

# Build script for production deployment
set -e

echo "Starting build process..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Check if we're in a production environment with DATABASE_URL
if [ "$NODE_ENV" = "production" ] && [ -n "$DATABASE_URL" ]; then
    echo "Production environment detected. Using PostgreSQL schema..."
    # Copy production schema to main schema file
    cp prisma/schema.production.prisma prisma/schema.prisma
    echo "Setting up PostgreSQL database..."
    npx prisma db push
else
    echo "Local development environment. Using SQLite schema..."
    # Ensure we're using the local SQLite schema
    if [ -f "prisma/schema.production.prisma" ]; then
        # Restore local schema if production schema was used
        git checkout prisma/schema.prisma 2>/dev/null || echo "Using current schema"
    fi
    echo "Setting up SQLite database..."
    npx prisma db push
fi

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Build the application
echo "Building Next.js application..."
npm run build

echo "Build completed successfully!"
