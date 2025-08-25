# Target Manager - Database & S3 Setup Guide

## 🗄️ Database Setup

### 1. MongoDB Connection

- Update your `.env.local` file with your MongoDB connection string:

```env
MONGODB_URI=your_mongodb_atlas_connection_string_here
```

### 2. Create Demo User

Run the script to create a demo user:

```bash
node scripts/add-demo-user.js
```

### 3. Add Sample Targets

Run the script to add sample targets to the database:

```bash
node scripts/add-sample-targets.js
```

## ☁️ AWS S3 Setup

### 1. Create S3 Bucket

- Go to AWS S3 Console
- Create a new bucket with a unique name
- Enable public access (for file viewing)
- Set bucket policy for public read access

### 2. Create IAM User

- Go to AWS IAM Console
- Create a new user with programmatic access
- Attach the `AmazonS3FullAccess` policy
- Save the Access Key ID and Secret Access Key

### 3. Environment Variables

Add these to your `.env.local` file:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_S3_BUCKET_NAME=your_s3_bucket_name
```

### 4. S3 Bucket Policy

Add this bucket policy to allow public read access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

## 🚀 Running the Application

1. **Install dependencies:**

```bash
npm install
```

2. **Set up environment variables** (see above)

3. **Create demo user and targets:**

```bash
node scripts/add-demo-user.js
node scripts/add-sample-targets.js
```

4. **Start the development server:**

```bash
npm run dev
```

5. **Login with demo credentials:**

- Username: `demo`
- Password: `demo123`

## 📁 API Endpoints

### Targets

- `GET /api/targets` - Get all targets for user
- `POST /api/targets` - Create new target
- `GET /api/targets/[id]` - Get specific target
- `PUT /api/targets/[id]` - Update target
- `DELETE /api/targets/[id]` - Delete target

### File Uploads

- `POST /api/targets/[id]/upload` - Upload files to S3
- `DELETE /api/targets/[id]/upload` - Delete file from S3

## 🔒 Authentication

The application uses:

- **Client-side**: localStorage for user data and tokens
- **Server-side**: Bearer token authentication in API headers
- **File uploads**: S3 presigned URLs for secure direct uploads

## 📝 Notes

- Files are uploaded directly to S3 using presigned URLs
- File metadata is stored in MongoDB with the target document
- Authentication tokens are simple base64 encoded strings (not JWT)
- In production, implement proper JWT authentication
