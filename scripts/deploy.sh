#!/bin/bash

# Deployment script for Render
echo "Starting deployment..."

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

# Push database schema
echo "Pushing database schema..."
npx prisma db push

# Build the application
echo "Building application..."
npm run build

echo "Deployment completed successfully!"
