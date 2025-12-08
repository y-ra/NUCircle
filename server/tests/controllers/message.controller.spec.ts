import mongoose from 'mongoose';
import supertest from 'supertest';
import { app } from '../../app';
import * as util from '../../services/message.service';
import { DatabaseMessage, Message } from '../../types/types';
import MessageModel from '../../models/messages.model';

// mock jwt auth to always authenticate successfully
jest.mock('../../middleware/auth', () => ({
  __esModule: true,
  default: (req: any, res: any, next: any) => {
    req.user = { userId: 'test-user-id', username: 'testuser' };
    next();
  },
}));

jest.mock('../../models/messages.model');

const saveMessageSpy = jest.spyOn(util, 'saveMessage');
const getMessagesSpy = jest.spyOn(util, 'getMessages');

describe('POST /addMessage', () => {
  it('should add a new message', async () => {
    const validId = new mongoose.Types.ObjectId();

    const requestMessage: Message = {
      msg: 'Hello',
      msgFrom: 'User1',
      msgDateTime: new Date('2024-06-04'),
      type: 'global',
    };

    const message: DatabaseMessage = {
      ...requestMessage,
      _id: validId,
    };

    saveMessageSpy.mockResolvedValue(message);

    const response = await supertest(app)
      .post('/api/message/addMessage')
      .send({ messageToAdd: requestMessage });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      _id: message._id.toString(),
      msg: message.msg,
      msgFrom: message.msgFrom,
      msgDateTime: message.msgDateTime.toISOString(),
      type: 'global',
    });
  });

  it('should return bad request error if messageToAdd is missing', async () => {
    const response = await supertest(app).post('/api/message/addMessage').send({});

    const openApiError = JSON.parse(response.text);

    expect(response.status).toBe(400);
    expect(openApiError.errors[0].path).toBe('/body/messageToAdd');
  });

  it('should return bad message body error if msg is empty', async () => {
    const badMessage = {
      msg: '',
      msgFrom: 'User1',
      msgDateTime: new Date('2024-06-04'),
    };

    const response = await supertest(app)
      .post('/api/message/addMessage')
      .send({ messageToAdd: badMessage });

    const openApiError = JSON.parse(response.text);

    expect(response.status).toBe(400);
    expect(openApiError.errors[0].path).toBe('/body/messageToAdd/msg');
  });

  it('should return bad message body error if msg is missing', async () => {
    const badMessage = {
      msgFrom: 'User1',
      msgDateTime: new Date('2024-06-04'),
    };

    const response = await supertest(app)
      .post('/api/message/addMessage')
      .send({ messageToAdd: badMessage });

    const openApiError = JSON.parse(response.text);

    expect(response.status).toBe(400);
    expect(openApiError.errors[0].path).toBe('/body/messageToAdd/msg');
  });

  it('should return bad message body error if msgFrom is empty', async () => {
    const badMessage = {
      msg: 'Hello',
      msgFrom: '',
      msgDateTime: new Date('2024-06-04'),
    };

    const response = await supertest(app)
      .post('/api/message/addMessage')
      .send({ messageToAdd: badMessage });

    const openApiError = JSON.parse(response.text);

    expect(response.status).toBe(400);
    expect(openApiError.errors[0].path).toBe('/body/messageToAdd/msgFrom');
  });

  it('should return bad message body error if msgFrom is missing', async () => {
    const badMessage = {
      msg: 'Hello',
      msgDateTime: new Date('2024-06-04'),
    };

    const response = await supertest(app)
      .post('/api/message/addMessage')
      .send({ messageToAdd: badMessage });

    const openApiError = JSON.parse(response.text);

    expect(response.status).toBe(400);
    expect(openApiError.errors[0].path).toBe('/body/messageToAdd/msgFrom');
  });

  it('should return bad message body error if msgDateTime is missing', async () => {
    const badMessage = {
      msg: 'Hello',
      msgFrom: 'User1',
    };

    const response = await supertest(app)
      .post('/api/message/addMessage')
      .send({ messageToAdd: badMessage });

    const openApiError = JSON.parse(response.text);

    expect(response.status).toBe(400);
    expect(openApiError.errors[0].path).toBe('/body/messageToAdd/msgDateTime');
  });

  it('should return bad message body error if msgDateTime is null', async () => {
    const badMessage = {
      msg: 'Hello',
      msgFrom: 'User1',
      msgDateTime: null,
    };

    const response = await supertest(app)
      .post('/api/message/addMessage')
      .send({ messageToAdd: badMessage });

    const openApiError = JSON.parse(response.text);

    expect(response.status).toBe(400);
    expect(openApiError.errors[0].path).toBe('/body/messageToAdd/msgDateTime');
  });

  it('should return internal server error if saveMessage fails', async () => {
    const validId = new mongoose.Types.ObjectId();
    const message = {
      _id: validId,
      msg: 'Hello',
      msgFrom: 'User1',
      msgDateTime: new Date('2024-06-04'),
    };

    saveMessageSpy.mockResolvedValue({ error: 'Error saving document' });

    const response = await supertest(app)
      .post('/api/message/addMessage')
      .send({ messageToAdd: message });

    expect(response.status).toBe(500);
    expect(response.text).toBe('Error when adding a message: Error saving document');
  });
});

