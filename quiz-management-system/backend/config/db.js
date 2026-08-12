const mongoose = require('mongoose');

let mongoServer;

const connectDB = async () => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quiz_db';
    
    // Set connection timeout short for fallback if local mongo daemon isn't running
    try {
      const conn = await mongoose.connect(connUri, {
        serverSelectionTimeoutMS: 2000,
      });
      console.log(`[Database] Connected to MongoDB: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
      return conn;
    } catch (primaryErr) {
      console.warn(`[Database] Could not connect to primary MongoDB at ${connUri}. Spinning up MongoMemoryServer fallback...`);
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      const conn = await mongoose.connect(mongoUri);
      console.log(`[Database] Connected to MongoMemoryServer: ${mongoUri}`);
      return conn;
    }
  } catch (error) {
    console.error(`[Database Error] ${error.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

module.exports = { connectDB, disconnectDB };
