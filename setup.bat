@echo off
echo ========================================
echo IBT Mockup Setup Script
echo ========================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo Then restart your terminal and run this script again.
    pause
    exit /b 1
)

echo Node.js found! Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Configure your database URL in .env file
echo 2. Run: psql $DATABASE_URL -f 001_create_schema.sql
echo 3. Run: node setup-database.js
echo 4. Run: npm start
echo.
echo For detailed instructions, see SETUP.md
echo.
pause