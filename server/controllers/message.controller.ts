import express, { Response, Request } from 'express';
import { FakeSOSocket, AddMessageRequest } from '../types/types';
import { saveMessage, getMessages } from '../services/message.service';

const messageController = (socket: FakeSOSocket) => {
  const router = express.Router();

  /**
   * Handles adding a new message. The message is first validated and then saved.
   * If the message is invalid or saving fails, the HTTP response status is updated.
   *
   * @param req The AddMessageRequest object containing the message and chat data.
   * @param res The HTTP response object used to send back the result of the operation.
   *
   * @returns A Promise that resolves to void.
   */
  const addMessageRoute = async (req: AddMessageRequest, res: Response): Promise<void> => {
    const { messageToAdd: msg } = req.body;

    try {
      const msgFromDb = await saveMessage({ ...msg, type: 'global' });

      if ('error' in msgFromDb) {
        throw new Error(msgFromDb.error);
      }

      socket.emit('messageUpdate', { msg: msgFromDb });

      res.json(msgFromDb);
    } catch (err: unknown) {
      res.status(500).send(`Error when adding a message: ${(err as Error).message}`);
    }
  };

  /**
   * Fetch all global messages in ascending order of their date and time.
   * @param req The request object.
   * @param res The HTTP response object used to send back the messages.
   * @returns A Promise that resolves to void.
   */
  const getMessagesRoute = async (_: Request, res: Response): Promise<void> => {
    const messages = await getMessages();
    res.json(messages);
  };

  /**
   * Toggle a love/like reaction for a given message.
   * @param req The request object containing messageId, reactionType, and username in the body.
   * @param res The HTTP response object used to send back the updated reactions.
   * @returns A Promise that resolves to void.
   */
  const toggleReactionRoute = async (req: Request, res: Response): Promise<void> => {
    try {
      const { messageId, reactionType, username } = req.body;

      if (!['love', 'like'].includes(reactionType)) {
        res.status(400).json({ error: 'Invalid reaction type' });
        return;
      }

      const MessageModel = (await import('../models/messages.model')).default;
      const message = await MessageModel.findById(messageId);
      if (!message) {
        res.status(404).json({ error: 'Message not found' });
        return;
      }

      // Ensure reactions object exists
      if (!message.reactions) {
        message.reactions = {
          love: { users: [], count: 0 },
          like: { users: [], count: 0 },
        };
      }

      const group = message.reactions[reactionType as 'love' | 'like'];
      const users = group.users || [];
      const hasReacted = users.includes(username);

      if (hasReacted) {
        group.users = users.filter((u: string) => u !== username);
        group.count = Math.max(0, group.count - 1);
      } else {
        group.users = users; // Ensure users array is assigned to group
        group.users.push(username);
        group.count = group.count + 1;
      }

      message.reactions[reactionType as 'love' | 'like'] = group;
      await message.save();

      // Emit live update
      socket.emit('reactionUpdated', {
        messageId,
        reactions: message.reactions,
      });

      res.json({
        messageId,
        reactions: message.reactions,
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to toggle reaction' });
    }
  };

  // Add appropriate HTTP verbs and their endpoints to the router
  router.post('/addMessage', addMessageRoute);
  router.get('/getMessages', getMessagesRoute);
  router.post('/toggleReaction', toggleReactionRoute);

  return router;
};

export default messageController;
