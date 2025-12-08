import api from './config';
import { DatabaseMessage, Message } from '../types/types';

const COMMUNITIES_MESSAGES_API_URL = `/api/community/messages`;

const getCommunityMessages = async (communityId: string): Promise<DatabaseMessage[]> => {
  const res = await api.get(`${COMMUNITIES_MESSAGES_API_URL}/getMessages/${communityId}`);

  if (res.status !== 200) {
    throw new Error('Error while fetching community messages');
  }

  return res.data;
};

const addCommunityMessage = async (
  communityId: string,
  messageToAdd: Message,
): Promise<DatabaseMessage> => {
  const res = await api.post(`${COMMUNITIES_MESSAGES_API_URL}/addMessage`, {
    messageToAdd,
    communityID: communityId,
  });

  if (res.status !== 200) {
    throw new Error('Error while adding community message');
  }

  return res.data;
};

export { getCommunityMessages, addCommunityMessage };
