# VPS Deployment Guide

This guide will help you deploy your Task Manager application to a VPS using GitHub Actions.

## Prerequisites

- A VPS with Ubuntu/Debian
- Domain name (optional, but recommended)
- GitHub repository with the code

## Step 1: VPS Setup

### 1.1 Connect to your VPS

```bash
ssh root@your-vps-ip
```

### 1.2 Run the setup script

```bash
# Download and run the setup script
wget https://raw.githubusercontent.com/your-username/task-manager/main/scripts/setup-vps.sh
chmod +x setup-vps.sh
./setup-vps.sh
```

### 1.3 Generate SSH keys for deployment

```bash
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f ~/.ssh/github_actions_key
cat ~/.ssh/github_actions_key.pub >> ~/.ssh/authorized_keys
```

### 1.4 Configure environment variables

```bash
nano /home/your-username/.env.production
```

Update the following variables:

- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: A strong secret key for JWT tokens
- `DO_SPACES_ENDPOINT`: Your DigitalOcean Spaces endpoint
- `DO_SPACES_BUCKET`: Your bucket name
- `DO_SPACES_ACCESS_KEY`: Your access key
- `DO_SPACES_SECRET_KEY`: Your secret key
- `NEXTAUTH_URL`: Your domain URL
- `NEXTAUTH_SECRET`: A secret for NextAuth

## Step 2: GitHub Repository Setup

### 2.1 Add Repository Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:

- `VPS_HOST`: Your VPS IP address or domain
- `VPS_USERNAME`: The username you created (or root)
- `VPS_SSH_KEY`: The content of `~/.ssh/github_actions_key` (private key)
- `VPS_PORT`: SSH port (usually 22)

### 2.2 Copy SSH Private Key

```bash
# On your VPS, display the private key
cat ~/.ssh/github_actions_key
```

Copy the entire output (including `-----BEGIN` and `-----END` lines) and paste it as the `VPS_SSH_KEY` secret in GitHub.

## Step 3: Domain Setup (Optional)

### 3.1 Configure DNS

Point your domain to your VPS IP address:

- A record: `@` → `your-vps-ip`
- A record: `www` → `your-vps-ip`

### 3.2 Update Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/task-manager
```

Replace `your-domain.com` with your actual domain.

### 3.3 Test Nginx Configuration

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 3.4 Setup SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Step 4: Deploy

### 4.1 Trigger Deployment

The deployment will automatically trigger when you push to the main branch. You can also trigger it manually:

1. Go to your GitHub repository
2. Click on "Actions" tab
3. Select "Build and Deploy to VPS"
4. Click "Run workflow"

### 4.2 Monitor Deployment

Watch the deployment progress in the GitHub Actions tab. The workflow will:

1. Build your Next.js application
2. Create a deployment package
3. Copy files to your VPS
4. Install dependencies
5. Start the application with PM2
6. Verify the deployment

## Step 5: Post-Deployment

### 5.1 Check Application Status

```bash
# On your VPS
pm2 status
pm2 logs task-manager
```

### 5.2 Verify Health Check

```bash
curl http://localhost:3000/api/health
```

Or visit: `http://your-domain.com/api/health`

## Troubleshooting

### Common Issues

1. **SSH Connection Failed**

   - Verify VPS_HOST, VPS_USERNAME, and VPS_SSH_KEY
   - Check if SSH key is properly formatted
   - Ensure the public key is in `~/.ssh/authorized_keys`

2. **Build Failed**

   - Check if all dependencies are in package.json
   - Verify environment variables are set correctly
   - Check GitHub Actions logs for specific errors

3. **Application Not Starting**

   - Check PM2 logs: `pm2 logs task-manager`
   - Verify environment variables in `.env.production`
   - Check if port 3000 is available

4. **Nginx Not Serving**
   - Check Nginx status: `sudo systemctl status nginx`
   - Test configuration: `sudo nginx -t`
   - Check error logs: `sudo tail -f /var/log/nginx/error.log`

### Useful Commands

```bash
# Check PM2 status
pm2 status

# View application logs
pm2 logs task-manager

# Restart application
pm2 restart task-manager

# Stop application
pm2 stop task-manager

# Check Nginx status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx

# View Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Check disk space
df -h

# Check memory usage
free -h
```

## Security Considerations

1. **Firewall Setup**

   ```bash
   sudo ufw allow ssh
   sudo ufw allow 'Nginx Full'
   sudo ufw enable
   ```

2. **SSH Security**

   - Use key-based authentication
   - Disable root login
   - Change default SSH port (optional)

3. **Environment Variables**

   - Never commit `.env` files to git
   - Use strong secrets for JWT and database
   - Regularly rotate secrets

4. **Updates**
   - Keep system packages updated
   - Monitor security advisories
   - Update dependencies regularly

## Monitoring

Consider setting up monitoring for:

- Application uptime
- Server resources (CPU, memory, disk)
- Error rates
- Response times

Popular options:

- UptimeRobot (free)
- DataDog
- New Relic
- Grafana + Prometheus

## Backup Strategy

1. **Database Backups**

   ```bash
   # MongoDB backup
   mongodump --uri="your-mongodb-uri" --out=/backup/mongodb/$(date +%Y%m%d)
   ```

2. **File Backups**

   - DigitalOcean Spaces handles file storage
   - Consider additional backup for critical data

3. **Configuration Backups**
   - Keep copies of environment files
   - Document custom configurations
