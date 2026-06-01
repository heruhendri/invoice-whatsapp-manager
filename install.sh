#!/bin/bash

# Invoice WhatsApp Manager - Automated Installer
# Author: Gemini Code Assist

echo "===================================================="
echo "Starting Invoice WhatsApp Manager Installation..."
echo "===================================================="

# 1. Check/Install Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing Node.js 20 (LTS)..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VER" -lt 18 ]; then
        echo "Node.js version is $NODE_VER. Upgrading to Node.js 20..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        echo "Node.js $(node -v) is already installed. Skipping..."
    fi
fi

# Check for MySQL Client (optional, but helpful for DB creation)
HAS_MYSQL_CLI=false
if command -v mysql &> /dev/null; then HAS_MYSQL_CLI=true; fi

# 2. Install PM2 globally if not exists
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2 globally..."
    npm install -g pm2
fi

# 3. Install Dependencies
echo "Installing npm dependencies..."
npm install

# 4. Setup Environment File
if [ -f .env ]; then
    echo ".env file already exists. Do you want to reconfigure? (y/n)"
    read reconfig
fi

if [ ! -f .env ] || [ "$reconfig" = "y" ]; then
    cp .env.example .env 2>/dev/null || touch .env
    
    echo "--- Configuration ---"
    
    # Port Configuration
    echo "Enter Port for Web UI (default 3000):"
    read app_port
    APP_PORT=${app_port:-3000}
    
    # Database Configuration
    echo "Enter MySQL Database URL (example: mysql://root:password@localhost:3306/invoice_db):"
    read db_url
    
    # Attempt to create database if mysql-client is present
    if [ "$HAS_MYSQL_CLI" = true ]; then
        # Extract DB Name from URL (part after the last /)
        DB_NAME=$(echo $db_url | sed 's/.*\///' | cut -d'?' -f1)
        # Extract Host, User, Pass for creation attempt
        DB_USER=$(echo $db_url | sed 's/mysql:\/\/\([^:]*\).*/\1/')
        DB_PASS=$(echo $db_url | sed 's/mysql:\/\/[^:]*:\([^@]*\).*/\1/')
        DB_HOST=$(echo $db_url | sed 's/.*@\([^:\/]*\).*/\1/')
        
        echo "Attempting to create database '$DB_NAME' if it doesn't exist..."
        mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;" 2>/dev/null
        if [ $? -eq 0 ]; then echo "Database ready."; else echo "Note: Could not verify/create DB automatically. Prisma will try later."; fi
    fi

    # Update .env
    sed -i "/DATABASE_URL=/d" .env
    echo "DATABASE_URL=\"$db_url\"" >> .env
    sed -i "/PORT=/d" .env
    echo "PORT=$APP_PORT" >> .env
fi

# Load variables from .env for build process
export $(grep -v '^#' .env | xargs)

# 5. Prisma Setup
echo "Generating Prisma Client..."
npm run prisma:generate

echo "Running Database Migrations..."
npx prisma migrate deploy

# 6. Build Application
echo "Building Next.js application..."
npm run build

# 7. Process Management with PM2
echo "Starting services with PM2..."

# Stop existing processes if any
pm2 delete invoice-web invoice-worker 2>/dev/null || true

# Start Web App
pm2 start npm --name "invoice-web" -- start -- -p $PORT

# Start Scheduler Worker
pm2 start npm --name "invoice-worker" -- run worker

# Save PM2 state
pm2 save --force

echo "===================================================="
echo "Installation Complete!"
echo "===================================================="
echo "Web UI: http://localhost:$PORT"
echo "WhatsApp Status: Check http://localhost:$PORT/whatsapp"
echo ""
echo "Useful commands:"
echo " - pm2 status          : Check if app & worker are running"
echo " - pm2 logs            : See real-time logs"
echo " - pm2 restart all     : Restart everything"
echo "===================================================="