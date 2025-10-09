#!/bin/bash

# VPS Setup Script for Task Manager Deployment
# Run this script on your VPS to prepare it for deployment

set -e

echo "🚀 Setting up VPS for Task Manager deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js (using NodeSource repository for latest LTS)
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install nginx (optional, for reverse proxy)
echo "📦 Installing Nginx..."
sudo apt install -y nginx

# Create application user (optional)
read -p "Create dedicated user for the app? (y/n): " create_user
if [ "$create_user" = "y" ]; then
    read -p "Enter username for app: " app_user
    sudo adduser $app_user
    sudo usermod -aG sudo $app_user
    echo "✅ User $app_user created"
fi

# Create deployment directory
DEPLOY_USER=${app_user:-$(whoami)}
DEPLOY_DIR="/home/$DEPLOY_USER/deployments"

echo "📁 Creating deployment directory at $DEPLOY_DIR..."
sudo mkdir -p $DEPLOY_DIR
sudo chown $DEPLOY_USER:$DEPLOY_USER $DEPLOY_DIR

# Setup Nginx configuration
echo "🌐 Setting up Nginx configuration..."
sudo tee /etc/nginx/sites-available/task-manager > /dev/null <<EOF
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/task-manager /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Start and enable services
sudo systemctl start nginx
sudo systemctl enable nginx

# Setup PM2 startup script
pm2 startup
echo "⚠️  Run the command shown above to enable PM2 startup"

# Create environment file template
echo "📝 Creating environment file template..."
cat > /home/$DEPLOY_USER/.env.production <<EOF
# Production Environment Variables
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/task-manager-prod

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# DigitalOcean Spaces
DO_SPACES_ENDPOINT=https://your-region.digitaloceanspaces.com
DO_SPACES_BUCKET=your-bucket-name
DO_SPACES_ACCESS_KEY=your-access-key
DO_SPACES_SECRET_KEY=your-secret-key

# App Configuration
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-nextauth-secret

# Optional: Analytics, Monitoring
# GOOGLE_ANALYTICS_ID=
# SENTRY_DSN=
EOF

echo "✅ VPS setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Edit /home/$DEPLOY_USER/.env.production with your actual values"
echo "2. Set up your GitHub repository secrets:"
echo "   - VPS_HOST: $(curl -s ifconfig.me)"
echo "   - VPS_USERNAME: $DEPLOY_USER"
echo "   - VPS_SSH_KEY: Your private SSH key"
echo "   - VPS_PORT: 22 (or your SSH port)"
echo "3. Configure your domain DNS to point to this server"
echo "4. Set up SSL certificate (Let's Encrypt recommended)"
echo ""
echo "🔑 To generate SSH key pair for deployment:"
echo "ssh-keygen -t rsa -b 4096 -C 'github-actions-deploy' -f ~/.ssh/github_actions_key"
echo "cat ~/.ssh/github_actions_key.pub >> ~/.ssh/authorized_keys"
echo ""
echo "📄 Copy the private key (~/.ssh/github_actions_key) to GitHub Secrets as VPS_SSH_KEY"
