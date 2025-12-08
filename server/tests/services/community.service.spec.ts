import mongoose from 'mongoose';
import CommunityModel from '../../models/community.model';
import {
  getCommunity,
  getAllCommunities,
  toggleCommunityMembership,
  createCommunity,
  deleteCommunity,
  getCommunitiesByUser,
  recordCommunityVisit,
} from '../../services/community.service';
import { Community, DatabaseCommunity } from '../../types/types';

import * as badgeService from '../../services/badge.service';
import * as pointService from '../../services/point.service';

jest.mock('../../services/badge.service', () => ({
  countUserQuestions: jest.fn(),
  checkAndAwardMilestoneBadge: jest.fn(),
  checkAndAwardCommunityBadge: jest.fn(),
}));

jest.mock('../../services/point.service', () => ({
  awardPointsToUser: jest.fn(),
}));

describe('Community Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Mock community data with admin as participant
  const mockCommunity: DatabaseCommunity = {
    _id: new mongoose.Types.ObjectId('65e9b58910afe6e94fc6e6dc'),
    name: 'Test Community',
    description: 'Test Description',
    admin: 'admin_user',
    participants: ['admin_user', 'user1', 'user2'],
    visibility: 'PUBLIC',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
  };

  const mockCommunityInput: Community = {
    name: 'New Community',
    description: 'New Description',
    admin: 'new_admin',
    participants: ['user1'],
    visibility: 'PRIVATE',
  };

  const mockCommunities: DatabaseCommunity[] = [
    mockCommunity,
    {
      _id: new mongoose.Types.ObjectId('65e9b58910afe6e94fc6e6dd'),
      name: 'Test Community 2',
      description: 'Description 2',
      admin: 'admin_user2',
      participants: ['admin_user2', 'user1'],
      visibility: 'PRIVATE',
      createdAt: new Date('2024-03-02'),
      updatedAt: new Date('2024-03-02'),
    },
  ];

  describe('getCommunitiesByUser', () => {
    test('should return all communities the user is part of', async () => {
      jest.spyOn(CommunityModel, 'find').mockResolvedValueOnce(mockCommunities);
      const result = await getCommunitiesByUser('user1');
      expect(result).toEqual(mockCommunities);
      expect(CommunityModel.find).toHaveBeenCalledWith({ participants: 'user1' });
    });

    test('should return error when database throws error', async () => {
      jest.spyOn(CommunityModel, 'find').mockRejectedValueOnce(new Error('Database error'));
      const result = await getCommunitiesByUser('user1');
      expect(result).toEqual({ error: 'Database error' });
    });
  });

  describe('getCommunity', () => {
    test('should return the community when found', async () => {
      jest.spyOn(CommunityModel, 'findById').mockResolvedValueOnce(mockCommunity);

      const result = await getCommunity('65e9b58910afe6e94fc6e6dc');

      expect(result).toEqual(mockCommunity);
      expect(CommunityModel.findById).toHaveBeenCalledWith('65e9b58910afe6e94fc6e6dc');
    });

    test('should return error when community not found', async () => {
      jest.spyOn(CommunityModel, 'findById').mockResolvedValueOnce(null);

      const result = await getCommunity('65e9b58910afe6e94fc6e6dc');

      expect(result).toEqual({ error: 'Community not found' });
    });

    test('should return error when database throws error', async () => {
      jest.spyOn(CommunityModel, 'findById').mockRejectedValueOnce(new Error('Database error'));

      const result = await getCommunity('65e9b58910afe6e94fc6e6dc');

      expect(result).toEqual({ error: 'Database error' });
    });
  });

  describe('getAllCommunities', () => {
    test('should return all communities', async () => {
      const mockCommunities = [mockCommunity, { ...mockCommunity, name: 'Community 2' }];
      jest.spyOn(CommunityModel, 'find').mockResolvedValueOnce(mockCommunities);

      const result = await getAllCommunities();

      expect(result).toEqual(mockCommunities);
      expect(CommunityModel.find).toHaveBeenCalledWith({});
    });

    test('should return empty array when no communities found', async () => {
      jest.spyOn(CommunityModel, 'find').mockResolvedValueOnce([]);

      const result = await getAllCommunities();

      expect(result).toEqual([]);
    });

    test('should return error when database throws error', async () => {
      jest.spyOn(CommunityModel, 'find').mockRejectedValueOnce(new Error('Database error'));

      const result = await getAllCommunities();

      expect(result).toEqual({ error: 'Database error' });
    });
  });

  describe('toggleCommunityMembership', () => {
    test('should add user to community when not a participant', async () => {
      // user3 is not in the participants array
      const communityWithoutUser = {
        ...mockCommunity,
        participants: ['admin_user', 'user1'],
      };
      const updatedCommunity = {
        ...mockCommunity,
        participants: ['admin_user', 'user1', 'user3'],
      };

      jest.spyOn(CommunityModel, 'findById').mockResolvedValueOnce(communityWithoutUser);
      jest.spyOn(CommunityModel, 'findByIdAndUpdate').mockResolvedValueOnce(updatedCommunity);
      (badgeService.checkAndAwardCommunityBadge as jest.Mock).mockResolvedValue(true);
      (pointService.awardPointsToUser as jest.Mock).mockResolvedValue(5);

      const result = await toggleCommunityMembership('65e9b58910afe6e94fc6e6dc', 'user3');

      expect(result).toEqual({
        community: updatedCommunity,
        added: true,
      });
      expect(pointService.awardPointsToUser).toHaveBeenCalledWith('user3', 5);
      expect(badgeService.checkAndAwardCommunityBadge).toHaveBeenCalledWith(
        'user3',
        '65e9b58910afe6e94fc6e6dc',
      );
    });

    test('should remove user from community when already a participant', async () => {
      // user2 will be removed from participants
      const updatedCommunity = {
        ...mockCommunity,
        participants: ['admin_user', 'user1'],
      };

      jest.spyOn(CommunityModel, 'findById').mockResolvedValueOnce(mockCommunity);
      jest.spyOn(CommunityModel, 'findByIdAndUpdate').mockResolvedValueOnce(updatedCommunity);

      const result = await toggleCommunityMembership('65e9b58910afe6e94fc6e6dc', 'user2');

      expect(result).toEqual({
        community: updatedCommunity,
        added: false,
      });
      expect(CommunityModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '65e9b58910afe6e94fc6e6dc',
        { $pull: { participants: 'user2' } },
        { new: true },
      );
    });

    test('should return error when admin tries to leave their community', async () => {
      // admin_user trying to leave their own community
      jest.spyOn(CommunityModel, 'findById').mockResolvedValueOnce(mockCommunity);

      const result = await toggleCommunityMembership('65e9b58910afe6e94fc6e6dc', 'admin_user');

      expect(result).toEqual({
        error:
          'Community admins cannot leave their communities. Please transfer ownership or delete the community instead.',
      });
      expect(CommunityModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    test('should return error when community not found', async () => {
      jest.spyOn(CommunityModel, 'findById').mockResolvedValueOnce(null);

      const result = await toggleCommunityMembership('65e9b58910afe6e94fc6e6dc', 'user2');

      expect(result).toEqual({ error: 'Community not found' });
    });

    test('should return error when update fails', async () => {
      jest.spyOn(CommunityModel, 'findById').mockResolvedValueOnce(mockCommunity);
      jest.spyOn(CommunityModel, 'findByIdAndUpdate').mockResolvedValueOnce(null);

      const result = await toggleCommunityMembership('65e9b58910afe6e94fc6e6dc', 'user2');

      expect(result).toEqual({ error: 'Failed to update community' });
    });

    test('should return error when database throws error', async () => {
      jest.spyOn(CommunityModel, 'findById').mockRejectedValueOnce(new Error('Database error'));

      const result = await toggleCommunityMembership('65e9b58910afe6e94fc6e6dc', 'user2');

      expect(result).toEqual({ error: 'Database error' });
    });
  });

  describe('createCommunity', () => {
    test('should create a new community with admin in participants', async () => {
      const savedCommunity = {
        ...mockCommunityInput,
        _id: new mongoose.Types.ObjectId(),
        participants: ['user1', 'new_admin'],
      };

      const saveMock = jest.fn().mockResolvedValueOnce(savedCommunity);
      jest.spyOn(CommunityModel.prototype, 'save').mockImplementation(saveMock);

      const result = await createCommunity(mockCommunityInput);

      expect(result).toEqual(savedCommunity);
      expect(saveMock).toHaveBeenCalled();
    });

    test('should not duplicate admin in participants if already included', async () => {
      // Admin already exists in participants array
      const inputWithAdminInParticipants = {
        ...mockCommunityInput,
        participants: ['new_admin', 'user1'],
      };
      const savedCommunity = {
        ...inputWithAdminInParticipants,
        _id: new mongoose.Types.ObjectId(),
      };

      const saveMock = jest.fn().mockResolvedValueOnce(savedCommunity);
      jest.spyOn(CommunityModel.prototype, 'save').mockImplementation(saveMock);

      const result = await createCommunity(inputWithAdminInParticipants);

      expect(result).toEqual(savedCommunity);
      expect(saveMock).toHaveBeenCalled();
    });

    test('should set default visibility to PUBLIC if not provided', async () => {
      const inputWithoutVisibility = {
        ...mockCommunityInput,
        visibility: undefined as unknown as string,
      };

      const savedCommunity = {
        ...inputWithoutVisibility,
        _id: new mongoose.Types.ObjectId(),
        visibility: 'PUBLIC',
        participants: ['user1', 'new_admin'],
      };

      const saveMock = jest.fn().mockResolvedValueOnce(savedCommunity);
      jest.spyOn(CommunityModel.prototype, 'save').mockImplementation(saveMock);

      const result = await createCommunity(inputWithoutVisibility);

      expect(result).toEqual(savedCommunity);
    });

    test('should return error when save fails', async () => {
      const saveMock = jest.fn().mockRejectedValueOnce(new Error('Save failed'));
      jest.spyOn(CommunityModel.prototype, 'save').mockImplementation(saveMock);

      const result = await createCommunity(mockCommunityInput);

      expect(result).toEqual({ error: 'Save failed' });
    });
  });

  describe('deleteCommunity', () => {
    test('should delete community when user is admin', async () => {
      // Verify admin status before deletion
      jest.spyOn(CommunityModel, 'findById').mockResolvedValueOnce(mockCommunity);
      jest.spyOn(CommunityModel, 'findByIdAndDelete').mockResolvedValueOnce(mockCommunity);

      const result = await deleteCommunity('65e9b58910afe6e94fc6e6dc', 'admin_user');

      expect(result).toEqual(mockCommunity);
      expect(CommunityModel.findByIdAndDelete).toHaveBeenCalledWith('65e9b58910afe6e94fc6e6dc');
    });

    test('should return error when user is not admin', async () => {
      jest.spyOn(CommunityModel, 'findById').mockResolvedValueOnce(mockCommunity);

      const result = await deleteCommunity('65e9b58910afe6e94fc6e6dc', 'user1');

      expect(result).toEqual({
        error: 'Unauthorized: Only the community admin can delete this community',
      });
      expect(CommunityModel.findByIdAndDelete).not.toHaveBeenCalled();
    });

    test('should return error when community not found during check', async () => {
      jest.spyOn(CommunityModel, 'findById').mockResolvedValueOnce(null);

      const result = await deleteCommunity('65e9b58910afe6e94fc6e6dc', 'admin_user');

      expect(result).toEqual({ error: 'Community not found' });
    });

    test('should return error when deletion fails', async () => {
      jest.spyOn(CommunityModel, 'findById').mockResolvedValueOnce(mockCommunity);
      jest.spyOn(CommunityModel, 'findByIdAndDelete').mockResolvedValueOnce(null);

      const result = await deleteCommunity('65e9b58910afe6e94fc6e6dc', 'admin_user');

      expect(result).toEqual({ error: 'Community not found or already deleted' });
    });

    test('should return error when database throws error', async () => {
      jest.spyOn(CommunityModel, 'findById').mockRejectedValueOnce(new Error('Database error'));

      const result = await deleteCommunity('65e9b58910afe6e94fc6e6dc', 'admin_user');

      expect(result).toEqual({ error: 'Database error' });
    });
  });

  describe('recordCommunityVisit', () => {
    const communityId = '65e9b58910afe6e94fc6e6dc';
    const username = 'testuser';

    test('should initialize visit streak for first-time visitor', async () => {
      const mockCommunityData = {
        ...mockCommunity,
        visitStreaks: [],
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(CommunityModel, 'findById').mockResolvedValueOnce(mockCommunityData as any);

      await recordCommunityVisit(communityId, username);

      expect(mockCommunityData.visitStreaks).toHaveLength(1);
      expect(mockCommunityData.visitStreaks[0]).toMatchObject({
        username,
        currentStreak: 1,
        longestStreak: 1,
      });
      expect(mockCommunityData.save).toHaveBeenCalled();
    });

    test('should increment streak for consecutive day visit', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const mockCommunityData = {
        ...mockCommunity,
        visitStreaks: [
          {
            username,
            lastVisitDate: yesterday,
            currentStreak: 2,
            longestStreak: 3,
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(CommunityModel, 'findById').mockResolvedValueOnce(mockCommunityData as any);

      await recordCommunityVisit(communityId, username);

      expect(mockCommunityData.visitStreaks[0].currentStreak).toBe(3);
      expect(mockCommunityData.save).toHaveBeenCalled();
    });

    test('should update longest streak when current streak exceeds it', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const mockCommunityData = {
        ...mockCommunity,
        visitStreaks: [
          {
            username,
            lastVisitDate: yesterday,
            currentStreak: 5,
            longestStreak: 5,
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(CommunityModel, 'findById').mockResolvedValueOnce(mockCommunityData as any);

      await recordCommunityVisit(communityId, username);

      expect(mockCommunityData.visitStreaks[0].currentStreak).toBe(6);
      expect(mockCommunityData.visitStreaks[0].longestStreak).toBe(6);
    });

    test('should reset streak when visit is not consecutive', async () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      threeDaysAgo.setHours(0, 0, 0, 0);

      const mockCommunityData = {
        ...mockCommunity,
        visitStreaks: [
          {
            username,
            lastVisitDate: threeDaysAgo,
            currentStreak: 5,
            longestStreak: 10,
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(CommunityModel, 'findById').mockResolvedValueOnce(mockCommunityData as any);

      await recordCommunityVisit(communityId, username);

      expect(mockCommunityData.visitStreaks[0].currentStreak).toBe(1);
      expect(mockCommunityData.visitStreaks[0].longestStreak).toBe(10);
    });

    test('should not update for same day visit', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const mockCommunityData = {
        ...mockCommunity,
        visitStreaks: [
          {
            username,
            lastVisitDate: today,
            currentStreak: 3,
            longestStreak: 5,
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(CommunityModel, 'findById').mockResolvedValueOnce(mockCommunityData as any);

      await recordCommunityVisit(communityId, username);

      expect(mockCommunityData.visitStreaks[0].currentStreak).toBe(3);
      expect(mockCommunityData.save).not.toHaveBeenCalled();
    });

    test('should return early when community not found', async () => {
      jest.spyOn(CommunityModel, 'findById').mockResolvedValueOnce(null);

      await recordCommunityVisit(communityId, username);

      expect(CommunityModel.findById).toHaveBeenCalledWith(communityId);
    });

    test('should initialize visitStreaks array if undefined', async () => {
      const mockCommunityData = {
        ...mockCommunity,
        visitStreaks: undefined,
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(CommunityModel, 'findById').mockResolvedValueOnce(mockCommunityData as any);

      await recordCommunityVisit(communityId, username);

      expect(mockCommunityData.visitStreaks).toBeDefined();
      expect(mockCommunityData.visitStreaks).toHaveLength(1);
    });
  });
});
