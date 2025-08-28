# IBT Mockup Setup Instructions

## Database Connection Issue Resolution

The application was showing only the login page because the database connection wasn't properly configured. Here's what has been fixed and what you need to do:

## What Was Fixed

1. ✅ Created missing Netlify functions directory
2. ✅ Added authentication functions (login, register, refreshToken)
3. ✅ Moved existing function files to proper location
4. ✅ Created environment variables template
5. ✅ Fixed import paths in all functions

## Required Setup Steps

### 1. Install Node.js and Dependencies

**Option A: Automated Setup (Recommended)**

After installing Node.js, you can use the automated setup scripts:

```bash
# For Command Prompt/PowerShell:
setup.bat

# Or for PowerShell specifically:
powershell -ExecutionPolicy Bypass -File setup.ps1
```

**Option B: Manual Setup**

1. **First, install Node.js:**
   - Download and install Node.js from https://nodejs.org/ (LTS version recommended)
   - This will also install npm (Node Package Manager)
   - Restart your terminal/command prompt after installation

2. **Then install the required packages:**
   ```bash
   npm install
   ```

Note: I've already added the required dependencies (bcrypt, jsonwebtoken, dotenv) to your package.json file.

### 2. Configure Database Connection

Update the `.env` file with your actual Neon database URL:

```env
# Replace with your actual Neon database URL
DATABASE_URL=postgresql://username:password@host/database?sslmode=require

# Keep these as they are
NODE_ENV=development
NETLIFY_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 3. Set Up Database Schema

Run the schema creation script on your Neon database:

```bash
# Connect to your Neon database and run:
psql $DATABASE_URL -f 001_create_schema.sql
```

### 4. Create Test Users (Automated)

I've created a setup script to automatically create test users:

```bash
node setup-database.js
```

This script will:
- Test your database connection
- Create an admin user (username: `admin`, password: `admin123`)
- Create a test user (username: `testuser`, password: `test123`)
- Skip creation if users already exist

**Alternative: Manual user creation**
If you prefer to create users manually, you can use the registration function after starting the server.

### 5. Start the Development Server

```bash
npm start
# or
netlify dev
```

## Available Functions

The following Netlify functions are now available:

- `/.netlify/functions/login` - User authentication
- `/.netlify/functions/register` - User registration
- `/.netlify/functions/refreshToken` - Token refresh
- `/.netlify/functions/fetchQuestions` - Get questions from database
- `/.netlify/functions/uploadQuestions` - Upload questions to database

## Troubleshooting

### If you still see only the login page:

1. Check browser console for errors
2. Verify DATABASE_URL is correct in .env
3. Ensure database schema is created
4. Check that Netlify functions are running (should see them in terminal output)

### Common Issues:

- **"npm not found"**: Install Node.js and npm
- **Database connection errors**: Verify DATABASE_URL format
- **Function errors**: Check function logs in terminal

## Next Steps

1. Install dependencies: `npm install bcrypt jsonwebtoken dotenv`
2. Update `.env` with your database URL
3. Run database schema setup
4. Start development server
5. Test login/registration functionality