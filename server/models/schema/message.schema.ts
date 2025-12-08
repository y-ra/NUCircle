import { Schema } from 'mongoose';

/**
 * Mongoose schema for the Message collection.
 *
 * This schema defines the structure of a message in the database.
 * Each message includes the following fields:
 * - `msg`: The text of the message.
 * - `msgFrom`: The username of the user sending the message.
 * - `msgDateTime`: The date and time the message was sent.
 * - `type`: The type of message, either 'global' or 'direct'.
 * - `reaction`: Object containing emoji reactions and counts.
 */
const messageSchema: Schema = new Schema(
  {
    msg: {
      type: String,
    },
    msgFrom: {
      type: String,
    },
    msgDateTime: {
      type: Date,
    },
    type: {
      type: String,
      enum: ['global', 'direct', 'community'],
    },
    communityId: {
      type: String,
      ref: 'Community',
      default: null,
    },
    reactions: {
      love: {
        users: { type: [String], default: [] }, // usernames who tapped love
        count: { type: Number, default: 0 },
      },
      like: {
        users: { type: [String], default: [] }, // usernames who tapped like
        count: { type: Number, default: 0 },
      },
    },
  },
  { collection: 'Message' },
);

export default messageSchema;
