import MessageModel from '../models/messages.model';
import UserModel from '../models/users.model';
import { DatabaseMessage, DatabaseUser, Message } from '../types/types';

/**
 * Adds a new community message to the database
 * @param message - The message object containing message details and communityID
 * @returns A promise that resolves to the saved DatabaseMessage or an error object
 */
export const addCommunityMessage = async (
  message: Message & { communityID: string },
): Promise<DatabaseMessage | { error: string }> => {
  try {
    const user: DatabaseUser | null = await UserModel.findOne({ username: message.msgFrom });
    if (!user) {
      throw new Error('Message sender is invalid or does not exist.');
    }

    const newMessage: DatabaseMessage = await MessageModel.create({
      ...message,
      type: 'community',
      communityId: message.communityID,
    });

    return newMessage;
  } catch (error) {
    return { error: `Error when saving a community message: ${(error as Error).message}` };
  }
};

/**
 * Retrieves all community messages for a specific community from the database, sorted by date in ascending order
 * @param communityID - The ID of the community to retrieve messages for
 * @returns A promise that resolves to an array of community messages or an empty array if an error occurs
 */
export const getCommunityMessages = async (communityID: string): Promise<DatabaseMessage[]> => {
  try {
    const messages: DatabaseMessage[] = await MessageModel.find({
      type: 'community',
      communityId: communityID,
    });
    messages.sort((a, b) => new Date(a.msgDateTime).getTime() - new Date(b.msgDateTime).getTime());

    return messages;
  } catch (error) {
    return [];
  }
};
