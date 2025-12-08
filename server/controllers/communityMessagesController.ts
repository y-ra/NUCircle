import express, { Response } from 'express';
import {
  FakeSOSocket,
  AddCommunityMessageRequest,
  GetCommunityMessageRequest,
} from '../types/types';
import { addCommunityMessage, getCommunityMessages } from '../services/communityMessagesService';

const communityMessagesController = (socket: FakeSOSocket) => {
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
  const addCommunityMessageRoute = async (
    req: AddCommunityMessageRequest,
    res: Response,
  ): Promise<void> => {
    const { messageToAdd: msg, communityID } = req.body;
    if (!communityID) {
      res.status(400).send('Community ID is required');
      return;
    }

    try {
      const msgFromDb = await addCommunityMessage({
        ...msg,
        type: 'community',
        communityID,
      });

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
   * Retrieves community messages for a specific community
   * @param req - The request object containing the community ID
   * @param res - The response object to send the messages back to the client
   */
  const getCommunityMessagesRoute = async (
    req: GetCommunityMessageRequest,
    res: Response,
  ): Promise<void> => {
    const { communityID } = req.params;
    try {
      const messages = await getCommunityMessages(communityID);
      res.json(messages);
    } catch (err: unknown) {
      res.status(500).send(`Error when fetching community messages: ${(err as Error).message}`);
    }
  };

  // Add appropriate HTTP verbs and their endpoints to the router
  router.post('/addMessage', addCommunityMessageRoute);
  router.get('/getMessages/:communityID', getCommunityMessagesRoute);

  return router;
};

export default communityMessagesController;
