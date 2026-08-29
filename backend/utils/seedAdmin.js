// Run with: npm run seed
// Creates (or updates) the default Admin account defined in .env
require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');

const seed = async () => {
  await connectDB();

  const email = process.env.ADMIN_EMAIL || 'admin@taskmanager.com';
  const existing = await User.findOne({ email });

  if (existing) {
    console.log(`Admin already exists: ${email}`);
  } else {
    await User.create({
      name: process.env.ADMIN_NAME || 'Admin User',
      email,
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: 'admin',
    });
    console.log(`Admin created successfully: ${email}`);
  }

  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
