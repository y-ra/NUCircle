import mongoose from 'mongoose';
import UserModel from '../../models/users.model';
import MessageModel from '../../models/messages.model';
import { addCommunityMessage, getCommunityMessages } from '../../services/communityMessagesService';
import { DatabaseMessage, Message } from '../../types/types';

const COMMUNITY_ID = new mongoose.Types.ObjectId().toString();

const message1: Message & { communityID: string } = {
  msg: 'Hello Community!',
  msgFrom: 'User1',
  msgDateTime: new Date('2024-06-04'),
  type: 'community',
  communityID: COMMUNITY_ID,
};

const message2: Message & { communityID: string } = {
  msg: 'Hi everyone!',
  msgFrom: 'User2',
  msgDateTime: new Date('2024-06-05'),
  type: 'community',
  communityID: COMMUNITY_ID,
};

describe('Community Messages Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addCommunityMessage', () => {
    test('should create a community message successfully if user exists', async () => {
      jest.spyOn(UserModel, 'findOne').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        username: 'User1',
      });

      const mockCreatedMsg = {
        _id: new mongoose.Types.ObjectId(),
        ...message1,
        communityID: message1.communityID,
      };
      jest
        .spyOn(MessageModel, 'create')
        .mockResolvedValueOnce(mockCreatedMsg as unknown as ReturnType<typeof MessageModel.create>);

      const result = await addCommunityMessage(message1);

      expect(result).toMatchObject({
        msg: 'Hello Community!',
        msgFrom: 'User1',
        msgDateTime: new Date('2024-06-04'),
        type: 'community',
        communityID: message1.communityID,
      });
    });
    test('should return an error if user does not exist', async () => {
      jest.spyOn(UserModel, 'findOne').mockResolvedValue(null);

      const result = await addCommunityMessage(message2);
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain(
          'Error when saving a community message: Message sender is invalid or does not exist.',
        );
      }
    });
    test('should return an error if message creation fails', async () => {
      jest.spyOn(UserModel, 'findOne').mockResolvedValue({ _id: 'someID' });
      jest.spyOn(MessageModel, 'create').mockRejectedValue(new Error('Database error'));

      const result = await addCommunityMessage(message1);
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Error when saving a community message: ');
      }
    });
  });

  describe('getCommunityMessages', () => {
    test('should return messages sorted by date', async () => {
      jest
        .spyOn(MessageModel, 'find')
        .mockResolvedValueOnce([
          message2 as unknown as DatabaseMessage,
          message1 as unknown as DatabaseMessage,
        ]);

      const result = await getCommunityMessages(COMMUNITY_ID);

      expect(result).toHaveLength(2);
      expect(result[0].msg).toEqual('Hello Community!');
      expect(result[1].msg).toEqual('Hi everyone!');
    });

    test('should return an empty array if error occurs', async () => {
      jest.spyOn(MessageModel, 'find').mockRejectedValue(new Error('Database error'));

      const result = await getCommunityMessages(COMMUNITY_ID);

      expect(result).toEqual([]);
    });
  });
});
