//server/services/user.service.ts
import CommunityModel from '../models/community.model';
import UserModel from '../models/users.model';
import WorkExperienceModel from '../models/workExperience.model';
import {
  DatabaseUser,
  SafeDatabaseUser,
  User,
  UserLogin,
  UserResponse,
  UsersResponse,
} from '../types/types';
import bcryptjs from 'bcryptjs';

/**
 * Saves a new user to the database.
 *
 * @param {User} user - The user object to be saved, containing user details like username, password, etc.
 * @returns {Promise<UserResponse>} - Resolves with the saved user object (without the password) or an error message.
 */
export const saveUser = async (user: User): Promise<UserResponse> => {
  try {
    // Password security reqs: 8+ chars, upper, lower, number, special
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!regex.test(user.password)) {
      throw Error(
        'Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character',
      );
    }
    // Hash password
    const result: DatabaseUser = await UserModel.create({
      ...user,
      password: bcryptjs.hashSync(user.password, 10),
    });

    if (!result) {
      throw Error('Failed to create user');
    }

    // Remove password field from returned object
    const safeUser: SafeDatabaseUser = {
      _id: result._id,
      username: result.username,
      firstName: result.firstName,
      lastName: result.lastName,
      dateJoined: result.dateJoined,
      biography: result.biography,
      badges: result.badges || [],
      hasSeenWelcomeMessage: result.hasSeenWelcomeMessage || false,
      points: result.points || 0,
      externalLinks: result.externalLinks || {},
    };

    return safeUser;
  } catch (error) {
    return { error: `Error occurred when saving user: ${error}` };
  }
};

/**
 * Retrieves a user from the database by their username.
 *
 * @param {string} username - The username of the user to find.
 * @returns {Promise<UserResponse>} - Resolves with the found user object (without the password) or an error message.
 */
export const getUserByUsername = async (username: string): Promise<UserResponse> => {
  try {
    const user: SafeDatabaseUser | null = await UserModel.findOne({ username }).select('-password');

    if (!user) {
      throw Error('User not found');
    }

    return user;
  } catch (error) {
    return { error: `Error occurred when finding user: ${error}` };
  }
};

/**
 * Retrieves all users from the database.
 * Users documents are returned in the order in which they were created, oldest to newest.
 *
 * @returns {Promise<UsersResponse>} - Resolves with the found user objects (without the passwords) or an error message.
 */
export const getUsersList = async (): Promise<UsersResponse> => {
  try {
    const users: SafeDatabaseUser[] = await UserModel.find().select('-password').lean();

    if (!users) {
      throw Error('Users could not be retrieved');
    }

    return users;
  } catch (error) {
    return { error: `Error occurred when finding users: ${error}` };
  }
};

/**
 * Authenticates a user by verifying their username and password.
 *
 * @param {loginCredentials} loginCredentials - An object containing the username and password.
 * @returns {Promise<UserResponse>} - Resolves with the authenticated user object (without the password) or an error message.
 */
export const loginUser = async (loginCredentials: UserLogin): Promise<UserResponse> => {
  const { username, password } = loginCredentials;

  try {
    const user: DatabaseUser | null = await UserModel.findOne({ username });
    if (!user) {
      throw Error('Invalid username or password');
    }

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      throw Error('Invalid username or password');
    }

    // Remove password field from returned object
    const safeUser: SafeDatabaseUser = {
      _id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      dateJoined: user.dateJoined,
      biography: user.biography,
      badges: user.badges || [],
      hasSeenWelcomeMessage: user.hasSeenWelcomeMessage || false,
      points: user.points || 0,
      externalLinks: user.externalLinks || {},
    };

    return safeUser;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    return { error: errorMessage };
  }
};

/**
 * Deletes a user from the database by their username.
 *
 * @param {string} username - The username of the user to delete.
 * @returns {Promise<UserResponse>} - Resolves with the deleted user object (without the password) or an error message.
 */
