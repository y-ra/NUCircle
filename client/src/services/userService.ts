import axios from 'axios';
import { AuthResponse, SafeDatabaseUser, UserLogin, UserSignup } from '../types/types';
import api from './config';

const USER_API_URL = `/api/user`;

/**
 * Interface for user statistics
 */
export interface UserStats {
  questionsPosted: number;
  answersPosted: number;
  communitiesJoined: number;
  quizzesWon: number;
  quizzesPlayed: number;
}

/**
 * Interface for work experience tag data
 */
export interface WorkExperienceTag {
  company: string;
  title: string;
  type: string;
}

/**
 * Interface for community tag data
 */
export interface CommunityTag {
  _id: string;
  name: string;
}

/**
 * Interface for enriched user with work experiences and communities
 */
export interface EnrichedUser extends SafeDatabaseUser {
  workExperiences: WorkExperienceTag[];
  communities: CommunityTag[];
  major?: string;
  graduationYear?: number;
}

/**
 * Interface for search filters
 */
export interface UserSearchFilters {
  major?: string;
  graduationYear?: number;
  communityId?: string;
  careerGoals?: string;
  technicalInterests?: string;
}

/**
 * Function to get users
 *
 * @throws Error if there is an issue fetching users.
 */
const getUsers = async (): Promise<SafeDatabaseUser[]> => {
  const res = await api.get(`${USER_API_URL}/getUsers`);
  if (res.status !== 200) {
    throw new Error('Error when fetching users');
  }
  return res.data;
};

/**
 * Function to get users
 *
 * @throws Error if there is an issue fetching users.
 */
const getUserByUsername = async (username: string): Promise<SafeDatabaseUser> => {
  try {
    const res = await api.get(`${USER_API_URL}/getUser/${username}`);
    if (res.status !== 200) {
      throw new Error('Error when fetching user');
    }
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      // If the backend returns a string error message, extract it
      const errorMessage =
        typeof error.response.data === 'string'
          ? error.response.data
          : error.response.data?.error || 'Error when fetching user';
      throw new Error(errorMessage);
    }
    throw error;
  }
};

/**
 * Sends a POST request to create a new user account.
 *
 * @param user - The user credentials (username and password) for signup.
 * @returns {Promise<AuthResponse>} The newly created user object and authentication token.
 * @throws {Error} If an error occurs during the signup process.
 */
const createUser = async (user: UserSignup): Promise<AuthResponse> => {
  try {
    const res = await api.post(`${USER_API_URL}/signup`, user);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Error while signing up: ${error.response.data}`);
    } else {
      throw new Error('Error while signing up');
    }
  }
};

/**
 * Sends a POST request to authenticate a user.
 *
 * @param user - The user credentials (username and password) for login.
 * @returns {Promise<User>} The authenticated user object.
 * @throws {Error} If an error occurs during the login process.
 */
const loginUser = async (user: UserLogin): Promise<AuthResponse> => {
  try {
    const res = await api.post(`${USER_API_URL}/login`, user);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const errorMessage = error.response.data?.error || error.response.data || 'Login failed';
      throw new Error(errorMessage);
    } else {
      throw new Error('Error while logging in');
    }
  }
};

/**
 * Deletes a user by their username.
 * @param username - The unique username of the user
 * @returns A promise that resolves to the deleted user data
 * @throws {Error} If the request to the server is unsuccessful
 */
const deleteUser = async (username: string): Promise<SafeDatabaseUser> => {
  const res = await api.delete(`${USER_API_URL}/deleteUser/${username}`);
  if (res.status !== 200) {
    throw new Error('Error when deleting user');
  }
  return res.data;
};

/**
 * Resets the password for a user.
 * @param username - The unique username of the user
 * @param newPassword - The new password to be set for the user
 * @returns A promise that resolves to the updated user data
 * @throws {Error} If the request to the server is unsuccessful
 */
const resetPassword = async (username: string, newPassword: string): Promise<SafeDatabaseUser> => {
  const res = await api.patch(`${USER_API_URL}/resetPassword`, {
    username,
    password: newPassword,
  });
  if (res.status !== 200) {
    throw new Error('Error when resetting password');
  }
  return res.data;
};

/**
 * Updates the user's biography.
 * @param username The unique username of the user
 * @param newBiography The new biography to set for this user
 * @returns A promise resolving to the updated user
 * @throws Error if the request fails
 */
const updateBiography = async (
  username: string,
  newBiography: string,
): Promise<SafeDatabaseUser> => {
  const res = await api.patch(`${USER_API_URL}/updateBiography`, {
    username,
    biography: newBiography,
  });
  if (res.status !== 200) {
    throw new Error('Error when updating biography');
  }
  return res.data;
};

/**
 * Marks the welcome message as seen for the current user if they have had it pop up.
 * @returns A promise resolving to the updated user
 * @throws Error if the request fails
 */
const markWelcomeMessageSeen = async (): Promise<SafeDatabaseUser> => {
  try {
    const res = await api.patch(`${USER_API_URL}/markWelcomeSeen`);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Error while marking welcome message as seen: ${error.response.data}`);
    } else {
      throw new Error('Error while marking welcome message as seen');
    }
  }
};

