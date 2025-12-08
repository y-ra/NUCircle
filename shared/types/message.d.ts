import { ObjectId } from 'mongodb';
import { Request } from 'express';

/**
 * Represents a message in a chat.
 * - `msg`: The text content of the message.
 * - `msgFrom`: The username of the user sending the message.
 * - `msgDateTime`: The date and time when the message was sent.
 * - `type`: The type of the message, either 'global' or 'direct'.
 *  - `reactions`: Object containing emoji reactions and counts.
 */
export interface Message {
  msg: string;
  msgFrom: string;
  msgDateTime: Date;
  type: 'global' | 'direct' | 'community';
  communityId?: string;
  reactions?: MessageReactions;
}

/**
 * Represents the shape of emoji reactions attached to a message.
 * - `users`: usernames of who reacted.
 * - `count`: number of reactions to the message.
 */
export interface MessageReactionsBucket {
  users: string[];
  count: number;
}

/**
 * Represents the shape of emoji reactions attached to a message.
 * - `love`: user has loved the message.
 * - `like`: user has liked the message.
 */
export interface MessageReactions {
  love: MessageReactionsBucket;
  like: MessageReactionsBucket;
}

/**
 * Represents a message stored in the database.
 * - `_id`: Unique identifier for the message.
 * - `msg`: The text content of the message.
 * - `msgFrom`: The username of the user sending the message.
 * - `msgDateTime`: The date and time when the message was sent.
 * - `type`: The type of the message, either 'global' or 'direct'.
 */
export interface DatabaseMessage extends Message {
  _id: ObjectId;
}

/**
 * Type representing possible responses for a Message-related operation.
 * - Either a `DatabaseMessage` object or an error message.
 */
export type MessageResponse = DatabaseMessage | { error: string };

/**
 * Express request for adding a message to a chat.
 * - `body`: Contains the `messageToAdd` object, which includes the message text and metadata (excluding `type`).
 */
export interface AddMessageRequest extends Request {
  body: {
    messageToAdd: Omit<Message, 'type'>;
  };
}

/**
 * Express request for adding a message to a community chat.
 * - `body`: Contains the `messageToAdd` object (same structure as AddMessageRequest)
 *   plus the `communityID` indicating which community the message belongs to.
 */
export interface AddCommunityMessageRequest extends Request {
  body: {
    messageToAdd: Omit<Message, 'type'>;
    communityID: string;
  };
}

/**
 * Express request for getting community messages.
 * - `params`: Contains the `communityID` parameter.
 */
export interface GetCommunityMessageRequest extends Request {
  params: {
    communityID: string;
  };
}
