import { Schema } from 'mongoose';

/**
 * Mongoose schema for the User collection.
 *
 * This schema defines the structure for storing users in the database.
 * Each User includes the following fields:
 * - `username`: The username of the user.
 * - `firstName`: The user's first name.
 * - `lastName`: The user's last name.
 * - `password`: The encrypted password securing the user's account.
 * - `dateJoined`: The date the user joined the platform.
 * - `biography`: A brief biography of the user.
 * - `isOnline`: The boolean status indicating if the user is currently online.
 * - `socketId`: The socket.io connection ID for real-time communication.
 * - `lastSeen`: The last time the user was active on the platform.
 * - `badges`: An array of badges earned by the user, each with a type, name, and earned date.
 * - `hasSeenWelcomeMessage`: A boolean indicating if the user has seen the welcome message.
 * - `points`: The total points accumulated by the user.
 * - `major`: The user's academic major.
 * - `graduationYear`: The user's expected graduation year.
 * - `showStats`: A boolean indicating if the user wants to display their stats publicly.
 * - `externalLinks`: An object containing links to the user's LinkedIn, GitHub, and portfolio.
 * - `coopInterests`: A description of the user's cooperative education interests.
 * - `careerGoals`: A description of the user's career goals.
 * - `technicalInterests`: A description of the user's technical interests.
 */
const userSchema: Schema = new Schema(
  {
    username: {
      type: String,
      unique: true,
      immutable: true,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    dateJoined: {
      type: Date,
    },
    biography: {
      type: String,
      default: '',
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    socketId: {
      type: String,
      default: null,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    badges: [
      {
        type: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        earnedAt: {
          type: Date,
          required: true,
          default: Date.now,
        },
      },
    ],
    hasSeenWelcomeMessage: {
      type: Boolean,
      default: false,
    },
    points: {
      type: Number,
      default: 0,
    },
    major: {
      type: String,
      default: '',
    },
    graduationYear: {
      type: Number,
      default: null,
    },
    coopInterests: {
      type: String,
      default: '',
    },
    showStats: {
      type: Boolean,
      default: true,
    },
    externalLinks: {
      linkedin: {
        type: String,
        default: '',
      },
      github: {
        type: String,
        default: '',
      },
      portfolio: {
        type: String,
        default: '',
      },
    },
    careerGoals: {
      type: String,
      default: '',
    },
    technicalInterests: {
      type: String,
      default: '',
    },
  },
  { collection: 'User' },
);

export default userSchema;
