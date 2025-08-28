# IBT Mockup - TOEFL iBT Practice Test Platform

A React-based TOEFL iBT practice test platform with admin interface, built using Netlify Functions and Neon Postgres database.

## 🚀 Quick Start

**Prerequisites:** Node.js (v14+) and npm must be installed on your system.

1. **Install Node.js** (if not already installed):
   - Download from https://nodejs.org/ (LTS version)
   - Restart your terminal after installation

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   - Update the `.env` file with your Neon database URL
   - See `SETUP.md` for detailed configuration instructions

4. **Set up database**:
   ```bash
   # Create database schema
   psql $DATABASE_URL -f 001_create_schema.sql
   
   # Create test users
   node setup-database.js
   ```

5. **Start the application**:
   ```bash
   npm start
   ```

## 📁 Project Structure

```
ibt-mockup/
├── src/                    # React application source
├── functions/              # Netlify Functions (API endpoints)
├── public/                 # Static assets
├── .env                    # Environment configuration
├── setup-database.js       # Database setup script
├── SETUP.md               # Detailed setup instructions
└── 001_create_schema.sql  # Database schema
```

## 🔧 Available Functions

- **Authentication**: `login.js`, `register.js`, `refreshToken.js`
- **Questions**: `fetchQuestions.js`, `uploadQuestions.js`

## 👥 Default Test Users

After running the setup script:

- **Admin**: username `admin`, password `admin123`
- **Test Taker**: username `testuser`, password `test123`

⚠️ **Important**: Change default passwords after first login!

## 📖 Documentation

For detailed setup instructions, troubleshooting, and configuration options, see [`SETUP.md`](./SETUP.md).

## 🛠 Development

- **Start dev server**: `npm start`
- **Run tests**: `npm test`
- **Build for production**: `npm build`
- **Lint code**: `npm run lint`

## 🔗 Technologies

- **Frontend**: React 18, React Router
- **Backend**: Netlify Functions, Node.js
- **Database**: Neon Postgres
- **Authentication**: JWT, bcrypt
- **Development**: Netlify CLI

---

**Need help?** Check `SETUP.md` for detailed instructions and troubleshooting tips.