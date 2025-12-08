import { Schema } from 'mongoose';

/**
 * Mongoose schema for the TriviaQuestion collection
 *
 * This schema defines the structure of a trivia question document in the database
 * Each question includes:
 * - question: The question text
 * - options: Array of 4 multiple-choice options
 * - correctAnswer: The index of the correct answer (0-3)
 */
const triviaQuestionSchema: Schema = new Schema(
  {
    question: {
      type: String,
      required: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length === 4,
        message: 'Options must have exactly 4 choices',
      },
    },
    correctAnswer: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
  },
  { collection: 'TriviaQuestion' },
);

export default triviaQuestionSchema;