export const deleteUserByUsername = async (username: string): Promise<UserResponse> => {
  try {
    const deletedUser: SafeDatabaseUser | null = await UserModel.findOneAndDelete({
      username,
    }).select('-password');

    if (!deletedUser) {
      throw Error('Error deleting user');
    }

    return deletedUser;
  } catch (error) {
    return { error: `Error occurred when finding user: ${error}` };
  }
};

/**
 * Updates user information in the database.
 *
 * @param {string} username - The username of the user to update.
 * @param {Partial<User>} updates - An object containing the fields to update and their new values.
 * @returns {Promise<UserResponse>} - Resolves with the updated user object (without the password) or an error message.
 */
export const updateUser = async (
  username: string,
  updates: Partial<User>,
): Promise<UserResponse> => {
  try {
    const updatedUser: SafeDatabaseUser | null = await UserModel.findOneAndUpdate(
      { username },
      { $set: updates },
      { new: true },
    ).select('-password');

    if (!updatedUser) {
      throw Error('Error updating user');
    }

    return updatedUser;
  } catch (error) {
    return { error: `Error occurred when updating user: ${error}` };
  }
};

/**
 * Updates a user's online status and socket ID.
 *
 * @param {string} username - The username of the user.
 * @param {boolean} isOnline - Whether the user is online.
 * @param {string | null} socketId - The socket ID (null when offline).
 * @returns {Promise<UserResponse>} - Resolves with the updated user or an error message.
 */
export const updateUserOnlineStatus = async (
  username: string,
  isOnline: boolean,
  socketId: string | null = null,
): Promise<UserResponse> => {
  try {
    const updates: Partial<User> = {
      isOnline,
      socketId,
      ...(!isOnline && { lastSeen: new Date() }),
    };

    const updatedUser: SafeDatabaseUser | null = await UserModel.findOneAndUpdate(
      { username },
      { $set: updates },
      { new: true },
    ).select('-password');

    if (!updatedUser) {
      throw Error('Error updating this users online status');
    }

    return updatedUser;
  } catch (error) {
    return { error: `Error occurred when updating this users status: ${error}` };
  }
};

/**
 * Retrieves all online users from the database.
 *
 * @returns {Promise<UsersResponse>} - Resolves with the list of online users or an error message.
 */
export const getOnlineUsers = async (): Promise<UsersResponse> => {
  try {
    const users: SafeDatabaseUser[] = await UserModel.find({ isOnline: true }).select('-password');

    if (!users) {
      throw Error('Could not retrieve users online');
    }

    return users;
  } catch (error) {
    return { error: `Error occurred when finding online users: ${error}` };
  }
};

/**
 * Search and filter users with tags data
 * @returns - list of users with their work experiences and communities for tag display
 */
/**
 * Interface for enriched user with work experience and communities
 */
interface EnrichedUser extends SafeDatabaseUser {
  workExperiences: Array<{
    company: string;
    title: string;
    type: string;
  }>;
  communities: Array<{
    _id: unknown;
    name: string;
  }>;
}

/**
 * Search and filter users with tags data
 * Returns users with their work experiences and communities for tag display
 */
