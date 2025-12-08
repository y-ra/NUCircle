import { Badge } from '../types/types';
import api from './config';

const BADGE_API_URL = `/api/badge`;

/**
 * Fetches all badges for a user by username.
 *
 * @param username - The username of the user
 * @returns A promise resolving to an array of badges
 * @throws Error if there is an issue fetching badges
 */
const getUserBadges = async (username: string): Promise<Badge[]> => {
  const res = await api.get(`${BADGE_API_URL}/${username}`);
  if (res.status !== 200) {
    throw new Error('Error when fetching badges');
  }
  return res.data;
};

export default { getUserBadges };
