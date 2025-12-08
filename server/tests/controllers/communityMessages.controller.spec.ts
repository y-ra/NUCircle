import mongoose from 'mongoose';
import supertest from 'supertest';
import { app } from '../../app';
import * as communityService from '../../services/communityMessagesService';
import { DatabaseMessage, Message } from '../../types/types';

// mock jwt auth to always authenticate successfully
jest.mock('../../middleware/auth', () => ({
  __esModule: true,
  default: (req: any, res: any, next: any) => {
    req.user = { userId: 'test-user-id', username: 'testuser' };
    next();
  },
}));

jest.mock('../../models/messages.model');

const addCommunityMessageSpy = jest.spyOn(communityService, 'addCommunityMessage');
const getCommunityMessagesSpy = jest.spyOn(communityService, 'getCommunityMessages');

const COMMUNITY_ID = new mongoose.Types.ObjectId().toString();

describe('Community Messages Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/community/messages/addMessage', () => {
    const requestMessage: Message = {
      msg: 'Hello Community',
      msgFrom: 'User1',
      msgDateTime: new Date('2024-06-04'),
      type: 'community',
      communityId: COMMUNITY_ID,
    };

    test('should add a new community message', async () => {
      const messageFromDb: DatabaseMessage = {
        ...requestMessage,
        _id: new mongoose.Types.ObjectId(),
        type: 'community',
      };

      addCommunityMessageSpy.mockResolvedValue(messageFromDb);

      const response = await supertest(app).post('/api/community/messages/addMessage').send({
        messageToAdd: requestMessage,
        communityID: COMMUNITY_ID,
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        _id: messageFromDb._id.toString(),
        msg: messageFromDb.msg,
        msgFrom: messageFromDb.msgFrom,
        msgDateTime: messageFromDb.msgDateTime.toISOString(),
        type: 'community',
        communityId: COMMUNITY_ID,
      });
    });

    test('should return 400 if communityID is missing (branch coverage)', async () => {
      const response = await supertest(app).post('/api/community/messages/addMessage').send({
        messageToAdd: requestMessage,
      });

      expect(response.status).toBe(400);
      expect(response.text).toBe('Community ID is required');
    });

    test('should handle exception when adding message', async () => {
      addCommunityMessageSpy.mockRejectedValue(new Error('Database connection failed'));

      const response = await supertest(app).post('/api/community/messages/addMessage').send({
        messageToAdd: requestMessage,
        communityID: COMMUNITY_ID,
      });

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when adding a message');
    });

    test('should return error if message creation returns {error}', async () => {
      addCommunityMessageSpy.mockResolvedValue({ error: 'Failed to add message' });

      const response = await supertest(app).post('/api/community/messages/addMessage').send({
        messageToAdd: requestMessage,
        communityID: COMMUNITY_ID,
      });

      expect(response.status).toBe(500);
      expect(response.text).toBe('Error when adding a message: Failed to add message');
    });
  });

  describe('GET /api/community/messages/getMessages/:communityID', () => {
    test('should return all messages for a community, sorted by date', async () => {
      const message1: DatabaseMessage = {
        _id: new mongoose.Types.ObjectId(),
        msg: 'Hello Community',
        msgFrom: 'User1',
        msgDateTime: new Date('2024-06-04'),
        type: 'community',
        communityId: COMMUNITY_ID,
      };

      const message2: DatabaseMessage = {
        _id: new mongoose.Types.ObjectId(),
        msg: 'Hi Community',
        msgFrom: 'User2',
        msgDateTime: new Date('2024-06-05'),
        type: 'community',
        communityId: COMMUNITY_ID,
      };

      getCommunityMessagesSpy.mockResolvedValue([message1, message2]);

      const response = await supertest(app).get(
        `/api/community/messages/getMessages/${COMMUNITY_ID}`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        {
          ...message1,
          _id: message1._id.toString(),
          msgDateTime: message1.msgDateTime.toISOString(),
        },
        {
          ...message2,
          _id: message2._id.toString(),
          msgDateTime: message2.msgDateTime.toISOString(),
        },
      ]);
    });

    test('should return empty array when no messages exist', async () => {
      getCommunityMessagesSpy.mockResolvedValue([]);

      const response = await supertest(app).get(
        `/api/community/messages/getMessages/${COMMUNITY_ID}`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('should handle errors when fetching messages', async () => {
      getCommunityMessagesSpy.mockRejectedValue(new Error('Database error'));

      const response = await supertest(app).get(
        `/api/community/messages/getMessages/${COMMUNITY_ID}`,
      );

      expect(response.status).toBe(500);
      expect(response.text).toBe('Error when fetching community messages: Database error');
    });
  });
});