export const searchUsers = async (
  searchQuery: string,
  filters: {
    major?: string;
    graduationYear?: number;
    communityId?: string;
    careerGoals?: string;
    technicalInterests?: string;
  },
): Promise<EnrichedUser[] | { error: string }> => {
  try {
    const query: Record<string, unknown> = {};

    // Text search across name and username
    if (searchQuery.trim()) {
      query.$or = [
        { firstName: { $regex: searchQuery, $options: 'i' } },
        { lastName: { $regex: searchQuery, $options: 'i' } },
        { username: { $regex: searchQuery, $options: 'i' } },
      ];
    }

    // Filter by major
    if (filters.major) {
      query.major = filters.major;
    }

    // Filter by graduation year
    if (filters.graduationYear) {
      query.graduationYear = filters.graduationYear;
    }

    // Filter by career goals (comma-separated)
    if (filters.careerGoals) {
      const goals = filters.careerGoals
        .split(',')
        .map(g => g.trim())
        .filter(g => g);
      if (goals.length > 0) {
        query.careerGoals = {
          $regex: goals.map(g => g.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
          $options: 'i',
        };
      }
    }

    // Filter by technical interests (comma-separated)
    if (filters.technicalInterests) {
      const interests = filters.technicalInterests
        .split(',')
        .map(i => i.trim())
        .filter(i => i);
      if (interests.length > 0) {
        query.technicalInterests = {
          $regex: interests.map(i => i.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
          $options: 'i',
        };
      }
    }

    // Find users
    let users: SafeDatabaseUser[] = (await UserModel.find(query)
      .select('-password')
      .lean()) as SafeDatabaseUser[];

    // Filter by community if specified
    if (filters.communityId) {
      const community = await CommunityModel.findById(filters.communityId);
      if (community) {
        const communityUsernames = community.participants;
        users = users.filter(u => communityUsernames.includes(u.username));
      }
    }

    // Also search by company/position in work experiences
    if (searchQuery.trim()) {
      const workExpUsers = await WorkExperienceModel.find({
        $or: [
          { company: { $regex: searchQuery, $options: 'i' } },
          { title: { $regex: searchQuery, $options: 'i' } },
        ],
      })
        .select('username')
        .lean();

      const workExpUsernames = new Set(workExpUsers.map(w => w.username));

      // Get users from work experience matches
      const additionalUsers: SafeDatabaseUser[] = (await UserModel.find({
        username: { $in: Array.from(workExpUsernames) },
      })
        .select('-password')
        .lean()) as SafeDatabaseUser[];

      // Merge with existing users (avoid duplicates)
      const existingUsernames = new Set(users.map(u => u.username));
      additionalUsers.forEach(u => {
        if (!existingUsernames.has(u.username)) {
          users.push(u);
        }
      });
    }

    // Enrich with work experiences and communities
    const enrichedUsers: EnrichedUser[] = await Promise.all(
      users.map(async (user: SafeDatabaseUser): Promise<EnrichedUser> => {
        const workExperiences = await WorkExperienceModel.find({ username: user.username })
          .select('company title type')
          .lean();

        const communities = await CommunityModel.find({ participants: user.username })
          .select('_id name')
          .lean();

        return {
          ...user,
          workExperiences: workExperiences.map(w => ({
            company: w.company,
            title: w.title,
            type: w.type,
          })),
          communities: communities.map(c => ({
            _id: c._id,
            name: c.name,
          })),
        };
      }),
    );

    return enrichedUsers;
  } catch (error) {
    return { error: `Failed to search users: ${error}` };
  }
};

/**
 * Get unique majors for filter dropdown
 */
export const getUniqueMajors = async (): Promise<string[]> => {
  try {
    const majors = await UserModel.distinct('major');
    return (majors as string[]).filter(m => m && m.trim() !== '').sort();
  } catch (error) {
    return [];
  }
};

/**
 * Get unique graduation years for filter dropdown
 */
export const getUniqueGraduationYears = async (): Promise<number[]> => {
  try {
    const years = await UserModel.distinct('graduationYear');
    return (years as number[]).filter(y => y !== null && y !== 0).sort((a, b) => a - b);
  } catch (error) {
    return [];
  }
};

/**
 * Gets the global leaderboard sorted by points
 * @param limit - Number of top users to return
 * @returns List of top users sorted by points
 */
export const getLeaderboard = async (limit: number = 20): Promise<UsersResponse> => {
  try {
    const topUsers: SafeDatabaseUser[] = await UserModel.find()
      .select('-password')
      .sort({ points: -1 })
      .limit(limit);
    if (!topUsers) {
      throw Error('Could not retrieve leaderboard');
    }
    return topUsers;
  } catch (error) {
    return { error: `Error occurred when fetching leaderboard: ${error}` };
  }
};
