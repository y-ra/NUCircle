import UserModel from '../models/users.model';
import { DatabaseUser } from '../types/types';

/**
 * Awards points to a user by their username.
 *
 * @param username - The username of the user
 * @param points - The number of points to award
 * @returns Promise resolving to the updated total points of the user
 */
export const awardPointsToUser = async (username: string, points: number): Promise<number> => {
  try {
    const user = await UserModel.findOne({ username });
    if (!user) {
      return 0;
    }
    user.points = (user.points || 0) + points;
    await user.save();
    return user.points;
  } catch (error) {
    return 0;
  }
};

/**
 * Retrieves the total points of a user by their username.
 * @param username - The username of the user
 * @returns Promise resolving to the total points of the user
 */
export const getUserPoints = async (username: string): Promise<number> => {
  try {
    const user: DatabaseUser | null = await UserModel.findOne({ username });
    if (!user) {
      return 0;
    }
    return user.points || 0;
  } catch (error) {
    return 0;
  }
};
