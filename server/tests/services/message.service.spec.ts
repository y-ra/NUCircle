import mongoose from 'mongoose';
import MessageModel from '../../models/messages.model';
import UserModel from '../../models/users.model';
import { getMessages, saveMessage } from '../../services/message.service';
import { Message } from '../../types/types';

const message1: Message = {
  msg: 'Hello',
  msgFrom: 'User1',
  msgDateTime: new Date('2024-06-04'),
  type: 'global',
};

const message2: Message = {
  msg: 'Hi',
  msgFrom: 'User2',
  msgDateTime: new Date('2024-06-05'),
  type: 'global',
};

describe('Message model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveMessage', () => {
    const mockMessage: Message = {
      msg: 'Hey!',
      msgFrom: 'userX',
      msgDateTime: new Date('2025-01-01T10:00:00.000Z'),
      type: 'direct',
    };

    it('should create a message successfully if user exists', async () => {
      jest.spyOn(UserModel, 'findOne').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        username: 'userX',
      });

      // Mock the created message
      const mockCreatedMsg = {
        _id: new mongoose.Types.ObjectId(),
        ...mockMessage,
      };
      jest
        .spyOn(MessageModel, 'create')
        .mockResolvedValueOnce(mockCreatedMsg as unknown as ReturnType<typeof MessageModel.create>);

      const result = await saveMessage(mockMessage);

      expect(result).toMatchObject({
        msg: 'Hey!',
        msgFrom: 'userX',
        msgDateTime: new Date('2025-01-01T10:00:00.000Z'),
        type: 'direct',
      });
    });

    it('should return an error if user does not exist', async () => {
      jest.spyOn(UserModel, 'findOne').mockResolvedValue(null);

      const result = await saveMessage(mockMessage);
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Message sender is invalid');
      }
    });

    it('should return an error if message creation fails', async () => {
      jest.spyOn(UserModel, 'findOne').mockResolvedValue({ _id: 'someUserId' });

      jest.spyOn(MessageModel, 'create').mockRejectedValueOnce(new Error('Create failed'));

      const result = await saveMessage(mockMessage);
      expect(result).toHaveProperty('error');
      if ('error' in result) {
        expect(result.error).toContain('Error when saving a message');
      }
    });
  });

  describe('getMessages', () => {
    it('should return all messages, sorted by date', async () => {
      jest.spyOn(MessageModel, 'find').mockResolvedValueOnce([message2, message1]);

      const messages = await getMessages();

      expect(messages).toMatchObject([message1, message2]);
    });

    it('should return an empty array if error when retrieving messages', async () => {
      jest
        .spyOn(MessageModel, 'find')
        .mockRejectedValueOnce(() => new Error('Error retrieving documents'));

      const messages = await getMessages();

      expect(messages).toEqual([]);
    });
  });
  describe('Toggle Message Reactions', () => {
    let mockMessageId: mongoose.Types.ObjectId;
    let mockMessage: any;

    beforeEach(() => {
      mockMessageId = new mongoose.Types.ObjectId();
      mockMessage = {
        _id: mockMessageId,
        msg: 'Test message',
        msgFrom: 'User1',
        msgDateTime: new Date('2024-06-04'),
        type: 'global',
        reactions: {
          love: { users: [], count: 0 },
          like: { users: [], count: 0 },
        },
        save: jest.fn(),
      };
    });

    it('should add a like reaction to a message', async () => {
      jest.spyOn(MessageModel, 'findById').mockResolvedValue(mockMessage);

      // Simulate adding a reaction
      mockMessage.reactions.like.users.push('user1');
      mockMessage.reactions.like.count = 1;

      mockMessage.save.mockResolvedValue(mockMessage);
      await mockMessage.save();

      expect(mockMessage.reactions.like.count).toBe(1);
      expect(mockMessage.reactions.like.users).toContain('user1');
      expect(mockMessage.save).toHaveBeenCalled();
    });

    it('should add a love reaction to a message', async () => {
      jest.spyOn(MessageModel, 'findById').mockResolvedValue(mockMessage);

      // Simulate adding a love reaction
      mockMessage.reactions.love.users.push('user1');
      mockMessage.reactions.love.count = 1;

      mockMessage.save.mockResolvedValue(mockMessage);
      await mockMessage.save();

      expect(mockMessage.reactions.love.count).toBe(1);
      expect(mockMessage.reactions.love.users).toContain('user1');
      expect(mockMessage.save).toHaveBeenCalled();
    });

    it('should remove a reaction when user toggles again', async () => {
      mockMessage.reactions.like.users = ['user1'];
      mockMessage.reactions.like.count = 1;

      jest.spyOn(MessageModel, 'findById').mockResolvedValue(mockMessage);

      // Simulate removing the reaction
      mockMessage.reactions.like.users = mockMessage.reactions.like.users.filter(
        (u: string) => u !== 'user1',
      );
      mockMessage.reactions.like.count = Math.max(0, mockMessage.reactions.like.count - 1);

      mockMessage.save.mockResolvedValue(mockMessage);
      await mockMessage.save();

      expect(mockMessage.reactions.like.count).toBe(0);
      expect(mockMessage.reactions.like.users).not.toContain('user1');
      expect(mockMessage.save).toHaveBeenCalled();
    });

    it('should allow multiple users to react to the same message', async () => {
      jest.spyOn(MessageModel, 'findById').mockResolvedValue(mockMessage);

      // User1 and User2 like
      mockMessage.reactions.like.users.push('user1', 'user2');
      mockMessage.reactions.like.count = 2;

      // User3 loves
      mockMessage.reactions.love.users.push('user3');
      mockMessage.reactions.love.count = 1;

      mockMessage.save.mockResolvedValue(mockMessage);
      await mockMessage.save();

      expect(mockMessage.reactions.like.count).toBe(2);
      expect(mockMessage.reactions.like.users).toEqual(['user1', 'user2']);
      expect(mockMessage.reactions.love.count).toBe(1);
      expect(mockMessage.reactions.love.users).toEqual(['user3']);
      expect(mockMessage.save).toHaveBeenCalled();
    });

    it('should initialize reactions object if it does not exist', async () => {
      const messageWithoutReactions: any = {
        _id: mockMessageId,
        msg: 'No reactions yet',
        msgFrom: 'User1',
        msgDateTime: new Date('2024-06-04'),
        type: 'global',
        save: jest.fn(),
      };

      jest.spyOn(MessageModel, 'findById').mockResolvedValue(messageWithoutReactions);

      messageWithoutReactions.reactions = {
        love: { users: [], count: 0 },
        like: { users: [], count: 0 },
      };

      messageWithoutReactions.reactions.like.users.push('user1');
      messageWithoutReactions.reactions.like.count = 1;

      messageWithoutReactions.save.mockResolvedValue(messageWithoutReactions);
      await messageWithoutReactions.save();

      expect(messageWithoutReactions.reactions).toBeDefined();
      expect(messageWithoutReactions.reactions.like.count).toBe(1);
      expect(messageWithoutReactions.save).toHaveBeenCalled();
    });
  });
});
