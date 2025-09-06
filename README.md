# Task Manager

Task management application with file upload capabilities.

## Features

- Task management with status tracking
- File upload (50MB max per file)
- Document viewer for uploaded files
- Auto-complete tasks when all files uploaded
- Quick login via URL
- Mobile responsive design

## Setup

1. Install dependencies: `npm install`
2. Set up environment variables in `.env.local`:
   ```
   MONGODB_URI=mongodb://localhost:27017/task-manager
   DO_SPACES_BUCKET_NAME=your-bucket-name
   DO_SPACES_ENDPOINT=https://blr1.digitaloceanspaces.com
   DO_SPACES_REGION=blr1
   DO_SPACES_ACCESS_KEY_ID=your-access-key
   DO_SPACES_SECRET_ACCESS_KEY=your-secret-key
   ```
3. Add demo user: `node scripts/add-demo-user.js`
4. Start development server: `npm run dev`

## Quick Login Using Link

Access dashboard directly:

```
http://localhost:3000/api/auth/quick-login?username=demo&password=demo123
```
