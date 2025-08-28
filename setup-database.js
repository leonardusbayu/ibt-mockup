/**
 * Database setup script
 * Run this after setting up your DATABASE_URL in .env
 * Usage: node setup-database.js
 */

require('dotenv').config();
const { query, close } = require('./dbClient');
const bcrypt = require('bcrypt');

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database...');
    
    // Test database connection
    console.log('📡 Testing database connection...');
    await query('SELECT 1 as test');
    console.log('✅ Database connection successful!');
    
    // Check if users table exists
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Users table not found. Please run the schema creation script first:');
      console.log('   psql $DATABASE_URL -f 001_create_schema.sql');
      return;
    }
    
    console.log('✅ Users table found!');
    
    // Check if admin user exists
    const adminCheck = await query('SELECT id FROM users WHERE username = $1', ['admin']);
    
    if (adminCheck.rows.length === 0) {
      console.log('👤 Creating admin user...');
      const passwordHash = await bcrypt.hash('admin123', 10);
      
      await query(
        'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
        ['admin', passwordHash, 'admin']
      );
      
      console.log('✅ Admin user created!');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('   ⚠️  Please change this password after first login!');
    } else {
      console.log('✅ Admin user already exists!');
    }
    
    // Create a test user
    const testUserCheck = await query('SELECT id FROM users WHERE username = $1', ['testuser']);
    
    if (testUserCheck.rows.length === 0) {
      console.log('👤 Creating test user...');
      const passwordHash = await bcrypt.hash('test123', 10);
      
      await query(
        'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
        ['testuser', passwordHash, 'test_taker']
      );
      
      console.log('✅ Test user created!');
      console.log('   Username: testuser');
      console.log('   Password: test123');
    } else {
      console.log('✅ Test user already exists!');
    }
    
    console.log('\n🎉 Database setup complete!');
    console.log('\nYou can now start the application with:');
    console.log('   npm start');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure your DATABASE_URL is correct in .env');
    console.log('2. Ensure the database schema has been created');
    console.log('3. Check your database connection and permissions');
  } finally {
    await close();
  }
}

if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };