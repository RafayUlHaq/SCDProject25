const mongoose = require('mongoose');
require('dotenv').config();

let isConnected = false;

async function connectDB() {
  if (isConnected) {
    return;
  }

  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vaultdb';
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
}

module.exports = { connectDB };

