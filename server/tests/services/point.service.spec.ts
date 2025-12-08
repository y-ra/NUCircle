import mongoose from 'mongoose';
import UserModel from '../../models/users.model';
import { awardPointsToUser, getUserPoints } from '../../services/point.service';
import { DatabaseUser } from '../../types/types';

describe('Point Service', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('awardPointsToUser', () => {
    const mockUsername = 'testuser';

    it('should award points to a user with existing points', async () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        username: mockUsername,
        points: 100,
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(UserModel, 'findOne').mockResolvedValue(mockUser as any);

      const result = await awardPointsToUser(mockUsername, 50);

      expect(mockUser.points).toBe(150);
      expect(mockUser.save).toHaveBeenCalledTimes(1);
      expect(result).toBe(150);
    });

    it('should handle undefined points property by treating it as 0', async () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        username: mockUsername,
        points: undefined,
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(UserModel, 'findOne').mockResolvedValue(mockUser as any);

      const result = await awardPointsToUser(mockUsername, 75);

      expect(mockUser.points).toBe(75);
      expect(result).toBe(75);
    });

    it('should return 0 when user is not found', async () => {
      jest.spyOn(UserModel, 'findOne').mockResolvedValue(null);

      const result = await awardPointsToUser(mockUsername, 50);

      expect(result).toBe(0);
    });

    it('should return 0 when there is a database error', async () => {
      jest.spyOn(UserModel, 'findOne').mockRejectedValue(new Error('Database error'));

      const result = await awardPointsToUser(mockUsername, 50);

      expect(result).toBe(0);
    });
  });

  describe('getUserPoints', () => {
    const mockUsername = 'testuser';

    it('should return the points of a user', async () => {
      const mockUser: Partial<DatabaseUser> = {
        _id: new mongoose.Types.ObjectId(),
        username: mockUsername,
        points: 150,
      };

      jest.spyOn(UserModel, 'findOne').mockResolvedValue(mockUser as any);

      const result = await getUserPoints(mockUsername);

      expect(result).toBe(150);
    });

    it('should return 0 when user has no points property', async () => {
      const mockUser: Partial<DatabaseUser> = {
        _id: new mongoose.Types.ObjectId(),
        username: mockUsername,
        points: undefined,
      };

      jest.spyOn(UserModel, 'findOne').mockResolvedValue(mockUser as any);

      const result = await getUserPoints(mockUsername);

      expect(result).toBe(0);
    });

    it('should return 0 when user is not found', async () => {
      jest.spyOn(UserModel, 'findOne').mockResolvedValue(null);

      const result = await getUserPoints(mockUsername);

      expect(result).toBe(0);
    });

    it('should return 0 when there is a database error', async () => {
      jest.spyOn(UserModel, 'findOne').mockRejectedValue(new Error('Database error'));

      const result = await getUserPoints(mockUsername);

      expect(result).toBe(0);
    });
  });
});
