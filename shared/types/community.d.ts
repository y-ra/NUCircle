import { ObjectId } from 'mongodb';
import { Request } from 'express';

/**
 * Represents a single user's visit data for a community
 */
export interface UserVisitData {
  username: string;
  lastVisitDate: Date;
  currentStreak: number;
  longestStreak: number;
}

/**
 * Represents a Community (unpopulated).
 * - `participants`: Array of usernames representing the chat participants.
 * - `name`: name of the community.
 * - `description`: description of the community.
 * - `visibility`: whether community is PUBLIC or PRIVATE
 * - `participants`: list of community participants
 * - `questions`: array of questions data associated with the community.
 */
export interface Community {
  name: string;
  description: string;
  visibility: string;
  participants: string[];
  admin: string;
  visitStreaks?: UserVisitData[];
}

/**
 * Represents a Database community without poplated fields
 * _id - Object Id of the community document
 * createdAt - created at date timestamp
 * updatedAt - updated at date timestamp
 */
export interface DatabaseCommunity extends Community {
  _id: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Type definition for a community request that contains communityId in params
 */
export interface CommunityIdRequest extends Request {
  params: {
    communityId: string;
  };
}

/**
 * Type definition for create community request
 */
export interface CreateCommunityRequest extends Request {
  body: {
    name: string;
    description: string;
    admin: string;
    visibility?: string;
    participants?: string[];
  };
}

/**
 * Type definition for join/leave community request
 */
export interface ToggleMembershipRequest extends Request {
  body: {
    communityId: string;
    username: string;
  };
}

/**
 * Type definition for delete community request
 */
export interface DeleteCommunityRequest extends CommunityIdRequest {
  body: {
    username: string;
  };
}

/**
 * Type for community operation responses
 * Either returns a DatabaseCommunity (successful operation) or an error message
 */
export type CommunityResponse = DatabaseCommunity | { error: string };

/**
 * result for toggling community membership
 * - `community`: The updated community document
 * - `added`: Boolean indicating if the user was added (true) or removed (false)
 */
export interface ToggleMembershipResult {
  community: DatabaseCommunity;
  added: boolean; // true if user was added, false if removed
}

/**
 * Response type for toggling community membership
 * Either returns a ToggleMembershipResponse (successful operation) or an error message
 */
export type ToggleMembershipResponse = ToggleMembershipResult | { error: string };
