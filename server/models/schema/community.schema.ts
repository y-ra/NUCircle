import { Schema } from 'mongoose';

const userVisitDataSchema = new Schema({
  username: { type: String, required: true },
  lastVisitDate: { type: Date, required: true },
  currentStreak: { type: Number, required: true, default: 1 },
  longestStreak: { type: Number, required: true, default: 1 },
});

/**
 * Mongoose schema for the Community collection.
 *
 * - `participants`: an array of ObjectIds referencing the User collection.
 * - `questions`: an array of ObjectIds referencing the Question collection.
 * - Timestamps store `createdAt` & `updatedAt`.
 * - `name`: Name of the community.
 * - `description`: description of the community.
 * - `visibility`: enum [PUBLIC, PRIVATE].
 */

const communitySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    participants: [
      {
        type: String,
        required: true,
      },
    ],
    visibility: {
      type: String,
      enum: ['PUBLIC', 'PRIVATE'],
      required: true,
      default: 'PUBLIC',
    },
    admin: {
      type: String,
      required: true,
    },
    visitStreaks: {
      type: [userVisitDataSchema],
      default: [],
    },
  },
  {
    collection: 'Community',
    timestamps: true,
  },
);

export default communitySchema;
