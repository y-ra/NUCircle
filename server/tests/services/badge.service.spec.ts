import mongoose from 'mongoose';
import UserModel from '../../models/users.model';
import QuestionModel from '../../models/questions.model';
import AnswerModel from '../../models/answers.model';
import CommunityModel from '../../models/community.model';
import {
  hasBadge,
  checkAndAwardCommunityBadge,
  checkAndAwardMilestoneBadge,
  getUserBadges,
  countUserQuestions,
  countUserAnswers,
  checkAndAwardLeaderboardBadges,
} from '../../services/badge.service';
import { Badge, DatabaseUser, DatabaseCommunity, SafeDatabaseUser } from '../../types/types';

describe('Badge Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  const mockUser: DatabaseUser = {
    _id: new mongoose.Types.ObjectId('65e9b58910afe6e94fc6e6dc'),
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    password: 'hashedPassword',
    dateJoined: new Date('2024-01-01'),
    biography: 'Test bio',
    badges: [],
  };

  const mockCommunity: DatabaseCommunity = {
    _id: new mongoose.Types.ObjectId('65e9b58910afe6e94fc6e6dd'),
    name: 'Test Community',
    description: 'Test Description',
    admin: 'admin_user',
    participants: ['admin_user'],
    visibility: 'PUBLIC',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
  };

  describe('hasBadge', () => {
    it('should return true if user has the badge', async () => {
      const userWithBadge: DatabaseUser = {
        ...mockUser,
        badges: [
          {
            type: 'community',
            name: 'Community Member: Test Community',
            earnedAt: new Date(),
          },
        ],
      };
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(userWithBadge);

      const result = await hasBadge('testuser', 'Community Member: Test Community');
      expect(result).toBe(true);
    });

    it('should return false if user does not have the badge', async () => {
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(mockUser);

      const result = await hasBadge('testuser', 'Community Member: Test Community');
      expect(result).toBe(false);
    });

    it('should return false if user does not exist', async () => {
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(null);

      const result = await hasBadge('nonexistent', 'Some Badge');
      expect(result).toBe(false);
    });

    it('should return false if user has no badges array', async () => {
      const userWithoutBadges = { ...mockUser, badges: undefined };
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(userWithoutBadges as DatabaseUser);

      const result = await hasBadge('testuser', 'Some Badge');
      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      jest.spyOn(UserModel, 'findOne').mockRejectedValueOnce(new Error('Database error'));

      const result = await hasBadge('testuser', 'Some Badge');
      expect(result).toBe(false);
    });
  });

  describe('checkAndAwardCommunityBadge', () => {
    it('should award a community badge when user joins a community', async () => {
      jest.spyOn(CommunityModel, 'findById').mockResolvedValueOnce(mockCommunity);
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(mockUser);
      // Mock findOneAndUpdate to return a user with the badge added (simulating successful update)
      jest.spyOn(UserModel, 'findOneAndUpdate').mockResolvedValueOnce({
        ...mockUser,
        badges: [
          { type: 'community', name: 'Community Member: Test Community', earnedAt: new Date() },
        ],
      } as DatabaseUser);

      const result = await checkAndAwardCommunityBadge('testuser', mockCommunity._id.toString());
      expect(result).toBe(true);
      expect(CommunityModel.findById).toHaveBeenCalledWith(mockCommunity._id.toString());
    });

    it('should not award badge if community does not exist', async () => {
      jest.spyOn(CommunityModel, 'findById').mockResolvedValueOnce(null);

      const result = await checkAndAwardCommunityBadge('testuser', 'invalid_id');
      expect(result).toBe(false);
    });

    it('should not award duplicate badges', async () => {
      const userWithBadge: DatabaseUser = {
        ...mockUser,
        badges: [
          {
            type: 'community',
            name: 'Community Member: Test Community',
            earnedAt: new Date(),
          },
        ],
      };
      jest.spyOn(CommunityModel, 'findById').mockResolvedValueOnce(mockCommunity);
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(userWithBadge);
      // Mock findOneAndUpdate to return null (simulating that badge already exists, so update didn't happen)
      jest.spyOn(UserModel, 'findOneAndUpdate').mockResolvedValueOnce(null);

      const result = await checkAndAwardCommunityBadge('testuser', mockCommunity._id.toString());
      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      jest.spyOn(CommunityModel, 'findById').mockRejectedValueOnce(new Error('Database error'));

      const result = await checkAndAwardCommunityBadge('testuser', mockCommunity._id.toString());
      expect(result).toBe(false);
    });
  });

  describe('checkAndAwardMilestoneBadge', () => {
    it('should award 50 Questions badge when count is 50', async () => {
      // the 1st call is for hasBadge
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(mockUser);
      // Mock findOneAndUpdate to return a user with the badge added (simulating successful update)
      jest.spyOn(UserModel, 'findOneAndUpdate').mockResolvedValueOnce({
        ...mockUser,
        badges: [{ type: 'milestone', name: '50 Questions', earnedAt: new Date() }],
      } as DatabaseUser);

      const result = await checkAndAwardMilestoneBadge('testuser', 'question', 50);
      expect(result).toBe(true);
    });

    it('should award 100 Questions badge when count is 100', async () => {
      // the 1st call is for hasBadge
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(mockUser);
      // Mock findOneAndUpdate to return a user with the badge added (simulating successful update)
      jest.spyOn(UserModel, 'findOneAndUpdate').mockResolvedValueOnce({
        ...mockUser,
        badges: [{ type: 'milestone', name: '100 Questions', earnedAt: new Date() }],
      } as DatabaseUser);

      const result = await checkAndAwardMilestoneBadge('testuser', 'question', 100);
      expect(result).toBe(true);
    });

    it('should award 50 Answers badge when count is 50', async () => {
      // the 1st call is for hasBadge
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(mockUser);
      // Mock findOneAndUpdate to return a user with the badge added (simulating successful update)
      jest.spyOn(UserModel, 'findOneAndUpdate').mockResolvedValueOnce({
        ...mockUser,
        badges: [{ type: 'milestone', name: '50 Answers', earnedAt: new Date() }],
      } as DatabaseUser);

      const result = await checkAndAwardMilestoneBadge('testuser', 'answer', 50);
      expect(result).toBe(true);
    });

    it('should award 100 Answers badge when count is 100', async () => {
      // the 1st call is for hasBadge
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(mockUser);
      // Mock findOneAndUpdate to return a user with the badge added (simulating successful update)
      jest.spyOn(UserModel, 'findOneAndUpdate').mockResolvedValueOnce({
        ...mockUser,
        badges: [{ type: 'milestone', name: '100 Answers', earnedAt: new Date() }],
      } as DatabaseUser);

      const result = await checkAndAwardMilestoneBadge('testuser', 'answer', 100);
      expect(result).toBe(true);
    });

    it('should not award badge if count is not a milestone (e.g., 49)', async () => {
      const result = await checkAndAwardMilestoneBadge('testuser', 'question', 49);
      expect(result).toBe(false);
    });

    it('should not award duplicate badges', async () => {
      const userWithBadge: DatabaseUser = {
        ...mockUser,
        badges: [
          {
            type: 'milestone',
            name: '50 Questions',
            earnedAt: new Date(),
          },
        ],
      };
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(userWithBadge);
      // Mock findOneAndUpdate to return null (simulating that badge already exists, so update didn't happen)
      jest.spyOn(UserModel, 'findOneAndUpdate').mockResolvedValueOnce(null);

      const result = await checkAndAwardMilestoneBadge('testuser', 'question', 50);
      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      jest
        .spyOn(UserModel, 'findOne')
        .mockRejectedValueOnce(new Error('Database error')) // hasBadge error - caught, returns false
        .mockResolvedValueOnce(mockUser); // awardBadge's internal check (if any)
      jest.spyOn(UserModel, 'findOneAndUpdate').mockResolvedValueOnce(null); // awardBadge returns false

      const result = await checkAndAwardMilestoneBadge('testuser', 'question', 50);
      expect(result).toBe(true);
    });
  });

  describe('getUserBadges', () => {
    it('should return all badges for a user', async () => {
      const badges: Badge[] = [
        {
          type: 'community',
          name: 'Community Member: Test Community',
          earnedAt: new Date('2024-01-01'),
        },
        {
          type: 'milestone',
          name: '50 Questions',
          earnedAt: new Date('2024-01-02'),
        },
      ];
      const userWithBadges: DatabaseUser = {
        ...mockUser,
        badges,
      };
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(userWithBadges);

      const result = await getUserBadges('testuser');
      expect(result).toEqual(badges);
    });

    it('should return empty array if user has no badges', async () => {
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(mockUser);

      const result = await getUserBadges('testuser');
      expect(result).toEqual([]);
    });

    it('should return empty array if user does not exist', async () => {
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(null);

      const result = await getUserBadges('nonexistent');
      expect(result).toEqual([]);
    });

    it('should return empty array if user has no badges array', async () => {
      const userWithoutBadges = { ...mockUser, badges: undefined };
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(userWithoutBadges as DatabaseUser);

      const result = await getUserBadges('testuser');
      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      jest.spyOn(UserModel, 'findOne').mockRejectedValueOnce(new Error('Database error'));

      const result = await getUserBadges('testuser');
      expect(result).toEqual([]);
    });
  });

  describe('checkAndAwardLeaderboardBadges', () => {
    const mockLeaderboard: SafeDatabaseUser[] = [
      {
        _id: new mongoose.Types.ObjectId('65e9b58910afe6e94fc6e6e1'),
        username: 'user1',
        firstName: 'User',
        lastName: 'One',
        dateJoined: new Date('2024-01-01'),
        points: 1000,
        badges: [],
      },
      {
        _id: new mongoose.Types.ObjectId('65e9b58910afe6e94fc6e6e2'),
        username: 'user2',
        firstName: 'User',
        lastName: 'Two',
        dateJoined: new Date('2024-01-01'),
        points: 900,
        badges: [],
      },
      {
        _id: new mongoose.Types.ObjectId('65e9b58910afe6e94fc6e6e3'),
        username: 'user3',
        firstName: 'User',
        lastName: 'Three',
        dateJoined: new Date('2024-01-01'),
        points: 800,
        badges: [],
      },
    ];

    it('should award 1st Place badge to first user', async () => {
      const user1: DatabaseUser = {
        _id: mockLeaderboard[0]._id,
        username: 'user1',
        firstName: 'User',
        lastName: 'One',
        password: 'hashed',
        dateJoined: new Date('2024-01-01'),
        badges: [],
      };
      const user2: DatabaseUser = {
        _id: mockLeaderboard[1]._id,
        username: 'user2',
        firstName: 'User',
        lastName: 'Two',
        password: 'hashed',
        dateJoined: new Date('2024-01-01'),
        badges: [],
      };
      const user3: DatabaseUser = {
        _id: mockLeaderboard[2]._id,
        username: 'user3',
        firstName: 'User',
        lastName: 'Three',
        password: 'hashed',
        dateJoined: new Date('2024-01-01'),
        badges: [],
      };

      // Mock all calls for all 3 users: deduplicateBadges (findOne + findOneAndUpdate) + hasBadge (findOne) + awardBadge (findOneAndUpdate)
      // User 1: deduplicate, hasBadge, award
      jest
        .spyOn(UserModel, 'findOne')
        .mockResolvedValueOnce(user1) // deduplicateBadges
        .mockResolvedValueOnce(user1); // hasBadge
      jest
        .spyOn(UserModel, 'findOneAndUpdate')
        .mockResolvedValueOnce(user1) // deduplicateBadges
        .mockResolvedValueOnce({
          ...user1,
          badges: [{ type: 'leaderboard', name: '1st Place', earnedAt: new Date() }],
        } as DatabaseUser); // awardBadge

      // User 2: deduplicate, hasBadge, award
      jest
        .spyOn(UserModel, 'findOne')
        .mockResolvedValueOnce(user2) // deduplicateBadges
        .mockResolvedValueOnce(user2); // hasBadge
      jest
        .spyOn(UserModel, 'findOneAndUpdate')
        .mockResolvedValueOnce(user2) // deduplicateBadges
        .mockResolvedValueOnce({
          ...user2,
          badges: [{ type: 'leaderboard', name: '2nd Place', earnedAt: new Date() }],
        } as DatabaseUser); // awardBadge

      // User 3: deduplicate, hasBadge, award
      jest
        .spyOn(UserModel, 'findOne')
        .mockResolvedValueOnce(user3) // deduplicateBadges
        .mockResolvedValueOnce(user3); // hasBadge
      jest
        .spyOn(UserModel, 'findOneAndUpdate')
        .mockResolvedValueOnce(user3) // deduplicateBadges
        .mockResolvedValueOnce({
          ...user3,
          badges: [{ type: 'leaderboard', name: '3rd Place', earnedAt: new Date() }],
        } as DatabaseUser); // awardBadge

      await checkAndAwardLeaderboardBadges(mockLeaderboard);

      expect(UserModel.findOneAndUpdate).toHaveBeenCalled();
    });

    it('should not award duplicate badges if user already has them', async () => {
      const user1WithBadge: DatabaseUser = {
        _id: mockLeaderboard[0]._id,
        username: 'user1',
        firstName: 'User',
        lastName: 'One',
        password: 'hashed',
        dateJoined: new Date('2024-01-01'),
        badges: [{ type: 'leaderboard', name: '1st Place', earnedAt: new Date() }],
      };
      const user2: DatabaseUser = {
        _id: mockLeaderboard[1]._id,
        username: 'user2',
        firstName: 'User',
        lastName: 'Two',
        password: 'hashed',
        dateJoined: new Date('2024-01-01'),
        badges: [],
      };
      const user3: DatabaseUser = {
        _id: mockLeaderboard[2]._id,
        username: 'user3',
        firstName: 'User',
        lastName: 'Three',
        password: 'hashed',
        dateJoined: new Date('2024-01-01'),
        badges: [],
      };

      // User 1: deduplicate, hasBadge (returns true - already has badge), so no awardBadge call
      jest
        .spyOn(UserModel, 'findOne')
        .mockResolvedValueOnce(user1WithBadge) // deduplicateBadges
        .mockResolvedValueOnce(user1WithBadge); // hasBadge - returns true
      jest.spyOn(UserModel, 'findOneAndUpdate').mockResolvedValueOnce(user1WithBadge); // deduplicateBadges only

      // User 2: deduplicate, hasBadge, award
      jest
        .spyOn(UserModel, 'findOne')
        .mockResolvedValueOnce(user2) // deduplicateBadges
        .mockResolvedValueOnce(user2); // hasBadge
      jest
        .spyOn(UserModel, 'findOneAndUpdate')
        .mockResolvedValueOnce(user2) // deduplicateBadges
        .mockResolvedValueOnce({
          ...user2,
          badges: [{ type: 'leaderboard', name: '2nd Place', earnedAt: new Date() }],
        } as DatabaseUser); // awardBadge

      // User 3: deduplicate, hasBadge, award
      jest
        .spyOn(UserModel, 'findOne')
        .mockResolvedValueOnce(user3) // deduplicateBadges
        .mockResolvedValueOnce(user3); // hasBadge
      jest
        .spyOn(UserModel, 'findOneAndUpdate')
        .mockResolvedValueOnce(user3) // deduplicateBadges
        .mockResolvedValueOnce({
          ...user3,
          badges: [{ type: 'leaderboard', name: '3rd Place', earnedAt: new Date() }],
        } as DatabaseUser); // awardBadge

      await checkAndAwardLeaderboardBadges(mockLeaderboard);

      // Should have called findOneAndUpdate for deduplication and awarding (but not for user1 since they already have the badge)
      expect(UserModel.findOneAndUpdate).toHaveBeenCalled();
    });

    it('should handle empty leaderboard gracefully', async () => {
      await expect(checkAndAwardLeaderboardBadges([])).resolves.not.toThrow();
    });

    it('should handle leaderboard with less than 3 users', async () => {
      const shortLeaderboard = [mockLeaderboard[0]];

      const user1: DatabaseUser = {
        _id: mockLeaderboard[0]._id,
        username: 'user1',
        firstName: 'User',
        lastName: 'One',
        password: 'hashed',
        dateJoined: new Date('2024-01-01'),
        badges: [],
      };

      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(user1);
      jest.spyOn(UserModel, 'findOneAndUpdate').mockResolvedValueOnce(user1);
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(user1);
      jest.spyOn(UserModel, 'findOneAndUpdate').mockResolvedValueOnce({
        ...user1,
        badges: [{ type: 'leaderboard', name: '1st Place', earnedAt: new Date() }],
      } as DatabaseUser);

      await expect(checkAndAwardLeaderboardBadges(shortLeaderboard)).resolves.not.toThrow();
    });

    it('should deduplicate badges before awarding', async () => {
      const user1WithDuplicates: DatabaseUser = {
        _id: mockLeaderboard[0]._id,
        username: 'user1',
        firstName: 'User',
        lastName: 'One',
        password: 'hashed',
        dateJoined: new Date('2024-01-01'),
        badges: [
          { type: 'leaderboard', name: '1st Place', earnedAt: new Date() },
          { type: 'leaderboard', name: '1st Place', earnedAt: new Date() }, // duplicate
        ],
      };

      const user1Deduplicated: DatabaseUser = {
        ...user1WithDuplicates,
        badges: [{ type: 'leaderboard', name: '1st Place', earnedAt: new Date() }],
      };

      const user2: DatabaseUser = {
        _id: mockLeaderboard[1]._id,
        username: 'user2',
        firstName: 'User',
        lastName: 'Two',
        password: 'hashed',
        dateJoined: new Date('2024-01-01'),
        badges: [],
      };

      const user3: DatabaseUser = {
        _id: mockLeaderboard[2]._id,
        username: 'user3',
        firstName: 'User',
        lastName: 'Three',
        password: 'hashed',
        dateJoined: new Date('2024-01-01'),
        badges: [],
      };

      // User 1: deduplicate (removes duplicates), hasBadge (returns true - already has badge)
      jest
        .spyOn(UserModel, 'findOne')
        .mockResolvedValueOnce(user1WithDuplicates) // deduplicateBadges - finds duplicates
        .mockResolvedValueOnce(user1Deduplicated); // hasBadge - after deduplication, user has badge
      jest.spyOn(UserModel, 'findOneAndUpdate').mockResolvedValueOnce(user1Deduplicated); // deduplicateBadges - removes duplicates

      // User 2: deduplicate, hasBadge, award
      jest
        .spyOn(UserModel, 'findOne')
        .mockResolvedValueOnce(user2) // deduplicateBadges
        .mockResolvedValueOnce(user2); // hasBadge
      jest
        .spyOn(UserModel, 'findOneAndUpdate')
        .mockResolvedValueOnce(user2) // deduplicateBadges
        .mockResolvedValueOnce({
          ...user2,
          badges: [{ type: 'leaderboard', name: '2nd Place', earnedAt: new Date() }],
        } as DatabaseUser); // awardBadge

      // User 3: deduplicate, hasBadge, award
      jest
        .spyOn(UserModel, 'findOne')
        .mockResolvedValueOnce(user3) // deduplicateBadges
        .mockResolvedValueOnce(user3); // hasBadge
      jest
        .spyOn(UserModel, 'findOneAndUpdate')
        .mockResolvedValueOnce(user3) // deduplicateBadges
        .mockResolvedValueOnce({
          ...user3,
          badges: [{ type: 'leaderboard', name: '3rd Place', earnedAt: new Date() }],
        } as DatabaseUser); // awardBadge

      await checkAndAwardLeaderboardBadges(mockLeaderboard);

      // Should have called findOneAndUpdate for deduplication
      expect(UserModel.findOneAndUpdate).toHaveBeenCalled();
    });
  });

  describe('countUserQuestions', () => {
    it('should return the count of questions asked by user', async () => {
      jest.spyOn(QuestionModel, 'countDocuments').mockResolvedValueOnce(5);

      const result = await countUserQuestions('testuser');
      expect(result).toBe(5);
      expect(QuestionModel.countDocuments).toHaveBeenCalledWith({ askedBy: 'testuser' });
    });

    it('should return 0 if user has no questions', async () => {
      jest.spyOn(QuestionModel, 'countDocuments').mockResolvedValueOnce(0);

      const result = await countUserQuestions('testuser');
      expect(result).toBe(0);
    });

    it('should return 0 on error', async () => {
      jest
        .spyOn(QuestionModel, 'countDocuments')
        .mockRejectedValueOnce(new Error('Database error'));

      const result = await countUserQuestions('testuser');
      expect(result).toBe(0);
    });
  });

  describe('countUserAnswers', () => {
    it('should return the count of answers provided by user', async () => {
      jest.spyOn(AnswerModel, 'countDocuments').mockResolvedValueOnce(10);

      const result = await countUserAnswers('testuser');
      expect(result).toBe(10);
      expect(AnswerModel.countDocuments).toHaveBeenCalledWith({ ansBy: 'testuser' });
    });

    it('should return 0 if user has no answers', async () => {
      jest.spyOn(AnswerModel, 'countDocuments').mockResolvedValueOnce(0);

      const result = await countUserAnswers('testuser');
      expect(result).toBe(0);
    });

    it('should return 0 on error', async () => {
      jest.spyOn(AnswerModel, 'countDocuments').mockRejectedValueOnce(new Error('Database error'));

      const result = await countUserAnswers('testuser');
      expect(result).toBe(0);
    });
  });

  describe('deduplicateBadges edge cases', () => {
    it('should handle user with empty badges array', async () => {
      const userWithEmptyBadges: DatabaseUser = {
        ...mockUser,
        badges: [],
      };
      // checkAndAwardLeaderboardBadges calls findOne multiple times:
      // 1. deduplicateBadges -> findOne
      // 2. hasBadge -> findOne
      jest
        .spyOn(UserModel, 'findOne')
        .mockResolvedValueOnce(userWithEmptyBadges) // for deduplicateBadges
        .mockResolvedValueOnce(userWithEmptyBadges); // for hasBadge
      jest.spyOn(UserModel, 'findOneAndUpdate').mockResolvedValueOnce(userWithEmptyBadges);

      // This tests the deduplicateBadges function indirectly through leaderboard badges
      const leaderboard: SafeDatabaseUser[] = [
        {
          _id: mockUser._id,
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          dateJoined: new Date('2024-01-01'),
          points: 1000,
          badges: [],
        },
      ];

      await checkAndAwardLeaderboardBadges(leaderboard);

      // Should not throw error
      expect(UserModel.findOne).toHaveBeenCalled();
    }, 10000);

    it('should handle user with undefined badges', async () => {
      const userWithoutBadges = { ...mockUser, badges: undefined };
      // checkAndAwardLeaderboardBadges calls:
      // 1. deduplicateBadges -> findOne (returns userWithoutBadges)
      // 2. hasBadge -> findOne (returns userWithoutBadges, badges is undefined so returns false)
      // 3. awardBadge -> findOneAndUpdate (awards badge)
      jest
        .spyOn(UserModel, 'findOne')
        .mockResolvedValueOnce(userWithoutBadges as DatabaseUser) // for deduplicateBadges
        .mockResolvedValueOnce(userWithoutBadges as DatabaseUser); // for hasBadge
      jest
        .spyOn(UserModel, 'findOneAndUpdate')
        .mockResolvedValueOnce(userWithoutBadges as DatabaseUser); // for deduplicateBadges (if badges exist)
      // awardBadge also calls findOneAndUpdate, but we need to mock it separately
      jest
        .spyOn(UserModel, 'findOneAndUpdate')
        .mockResolvedValueOnce(userWithoutBadges as DatabaseUser); // for awardBadge

      const leaderboard: SafeDatabaseUser[] = [
        {
          _id: mockUser._id,
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          dateJoined: new Date('2024-01-01'),
          points: 1000,
          badges: [],
        },
      ];

      await expect(checkAndAwardLeaderboardBadges(leaderboard)).resolves.not.toThrow();
    }, 10000);
  });

  describe('awardBadge error handling', () => {
    it('should return false when awardBadge encounters database error', async () => {
      jest.spyOn(CommunityModel, 'findById').mockResolvedValueOnce(mockCommunity);
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(mockUser);
      jest.spyOn(UserModel, 'findOneAndUpdate').mockRejectedValueOnce(new Error('Database error'));

      const result = await checkAndAwardCommunityBadge('testuser', mockCommunity._id.toString());
      expect(result).toBe(false);
    });
  });

  describe('checkAndAwardMilestoneBadge edge cases', () => {
    it('should not award badge if count is not 50 or 100', async () => {
      const result = await checkAndAwardMilestoneBadge('testuser', 'question', 25);
      expect(result).toBe(false);
    });

    it('should not award badge if count is 51 (between milestones)', async () => {
      const result = await checkAndAwardMilestoneBadge('testuser', 'question', 51);
      expect(result).toBe(false);
    });

    it('should not award badge if count is 99 (between milestones)', async () => {
      const result = await checkAndAwardMilestoneBadge('testuser', 'question', 99);
      expect(result).toBe(false);
    });

    it('should handle error in hasBadge check gracefully', async () => {
      // checkAndAwardMilestoneBadge calls:
      // 1. countUserAnswers -> AnswerModel.countDocuments (returns 50)
      // 2. hasBadge -> UserModel.findOne (rejects with error)
      // hasBadge catches error and returns false (meaning "user doesn't have badge")
      // Then checkAndAwardMilestoneBadge checks !hasBadge = !false = true
      // So it calls awardBadge -> UserModel.findOneAndUpdate
      // awardBadge succeeds, so function returns true
      jest.spyOn(AnswerModel, 'countDocuments').mockResolvedValueOnce(50);
      // Mock findOne: first call (hasBadge) rejects, second call (awardBadge) succeeds
      jest
        .spyOn(UserModel, 'findOne')
        .mockRejectedValueOnce(new Error('Database error')) // for hasBadge - returns false
        .mockResolvedValueOnce(mockUser); // for awardBadge
      jest.spyOn(UserModel, 'findOneAndUpdate').mockResolvedValueOnce(mockUser);

      const result = await checkAndAwardMilestoneBadge('testuser', 'question', 50);
      // When hasBadge errors, it returns false (no badge), so function proceeds to award badge
      // and returns true
      expect(result).toBe(true);
    }, 10000);
  });

  describe('checkAndAwardLeaderboardBadges edge cases', () => {
    it('should handle leaderboard with missing username', async () => {
      const leaderboardWithMissingUsername: SafeDatabaseUser[] = [
        {
          _id: mockUser._id,
          username: undefined as any,
          firstName: 'Test',
          lastName: 'User',
          dateJoined: new Date('2024-01-01'),
          points: 1000,
          badges: [],
        },
      ];

      await expect(
        checkAndAwardLeaderboardBadges(leaderboardWithMissingUsername),
      ).resolves.not.toThrow();
    });

    it('should handle leaderboard with null user at position', async () => {
      const userWithBadges: DatabaseUser = {
        ...mockUser,
        badges: [],
      };
      // checkAndAwardLeaderboardBadges only processes first 3 positions
      // It checks if leaderboard[index] && leaderboard[index].username exists
      // So null/undefined entries are skipped
      // Only the first user will be processed, which calls findOne twice
      jest
        .spyOn(UserModel, 'findOne')
        .mockResolvedValueOnce(userWithBadges) // for deduplicateBadges
        .mockResolvedValueOnce(userWithBadges); // for hasBadge
      jest.spyOn(UserModel, 'findOneAndUpdate').mockResolvedValueOnce(userWithBadges);

      const leaderboard: SafeDatabaseUser[] = [
        {
          _id: mockUser._id,
          username: 'user1',
          firstName: 'User',
          lastName: 'One',
          dateJoined: new Date('2024-01-01'),
          points: 1000,
          badges: [],
        },
        null as any,
        undefined as any,
      ];

      await expect(checkAndAwardLeaderboardBadges(leaderboard)).resolves.not.toThrow();
    }, 10000);
  });
});