describe('GET /getMessages', () => {
  it('should return all messages', async () => {
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

    const dbMessage1: DatabaseMessage = {
      ...message1,
      _id: new mongoose.Types.ObjectId(),
    };

    const dbMessage2: DatabaseMessage = {
      ...message2,
      _id: new mongoose.Types.ObjectId(),
    };

    getMessagesSpy.mockResolvedValue([dbMessage1, dbMessage2]);

    const response = await supertest(app).get('/api/message/getMessages');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        ...dbMessage1,
        _id: dbMessage1._id.toString(),
        msgDateTime: dbMessage1.msgDateTime.toISOString(),
      },
      {
        ...dbMessage2,
        _id: dbMessage2._id.toString(),
        msgDateTime: dbMessage2.msgDateTime.toISOString(),
      },
    ]);
  });
});

describe('POST /toggleReaction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 for invalid reaction type', async () => {
    const response = await supertest(app).post('/api/message/toggleReaction').send({
      messageId: '507f1f77bcf86cd799439011',
      reactionType: 'invalid',
      username: 'testuser',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid reaction type');
  });

  it('should return 404 when message not found', async () => {
    (MessageModel.findById as jest.Mock).mockResolvedValue(null);

    const response = await supertest(app).post('/api/message/toggleReaction').send({
      messageId: '507f1f77bcf86cd799439011',
      reactionType: 'love',
      username: 'testuser',
    });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Message not found');
  });

  it('should add reaction when user has not reacted', async () => {
    const mockMessage = {
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
      reactions: {
        love: { users: [], count: 0 },
        like: { users: [], count: 0 },
      },
      save: jest.fn().mockResolvedValue(true),
    };

    (MessageModel.findById as jest.Mock).mockResolvedValue(mockMessage);

    const response = await supertest(app).post('/api/message/toggleReaction').send({
      messageId: '507f1f77bcf86cd799439011',
      reactionType: 'love',
      username: 'testuser',
    });

    expect(response.status).toBe(200);
    expect(mockMessage.reactions.love.users).toContain('testuser');
    expect(mockMessage.reactions.love.count).toBe(1);
  });

  it('should remove reaction when user has already reacted', async () => {
    const mockMessage = {
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
      reactions: {
        love: { users: ['testuser'], count: 1 },
        like: { users: [], count: 0 },
      },
      save: jest.fn().mockResolvedValue(true),
    };

    (MessageModel.findById as jest.Mock).mockResolvedValue(mockMessage);

    const response = await supertest(app).post('/api/message/toggleReaction').send({
      messageId: '507f1f77bcf86cd799439011',
      reactionType: 'love',
      username: 'testuser',
    });

    expect(response.status).toBe(200);
    expect(mockMessage.reactions.love.users).not.toContain('testuser');
    expect(mockMessage.reactions.love.count).toBe(0);
  });

  it('should initialize reactions object if it does not exist', async () => {
    const mockMessage: any = {
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
      reactions: undefined,
      save: jest.fn().mockResolvedValue(true),
    };

    (MessageModel.findById as jest.Mock).mockResolvedValue(mockMessage);

    const response = await supertest(app).post('/api/message/toggleReaction').send({
      messageId: '507f1f77bcf86cd799439011',
      reactionType: 'love',
      username: 'testuser',
    });

    expect(response.status).toBe(200);
    expect(mockMessage.reactions).toBeDefined();
    expect(mockMessage.reactions.love.users).toContain('testuser');
    expect(mockMessage.reactions.love.count).toBe(1);
  });

  it('should handle like reaction type', async () => {
    const mockMessage = {
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
      reactions: {
        love: { users: [], count: 0 },
        like: { users: [], count: 0 },
      },
      save: jest.fn().mockResolvedValue(true),
    };

    (MessageModel.findById as jest.Mock).mockResolvedValue(mockMessage);

    const response = await supertest(app).post('/api/message/toggleReaction').send({
      messageId: '507f1f77bcf86cd799439011',
      reactionType: 'like',
      username: 'testuser',
    });

    expect(response.status).toBe(200);
    expect(mockMessage.reactions.like.users).toContain('testuser');
    expect(mockMessage.reactions.like.count).toBe(1);
  });

  it('should return 500 when database error occurs', async () => {
    (MessageModel.findById as jest.Mock).mockRejectedValue(new Error('DB Error'));

    const response = await supertest(app).post('/api/message/toggleReaction').send({
      messageId: '507f1f77bcf86cd799439011',
      reactionType: 'love',
      username: 'testuser',
    });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to toggle reaction');
  });

  it('should handle reaction group without users property', async () => {
    const mockMessage: any = {
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
      reactions: {
        love: { count: 0 }, // users property is missing
        like: { users: [], count: 0 },
      },
      save: jest.fn().mockResolvedValue(true),
    };

    (MessageModel.findById as jest.Mock).mockResolvedValue(mockMessage);

    const response = await supertest(app).post('/api/message/toggleReaction').send({
      messageId: '507f1f77bcf86cd799439011',
      reactionType: 'love',
      username: 'testuser',
    });

    expect(response.status).toBe(200);
    expect(mockMessage.reactions.love.users).toContain('testuser');
    expect(mockMessage.reactions.love.count).toBe(1);
  });
});
