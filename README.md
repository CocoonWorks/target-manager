# Target Manager

A beautiful, responsive task management application built with Next.js, Shadcn/ui, and MongoDB.

## Features

- **Beautiful UI**: Glassmorphic design with light/dark mode
- **User Authentication**: Secure login system with MongoDB backend
- **Task Management**: Create, view, and manage targets/tasks
- **Responsive Design**: Works perfectly on all devices
- **Theme Support**: Light and dark mode with system preference

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI Components**: Shadcn/ui, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB with Mongoose
- **Authentication**: Simple username/password with database validation
- **Styling**: Glassmorphic effects, custom animations

## Backend Authentication Setup

### 1. Install Dependencies

```bash
npm install mongoose
```

### 2. Environment Variables

Create a `.env.local` file in your project root:

```env
MONGODB_URI=mongodb://localhost:27017/task-manager
```

### 3. MongoDB Setup

Make sure MongoDB is running locally, or use MongoDB Atlas for cloud hosting.

### 4. Add Demo User

Run the script to add a demo user:

```bash
node scripts/add-demo-user.js
```

This creates a user with:

- **Username**: `demo`
- **Password**: `demo123`
- **Name**: Demo User
- **Phone**: +1234567890

### 5. Database Schema

The User model includes:

- `username` (unique, required)
- `password` (required, plain text)
- `name` (required)
- `phone` (required)
- `active` (boolean, defaults to true)
- `createdAt` and `updatedAt` timestamps

## API Endpoints

### Authentication

- **POST** `/api/auth/login` - User login
- **POST** `/api/auth/register` - User registration

### Login Request

```json
{
  "username": "demo",
  "password": "demo123"
}
```

### Login Response

```json
{
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "username": "demo",
    "name": "Demo User",
    "phone": "+1234567890",
    "active": true
  }
}
```

## Getting Started

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Set up environment variables**
4. **Start MongoDB**
5. **Add demo user**: `node scripts/add-demo-user.js`
6. **Run development server**: `npm run dev`
7. **Login with**: username: `demo`, password: `demo123`

## Project Structure

```
├── app/
│   ├── api/auth/          # Authentication API routes
│   ├── login/             # Login page
│   ├── task/[id]/         # Task detail pages
│   └── page.tsx           # Main dashboard
├── components/
│   ├── ui/                # Shadcn/ui components
│   ├── header.tsx         # Application header
│   └── target-card.tsx    # Task/target display cards
├── lib/
│   ├── mongodb.ts         # Database connection
│   └── utils.ts           # Utility functions
├── models/
│   └── User.ts            # User database model
└── scripts/
    └── add-demo-user.js   # Database setup script
```

## Security Notes

- Passwords are stored as plain text (as requested)
- In production, consider implementing password hashing
- Add rate limiting for login attempts
- Implement session management or JWT tokens

## Contributing

Feel free to submit issues and enhancement requests!
