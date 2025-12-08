/* eslint no-console: "off" */

import mongoose from 'mongoose';
import 'dotenv/config';

// Use MONGODB_URI from environment or command line argument or fallback to default local MongoDB
const MONGO_URL = process.env.MONGODB_URI || process.argv[2] || 'mongodb://127.0.0.1:27017';

const DB_NAME = 'fake_so';
const A_MONGO_URL = `${MONGO_URL}/${DB_NAME}`;

/**
 * Clears all collections from the connected MongoDB database.
 *
 * @returns A Promise that resolves when the database has been cleared.
 */
const clearDatabase = async (): Promise<void> => {
  try {
    // Set connection options to prevent hanging
    const options = {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      socketTimeoutMS: 5000,
    };

    // Connect to MongoDB
    await mongoose.connect(A_MONGO_URL, options);
    console.log('Connected to MongoDB');

    // Drop the database
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
      console.log('Database cleared');
    } else {
      throw new Error('Database connection not established');
    }

    // Close the connection
    await mongoose.connection.close();
    console.log('Connection closed');
  } catch (err) {
    console.error(`ERROR: ${err}`);
    // Ensure connection is closed even on error
    try {
      if (mongoose.connection.readyState !== mongoose.ConnectionStates.disconnected) {
        await mongoose.connection.close();
      }
    } catch (closeErr) {
      // Ignore close errors
    }
    process.exit(1);
  }
};

// Set a timeout to ensure the script doesn't hang forever
const timeout = setTimeout(() => {
  console.error('Script timed out after 10 seconds');
  process.exit(1);
}, 10000);

clearDatabase()
  .then(() => {
    clearTimeout(timeout);
    console.log('Processing complete');
    process.exit(0);
  })
  .catch(err => {
    clearTimeout(timeout);
    console.error(`ERROR: ${err}`);
    process.exit(1);
  });
