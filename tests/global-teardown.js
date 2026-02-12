/**
 * Jest Global Teardown
 * Runs once after all test suites
 */

const mongoose = require('mongoose');

module.exports = async () => {
  try {
    // Close mongoose connection
    await mongoose.connection.close();

    // Stop MongoDB Memory Server
    if (global.__MONGO_SERVER__) {
      await global.__MONGO_SERVER__.stop();
    }

    console.log('\n✅ Global Teardown Complete');
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error during global teardown:', error);
  }
};