/**
 * Fetches statistics for a user
 * @param username - The username to get stats for
 * @returns Promise resolving to user statistics
 * @throws Error if the request fails
 */
const getUserStats = async (username: string): Promise<UserStats> => {
  const res = await api.get(`${USER_API_URL}/stats/${username}`);
  if (res.status !== 200) {
    throw new Error('Error when fetching user stats');
  }
  return res.data;
};

/**
 * Searches and filters users by various criteria
 * @param searchQuery -  The type being searched (searches name, username, company, position, community)
 * @param filters - Optional filters
 * @returns A promise resolving to an array of users with work experiences and communities
 * @throws Error if the request to the server is unsuccessful
 */
const searchUsers = async (
  searchQuery: string,
  filters?: UserSearchFilters,
): Promise<EnrichedUser[]> => {
  try {
    const params = new URLSearchParams();

    if (searchQuery) params.append('q', searchQuery);
    if (filters?.major) params.append('major', filters.major);
    if (filters?.graduationYear) params.append('graduationYear', filters.graduationYear.toString());
    if (filters?.communityId) params.append('communityId', filters.communityId);
    if (filters?.careerGoals) params.append('careerGoals', filters.careerGoals);
    if (filters?.technicalInterests)
      params.append('technicalInterests', filters.technicalInterests);

    const res = await api.get(`${USER_API_URL}/search?${params.toString()}`);

    if (res.status !== 200) {
      throw new Error('Failed to search users');
    }

    return res.data;
  } catch (error) {
    return [];
  }
};

/**
 * Retrieves available filter options for the user search
 * @returns - A promise resolving to an object containing arrays of majors and graduation years
 * @throws Error if the request to the server is unsuccessful
 */
const getFilterOptions = async (): Promise<{
  majors: string[];
  graduationYears: number[];
}> => {
  try {
    const res = await api.get(`${USER_API_URL}/filter-options`);

    if (res.status !== 200) {
      throw new Error('Failed to get filter options');
    }

    return res.data;
  } catch (error) {
    return { majors: [], graduationYears: [] };
  }
};

const updateUserProfile = async (
  username: string,
  updates: {
    major?: string;
    graduationYear?: number;
    coopInterests?: string;
    firstName?: string;
    lastName?: string;
    careerGoals?: string;
    technicalInterests?: string;
  },
): Promise<SafeDatabaseUser> => {
  const res = await api.patch(`${USER_API_URL}/updateProfile`, {
    username,
    ...updates,
  });
  if (res.status !== 200) {
    throw new Error('Error when updating profile');
  }
  return res.data;
};

/**
 * Updates external links for a user (LinkedIn, GitHub, Portfolio)
 * @param username The username of the user
 * @param externalLinks Object containing linkedin, github, and portfolio URLs
 * @returns The updated user
 */
const updateExternalLinks = async (
  username: string,
  externalLinks: { linkedin?: string; github?: string; portfolio?: string },
): Promise<SafeDatabaseUser> => {
  const res = await api.patch(`${USER_API_URL}/updateExternalLinks`, {
    username,
    externalLinks,
  });
  if (res.status !== 200) {
    throw new Error('Error when updating external links');
  }
  return res.data;
};
/**
 * Updates visibility settings for user stats
 * @param username The username of the user
 * @param field The field to update
 * @param value The new visibility value
 * @returns The updated user
 */
const updateUserStatVisibility = async (
  username: string,
  field: string,
  value: boolean,
): Promise<SafeDatabaseUser> => {
  const res = await api.patch(`${USER_API_URL}/updateStatVisibility`, {
    username,
    field,
    value,
  });
  if (res.status !== 200) {
    throw new Error('Error when updating stat visibility');
  }
  return res.data;
};

/**
 * Fetches the global leaderboard sorted by points
 * @param limit - Number of top users to return
 */
const getLeaderboard = async (limit: number = 20): Promise<SafeDatabaseUser[]> => {
  const res = await api.get(`${USER_API_URL}/leaderboard?limit=${limit}`);
  if (res.status !== 200) {
    throw new Error('Error fetching leaderboard');
  }
  return res.data;
};

export {
  getUsers,
  getUserByUsername,
  loginUser,
  createUser,
  deleteUser,
  resetPassword,
  updateBiography,
  markWelcomeMessageSeen,
  getUserStats,
  searchUsers,
  getFilterOptions,
  updateUserProfile,
  updateUserStatVisibility,
  updateExternalLinks,
  getLeaderboard,
};
