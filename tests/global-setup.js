/**
 * Jest Global Setup
 * Runs once before all test suites
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

module.exports = async () => {
  // Create in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbName: 'resume_builder_test'
    }
  });

  const mongoUri = mongoServer.getUri();

  // Set mongoose connection
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Store mongo URI for tests
  global.__MONGO_URI__ = mongoUri;
  global.__MONGO_SERVER__ = mongoServer;

  console.log('\n🚀 Global Setup Complete');
  console.log('MongoDB Memory Server started');
  console.log('Mongo URI:', mongoUri);
};
