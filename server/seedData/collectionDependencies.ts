import { AnswerImport, CollectionImport, QuestionImport } from '../types/populate';
import { User, Comment, Tag, Message, Community, DatabaseWorkExperience } from '../types/types';
import { TriviaQuestionDocument } from '../models/triviaQuestion.model';

/**
 * Maps collections to their dependencies to ensure proper reference resolution.
 * Key: collection name
 * Value: array of collections it depends on (must be imported before this collection)
 */
export const collectionDependencies = {
  tag: [],
  user: [],
  message: ['community'],
  comment: [],
  triviaQuestion: [],
  answer: ['comment'],
  question: ['tag', 'comment', 'answer', 'community'],
  community: [],
  collection: ['question'],
  workExperience: ['user'],
} as const;

export type CollectionName = keyof typeof collectionDependencies;

export type CollectionDocTypes = {
  user: User;
  comment: Comment;
  answer: AnswerImport;
  question: QuestionImport;
  tag: Tag;
  message: Message;
  community: Community;
  collection: CollectionImport;
  triviaQuestion: TriviaQuestionDocument;
  workExperience: DatabaseWorkExperience;
};
