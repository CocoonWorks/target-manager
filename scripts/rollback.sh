#!/bin/bash

# Rollback Script for Task Manager Deployment
# This script helps rollback to a previous deployment in case of issues

set -e

APP_NAME="task-manager"
DEPLOY_DIR="/home/$(whoami)/deployments"
BACKUP_DIR="$DEPLOY_DIR"

echo "🔄 Task Manager Rollback Script"
echo "================================"

# Check if we're in the correct directory
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Deployment directory not found: $BACKUP_DIR"
    exit 1
fi

# List available backups
echo "📋 Available backups:"
echo ""

backups=($(ls -t $BACKUP_DIR | grep "$APP_NAME-backup-" | head -10))

if [ ${#backups[@]} -eq 0 ]; then
    echo "❌ No backups found!"
    exit 1
fi

for i in "${!backups[@]}"; do
    backup_name="${backups[$i]}"
    backup_path="$BACKUP_DIR/$backup_name"
    backup_date=$(ls -la "$backup_path" | awk '{print $6, $7, $8}')
    echo "$((i+1)). $backup_name (Created: $backup_date)"
done

echo ""
read -p "Select backup to rollback to (1-${#backups[@]}): " selection

# Validate selection
if ! [[ "$selection" =~ ^[0-9]+$ ]] || [ "$selection" -lt 1 ] || [ "$selection" -gt ${#backups[@]} ]; then
    echo "❌ Invalid selection!"
    exit 1
fi

selected_backup="${backups[$((selection-1))]}"
selected_path="$BACKUP_DIR/$selected_backup"

echo ""
echo "🎯 Selected backup: $selected_backup"
echo "📍 Path: $selected_path"

# Confirm rollback
echo ""
read -p "⚠️  Are you sure you want to rollback to this backup? This will stop the current application! (y/N): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "❌ Rollback cancelled"
    exit 0
fi

echo ""
echo "🔄 Starting rollback process..."

# Stop current application
echo "⏹️  Stopping current application..."
pm2 stop $APP_NAME 2>/dev/null || echo "   Application not running"

# Create current backup before rollback
echo "💾 Creating backup of current deployment..."
current_backup="$BACKUP_DIR/$APP_NAME-current-backup-$(date +%Y%m%d-%H%M%S)"
if [ -d "$DEPLOY_DIR/$APP_NAME" ]; then
    cp -r "$DEPLOY_DIR/$APP_NAME" "$current_backup"
    echo "   Current deployment backed up to: $current_backup"
fi

# Remove current deployment
echo "🗑️  Removing current deployment..."
rm -rf "$DEPLOY_DIR/$APP_NAME"

# Restore from backup
echo "📦 Restoring from backup: $selected_backup"
cp -r "$selected_path" "$DEPLOY_DIR/$APP_NAME"

# Navigate to deployment directory
cd "$DEPLOY_DIR/$APP_NAME"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production

# Start application
echo "🚀 Starting application..."
pm2 start npm --name "$APP_NAME" -- start
pm2 save

# Wait a moment for startup
sleep 5

# Check application status
echo ""
echo "📊 Application Status:"
pm2 status $APP_NAME

# Health check
echo ""
echo "🏥 Health Check:"
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Application is healthy!"
else
    echo "❌ Health check failed!"
    echo "   Check logs: pm2 logs $APP_NAME"
fi

echo ""
echo "✅ Rollback completed!"
echo ""
echo "📋 Useful commands:"
echo "   View logs: pm2 logs $APP_NAME"
echo "   Restart: pm2 restart $APP_NAME"
echo "   Status: pm2 status"
echo ""
echo "🔄 To rollback again, run this script: ./rollback.sh"
