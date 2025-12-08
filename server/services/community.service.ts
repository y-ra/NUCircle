import CommunityModel from '../models/community.model';
import {
  Community,
  CommunityResponse,
  DatabaseCommunity,
  ToggleMembershipResponse,
} from '../types/types';
import { checkAndAwardCommunityBadge } from './badge.service';
import { awardPointsToUser } from './point.service';

/**
 * Retrieves all communities that a user is a part of
 * @param username username of the user
 * @returns A Promise resolving to an array of community documents or an error object
 */
export const getCommunitiesByUser = async (
  username: string,
): Promise<DatabaseCommunity[] | { error: string }> => {
  try {
    const communities = await CommunityModel.find({ participants: username });
    return communities;
  } catch (err) {
    return { error: (err as Error).message };
  }
};

/**
 * Retrieves a community by its ID.
 *
 * @param communityId - The ID of the community to retrieve
 * @returns A Promise resolving to the community document or an error object
 */
export const getCommunity = async (communityId: string): Promise<CommunityResponse> => {
  try {
    const community = await CommunityModel.findById(communityId);
    if (!community) {
      return { error: 'Community not found' };
    }
    return community;
  } catch (err) {
    return { error: (err as Error).message };
  }
};

/**
 * Retrieves all communities from the database.
 *
 * @returns A Promise resolving to an array of community documents or an error object
 */
export const getAllCommunities = async (): Promise<DatabaseCommunity[] | { error: string }> => {
  try {
    const communities = await CommunityModel.find({});
    return communities;
  } catch (err) {
    return { error: (err as Error).message };
  }
};

/**
 * Toggles a user's membership status in a community.
 * If the user is already a participant, they will be removed.
 * If the user is not a participant, they will be added.
 *
 * @param communityId - The ID of the community to update
 * @param username - The username of the user whose membership to toggle
 * @returns A Promise resolving to the updated community document or an error object
 */
export const toggleCommunityMembership = async (
  communityId: string,
  username: string,
): Promise<ToggleMembershipResponse> => {
  try {
    const community = await CommunityModel.findById(communityId);
    if (!community) {
      return { error: 'Community not found' };
    }

    // Check if user is the admin and trying to leave
    if (community.admin === username && community.participants.includes(username)) {
      return {
        error:
          'Community admins cannot leave their communities. Please transfer ownership or delete the community instead.',
      };
    }

    // Check if user is already a participant
    const isParticipant = community.participants.includes(username);

    let updatedCommunity: DatabaseCommunity | null;
    let added: boolean;

    if (isParticipant) {
      // User is already a participant, so remove them
      updatedCommunity = await CommunityModel.findByIdAndUpdate(
        communityId,
        { $pull: { participants: username } },
        { new: true },
      );
      added = false;
    } else {
      // User is not a participant, so add them
      updatedCommunity = await CommunityModel.findByIdAndUpdate(
        communityId,
        { $addToSet: { participants: username } },
        { new: true },
      );
      added = true;

      // Award community badge, points when user joins
      if (updatedCommunity) {
        awardPointsToUser(username, 5);
        await checkAndAwardCommunityBadge(username, communityId);
      }
    }

    if (!updatedCommunity) {
      return { error: 'Failed to update community' };
    }

    return { community: updatedCommunity, added };
  } catch (err) {
    return { error: (err as Error).message };
  }
};

/**
 * Creates a new community with the provided data.
 * The admin user is automatically added to the participants list if not already included.
 *
 * @param communityData - Object containing community details including name, description, visibility, admin, and participants
 * @returns A Promise resolving to the newly created community document or an error object
 */
export const createCommunity = async (communityData: Community): Promise<CommunityResponse> => {
  try {
    // Ensure admin is included in the participants list
    const newCommunity = new CommunityModel({
      ...communityData,
      admin: communityData.admin,
      participants: communityData.participants.includes(communityData.admin)
        ? communityData.participants
        : [...communityData.participants, communityData.admin],
      visibility: communityData.visibility || 'PUBLIC',
    });

    const savedCommunity = await newCommunity.save();
    return savedCommunity;
  } catch (err) {
    return { error: (err as Error).message };
  }
};

/**
 * Deletes a community by its ID if the requesting user is the admin.
 *
 * @param communityId - The ID of the community to delete
 * @param username - The username of the user requesting deletion
 * @returns A Promise resolving to a success object or an error object
 */
export const deleteCommunity = async (
  communityId: string,
  username: string,
): Promise<CommunityResponse> => {
  try {
    // First get the community to check admin status
    const community = await CommunityModel.findById(communityId);

    if (!community) {
      return { error: 'Community not found' };
    }

    // Check if the user is the admin
    if (community.admin !== username) {
      return { error: 'Unauthorized: Only the community admin can delete this community' };
    }

    // If user is admin, proceed with deletion
    const result = await CommunityModel.findByIdAndDelete(communityId);

    if (!result) {
      return { error: 'Community not found or already deleted' };
    }

    return result;
  } catch (err) {
    return { error: (err as Error).message };
  }
};

export const recordCommunityVisit = async (
  communityId: string,
  username: string,
): Promise<void> => {
  const community = await CommunityModel.findById(communityId);
  if (!community) return;

  // Initialize visitStreaks if it doesn't exist
  if (!community.visitStreaks) {
    community.visitStreaks = [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Disregard time

  // Find user's existing visit data
  const userVisit = community.visitStreaks.find(v => v.username === username);

  if (!userVisit) {
    // First visit - initialize
    community.visitStreaks.push({
      username,
      lastVisitDate: today,
      currentStreak: 1,
      longestStreak: 1,
    });
  } else {
    // Not the first visit - update streaks
    const lastVisit = new Date(userVisit.lastVisitDate);
    lastVisit.setHours(0, 0, 0, 0);

    // Only count by days, not hours
    const daysDifference = Math.floor(
      (today.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysDifference === 0) {
      return; // Same day, no update needed
    } else if (daysDifference === 1) {
      // Consecutive day - increment streak
      userVisit.currentStreak += 1;
      userVisit.longestStreak = Math.max(userVisit.longestStreak, userVisit.currentStreak);
      userVisit.lastVisitDate = today;
    } else {
      // Streak broken - reset
      userVisit.currentStreak = 1;
      userVisit.lastVisitDate = today;
    }
  }

  await community.save();
};
