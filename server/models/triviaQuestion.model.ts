import mongoose, { Model } from 'mongoose';
import triviaQuestionSchema from './schema/triviaQuestion.schema';

/**
 * Interface represent trivia question document
 */
export interface TriviaQuestionDocument {
  _id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
}

/**
 * Mongoose model for the TriviaQuestion collection that provides interface for interacting with trivia questions
 */
const TriviaQuestionModel: Model<TriviaQuestionDocument> = mongoose.model<TriviaQuestionDocument>(
  'TriviaQuestion',
  triviaQuestionSchema,
);

export default TriviaQuestionModel;
