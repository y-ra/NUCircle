/* eslint-disable no-console */
import mongoose from 'mongoose';
import 'dotenv/config';

import AnswerModel from '../models/answers.model';
import CommentModel from '../models/comments.model';
import QuestionModel from '../models/questions.model';
import TagModel from '../models/tags.model';
import UserModel from '../models/users.model';
import MessageModel from '../models/messages.model';
import TriviaQuestionModel from '../models/triviaQuestion.model';

import answersResolver from './resolvers/answer';
import questionsResolver from './resolvers/question';
import identityResolver from './resolvers/identity';

import { type InsertedDocs } from '../types/populate';

import { collectionDependencies } from './collectionDependencies';
import { computeImportOrder, loadJSON, processCollection } from './utils';
import CommunityModel from '../models/community.model';
import CollectionModel from '../models/collection.model';
import collectionsResolver from './resolvers/collection';

import WorkExperienceModel from '../models/workExperience.model';
import messageResolver from './resolvers/message';

// Compute the import order based on dependencies
const IMPORT_ORDER = computeImportOrder(collectionDependencies);

const collectionMapping = {
  user: {
    model: UserModel,
    resolver: identityResolver,
  },
  comment: {
    model: CommentModel,
    resolver: identityResolver,
  },
  answer: {
    model: AnswerModel,
    resolver: answersResolver,
  },
  question: {
    model: QuestionModel,
    resolver: questionsResolver,
  },
  tag: {
    model: TagModel,
    resolver: identityResolver,
  },
  message: {
    model: MessageModel,
    resolver: messageResolver,
  },
  community: {
    model: CommunityModel,
    resolver: identityResolver,
  },
  collection: {
    model: CollectionModel,
    resolver: collectionsResolver,
  },
  triviaQuestion: {
    model: TriviaQuestionModel,
    resolver: identityResolver,
  },
  workExperience: {
    model: WorkExperienceModel,
    resolver: identityResolver,
  },
};

console.log('Using computed import order:', IMPORT_ORDER);

/**
 * Main function to populate the database with sample data.
 * Connects to MongoDB, processes collections in a specific order,
 * resolves references between documents, and inserts them.
 * @returns {Promise<void>} - A promise that resolves when database population is complete.
 * @throws {Error} - If MongoDB URI is not set or if there's an error during processing.
 */
async function main(args: string[]) {
  try {
    // Use MONGODB_URI from environment, command line argument, or fallback to default local MongoDB
    const mongoURL = process.env.MONGODB_URI || args[0] || 'mongodb://127.0.0.1:27017';

    if (!mongoURL.startsWith('mongodb')) {
      throw new Error('ERROR: You need to specify a valid MongoDB URL as the first argument');
    }

    const dbName = 'fake_so';
    const mongoURLWithDB = `${mongoURL}/${dbName}`;

    // Set connection options to prevent hanging
    const options = {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 10000,
    };

    await mongoose.connect(mongoURLWithDB, options);

    console.log('Connected to MongoDB');

    // Safety check: Clear all collections before populating to avoid duplicate key errors
    // This ensures a clean state even if cleanup didn't run properly
    console.log('Clearing existing collections...');
    for (const collectionName of IMPORT_ORDER) {
      const { model } = collectionMapping[collectionName];
      try {
        // Cast to mongoose.Model to ensure deleteMany is callable
        await (model as unknown as mongoose.Model<mongoose.Document>).deleteMany({});
        console.log(`Cleared ${collectionName} collection`);
      } catch (err) {
        console.warn(`Warning: Could not clear ${collectionName} collection:`, err);
      }
    }
    console.log('Collections cleared, starting population...');

    const insertedDocs: InsertedDocs = {};

    // Load all collections' JSON
    const loadPromises = IMPORT_ORDER.map(async collectionName => {
      const docs = await loadJSON(collectionName);
      return { collectionName, docs };
    });

    const loadedData = await Promise.all(loadPromises);
    const docsMap = new Map();
    loadedData.forEach(({ collectionName, docs }) => {
      docsMap.set(collectionName, docs);
    });

    // Loop through collections and handle each with command design pattern
    for (const collectionName of IMPORT_ORDER) {
      console.log(`Processing ${collectionName}...`);

      insertedDocs[collectionName] = new Map();
      const docs = docsMap.get(collectionName) || {};

      const { model, resolver } = collectionMapping[collectionName];

      /* eslint-disable @typescript-eslint/no-explicit-any */
      await processCollection<any, any, any>(model, resolver, docs, insertedDocs, collectionName);
    }

    await mongoose.disconnect();
    console.log('\nPopulation complete. Disconnected from MongoDB.');
  } catch (err) {
    console.error('Error populating database:', err);
    // Ensure connection is closed even on error
    try {
      if (mongoose.connection.readyState !== mongoose.ConnectionStates.disconnected) {
        await mongoose.connection.close();
      }
    } catch (closeErr) {
      // Ignore close errors
    }
    throw err;
  }
}

// Set a timeout to ensure the script doesn't hang forever
const timeout = setTimeout(() => {
  console.error('Script timed out after 25 seconds');
  process.exit(1);
}, 25000);

main(process.argv.slice(2))
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
