import UserModel from '../models/users.model';
import QuestionModel from '../models/questions.model';
import AnswerModel from '../models/answers.model';
import CommunityModel from '../models/community.model';
import { Badge, DatabaseUser, SafeDatabaseUser } from '../types/types';

/**
 * Checks if a user already has a specific badge.
 *
 * @param username - The username of the user
 * @param badgeName - The name of the badge to check
 * @returns Promise resolving to true if user has the badge & false otherwise
 */
export const hasBadge = async (username: string, badgeName: string): Promise<boolean> => {
  try {
    const user = await UserModel.findOne({ username });
    if (!user || !user.badges) {
      return false;
    }
    return user.badges.some(badge => badge.name === badgeName);
  } catch (error) {
    return false;
  }
};

/**
 * Removes duplicate badges from a user's badge array based on badge name.
 *
 * @param username - The username of the user
 * @returns Promise resolving to void
 */
const deduplicateBadges = async (username: string): Promise<void> => {
  const user = await UserModel.findOne({ username });
  if (!user || !user.badges || user.badges.length === 0) {
    return;
  }

  // Create a map to track unique badges by name, keeping the first occurrence
  const uniqueBadges: Badge[] = [];
  const seenNames = new Set<string>();

  for (const badge of user.badges) {
    if (!seenNames.has(badge.name)) {
      seenNames.add(badge.name);
      uniqueBadges.push(badge);
    }
  }

  // Update user with deduplicated badges
  await UserModel.findOneAndUpdate({ username }, { badges: uniqueBadges }, { new: true });
};

/**
 * Awards a badge to a user if they don't already have it.
 * Uses MongoDB query to atomically check and add to prevent duplicates.
 *
 * @param username - The username of the user
 * @param badge - The badge object to award
 * @returns Promise resolving to true if badge was awarded & false otherwise
 */
const awardBadge = async (username: string, badge: Badge): Promise<boolean> => {
  try {
    // Use MongoDB query to atomically check if badge exists and add if it doesn't
    // This prevents race conditions that could lead to duplicates
    const result = await UserModel.findOneAndUpdate(
      {
        username,
        'badges.name': { $ne: badge.name }, // Only update if badge name doesn't exist
      },
      { $push: { badges: badge } },
      { new: true },
    );

    return result !== null;
  } catch (error) {
    return false;
  }
};

/**
 * Awards a community badge when a user joins a community.
 *
 * @param username - The username of the user
 * @param communityId - The ID of the community joined
 * @returns Promise resolving to true if badge was awarded, false otherwise
 */
export const checkAndAwardCommunityBadge = async (
  username: string,
  communityId: string,
): Promise<boolean> => {
  try {
    const community = await CommunityModel.findById(communityId);
    if (!community) {
      return false;
    }

    const badgeName = `Community Member: ${community.name}`;
    const badge: Badge = {
      type: 'community',
      name: badgeName,
      earnedAt: new Date(),
    };

    return await awardBadge(username, badge);
  } catch (error) {
    return false;
  }
};

/**
 * Checks milestone thresholds and awards badges accordingly.
 * Milestones: 50 questions/answers, 100 questions/answers
 *
 * @param username - The username of the user
 * @param type - The type of milestone ('question' or 'answer')
 * @param count - The current count of questions or answers
 * @returns Promise resolving to true if any badge was awarded, false otherwise
 */
export const checkAndAwardMilestoneBadge = async (
  username: string,
  type: 'question' | 'answer',
  count: number,
): Promise<boolean> => {
  try {
    let badgeAwarded = false;

    // Check for 50 milestone
    if (count === 50) {
      const badgeName = `50 ${type === 'question' ? 'Questions' : 'Answers'}`;
      if (!(await hasBadge(username, badgeName))) {
        const badge: Badge = {
          type: 'milestone',
          name: badgeName,
          earnedAt: new Date(),
        };
        await awardBadge(username, badge);
        badgeAwarded = true;
      }
    }

    // Check for 100 milestone
    if (count === 100) {
      const badgeName = `100 ${type === 'question' ? 'Questions' : 'Answers'}`;
      if (!(await hasBadge(username, badgeName))) {
        const badge: Badge = {
          type: 'milestone',
          name: badgeName,
          earnedAt: new Date(),
        };
        await awardBadge(username, badge);
        badgeAwarded = true;
      }
    }

    return badgeAwarded;
  } catch (error) {
    return false;
  }
};

/**
 * Retrieves all badges for a user.
 *
 * @param username - The username of the user
 * @returns Promise resolving to array of badges or empty array
 */
export const getUserBadges = async (username: string): Promise<Badge[]> => {
  try {
    const user: DatabaseUser | null = await UserModel.findOne({ username });
    if (!user || !user.badges) {
      return [];
    }
    return user.badges;
  } catch (error) {
    return [];
  }
};

/**
 * Counts the number of questions asked by a user.
 *
 * @param username - The username of the user
 * @returns Promise resolving to the count of questions
 */
export const countUserQuestions = async (username: string): Promise<number> => {
  try {
    const count = await QuestionModel.countDocuments({ askedBy: username });
    return count;
  } catch (error) {
    return 0;
  }
};

/**
 * Counts the number of answers provided by a user.
 *
 * @param username - The username of the user
 * @returns Promise resolving to the count of answers
 */
export const countUserAnswers = async (username: string): Promise<number> => {
  try {
    const count = await AnswerModel.countDocuments({ ansBy: username });
    return count;
  } catch (error) {
    return 0;
  }
};

/**
 * Checks leaderboard positions and awards badges to top 3 users.
 * Awards permanent badges for 1st, 2nd, and 3rd place positions.
 *
 * @param leaderboard - Array of users sorted by points (top users first)
 * @returns Promise resolving to void
 */
export const checkAndAwardLeaderboardBadges = async (
  leaderboard: SafeDatabaseUser[],
): Promise<void> => {
  // Award badges to top 3 positions
  const positions = [
    { index: 0, badgeName: '1st Place' },
    { index: 1, badgeName: '2nd Place' },
    { index: 2, badgeName: '3rd Place' },
  ];

  for (const { index, badgeName } of positions) {
    if (leaderboard[index] && leaderboard[index].username) {
      const username = leaderboard[index].username;

      // First, deduplicate any existing badges for this user
      await deduplicateBadges(username);

      // Check if user already has this badge
      if (!(await hasBadge(username, badgeName))) {
        const badge: Badge = {
          type: 'leaderboard',
          name: badgeName,
          earnedAt: new Date(),
        };
        await awardBadge(username, badge);
      }
    }
  }
};
