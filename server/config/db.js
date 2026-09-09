const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/examsphere_ai';

    // Attempt standard connection first
    await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB Connected: ${mongoose.connection.host}`);
  } catch (err) {
    if (process.env.USE_IN_MEMORY_DB === 'true') {
      // Graceful fallback — not an error, just a notice
      console.log(`[Database] Local MongoDB connection failed (${err.message}). Initializing In-Memory Mongo Server for seamless setup...`);
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);
        console.log(`[Database] In-Memory MongoDB Connected successfully at: ${mongoUri}`);
        console.log(`[Database] ⚠️  Note: In-memory data is NOT persisted between server restarts.`);
      } catch (memErr) {
        console.error(`[Database Error] Failed to start MongoDB Memory Server: ${memErr.message}`);
        process.exit(1);
      }
    } else {
      console.error(`[Database Error] Persistent MongoDB connection failed: ${err.message}`);
      console.error(`
==================================================
❌ MONGODB CONNECTION FAILED
==================================================
ExamSphere AI could not connect to MongoDB.
Please ensure that MongoDB is running locally on port 27017,
or set the MONGODB_URI environment variable to a valid cluster.

If you intentionally want to run without persistent storage for testing,
set USE_IN_MEMORY_DB=true in your .env file.
==================================================
      `);
      process.exit(1);
    }
  }
};

module.exports = connectDB;

