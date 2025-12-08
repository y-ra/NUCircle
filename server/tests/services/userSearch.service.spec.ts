import { searchUsers } from '../../services/user.service';
import UserModel from '../../models/users.model';
import WorkExperienceModel from '../../models/workExperience.model';
import CommunityModel from '../../models/community.model';
import mongoose from 'mongoose';

describe('User Search and Filter Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUsers = [
    {
      _id: new mongoose.Types.ObjectId(),
      username: 'e.hopper',
      email: 'e.hopper@test.com',
      firstName: 'Eleven',
      lastName: 'Hopper',
      major: 'Computer Science',
      graduationYear: 2025,
    },
    {
      _id: new mongoose.Types.ObjectId(),
      username: 'm.wheeler',
      email: 'm.wheeler@test.com',
      firstName: 'Mike',
      lastName: 'Wheeler',
      major: 'Data Science',
      graduationYear: 2026,
    },
    {
      _id: new mongoose.Types.ObjectId(),
      username: 'w.byers',
      email: 'w.byers@test.com',
      firstName: 'Will',
      lastName: 'Byers',
      major: 'Computer Science',
      graduationYear: 2025,
    },
  ];

  const setupMocks = (usersToReturn: any[]) => {
    const mockFind = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(usersToReturn),
    };
    jest.spyOn(UserModel, 'find').mockReturnValue(mockFind as any);

    const mockWorkExpFind = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    };
    jest.spyOn(WorkExperienceModel, 'find').mockReturnValue(mockWorkExpFind as any);

    const mockCommunityFind = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    };
    jest.spyOn(CommunityModel, 'find').mockReturnValue(mockCommunityFind as any);
  };

  describe('Search by name', () => {
    it('should find users by first name', async () => {
      setupMocks([mockUsers[0]]);

      const result = await searchUsers('Eleven', {});

      expect(Array.isArray(result)).toBe(true);
      expect(UserModel.find).toHaveBeenCalledWith({
        $or: [
          { firstName: { $regex: 'Eleven', $options: 'i' } },
          { lastName: { $regex: 'Eleven', $options: 'i' } },
          { username: { $regex: 'Eleven', $options: 'i' } },
        ],
      });
      if (Array.isArray(result)) {
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].firstName).toBe('Eleven');
      }
    });

    it('should find users by last name', async () => {
      setupMocks([mockUsers[1]]);

      const result = await searchUsers('Wheeler', {});

      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].lastName).toBe('Wheeler');
      }
    });

    it('should find users by username', async () => {
      setupMocks([mockUsers[0]]);

      const result = await searchUsers('e.hopper', {});

      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result.length).toBe(1);
        expect(result[0].username).toBe('e.hopper');
      }
    });

    it('should be case insensitive', async () => {
      setupMocks([mockUsers[0]]);

      const result = await searchUsers('ELEVEN', {});

      expect(Array.isArray(result)).toBe(true);
      expect(UserModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            expect.objectContaining({ firstName: { $regex: 'ELEVEN', $options: 'i' } }),
          ]),
        }),
      );
      if (Array.isArray(result)) {
        expect(result.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Search by company', () => {
    it('should find users by company name', async () => {
      setupMocks([]);

      const result = await searchUsers('Google', {});

      expect(Array.isArray(result)).toBe(true);
      expect(WorkExperienceModel.find).toHaveBeenCalled();
    });
  });

  describe('Filter by major', () => {
    it('should filter users by major', async () => {
      const csUsers = mockUsers.filter(u => u.major === 'Computer Science');
      setupMocks(csUsers);

      const result = await searchUsers('', { major: 'Computer Science' });

      expect(Array.isArray(result)).toBe(true);
      expect(UserModel.find).toHaveBeenCalledWith({ major: 'Computer Science' });
      if (Array.isArray(result)) {
        expect(result.every(u => u.major === 'Computer Science')).toBe(true);
      }
    });
  });

  describe('Filter by graduation year', () => {
    it('should filter users by graduation year', async () => {
      const filtered = mockUsers.filter(u => u.graduationYear === 2026);
      setupMocks(filtered);

      const result = await searchUsers('', { graduationYear: 2026 });

      expect(Array.isArray(result)).toBe(true);
      expect(UserModel.find).toHaveBeenCalledWith({ graduationYear: 2026 });
      if (Array.isArray(result)) {
        expect(result.every(u => u.graduationYear === 2026)).toBe(true);
      }
    });
  });

  describe('Filter by community', () => {
    it('should filter users by community', async () => {
      const communityId = new mongoose.Types.ObjectId();
      const mockCommunity = {
        _id: communityId,
        name: 'TestCommunity',
        participants: ['e.hopper', 'm.wheeler'],
      };

      setupMocks(mockUsers.slice(0, 2));
      jest.spyOn(CommunityModel, 'findById').mockResolvedValue(mockCommunity as any);

      const result = await searchUsers('', { communityId: communityId.toString() });

      expect(Array.isArray(result)).toBe(true);
      expect(CommunityModel.findById).toHaveBeenCalledWith(communityId.toString());
      if (Array.isArray(result)) {
        expect(result.length).toBe(2);
      }
    });
  });

  describe('Combined search and filters', () => {
    it('should apply both search query and filters', async () => {
      setupMocks([mockUsers[0]]);

      const result = await searchUsers('Eleven', { major: 'Computer Science' });

      expect(Array.isArray(result)).toBe(true);
      expect(UserModel.find).toHaveBeenCalledWith({
        $or: [
          { firstName: { $regex: 'Eleven', $options: 'i' } },
          { lastName: { $regex: 'Eleven', $options: 'i' } },
          { username: { $regex: 'Eleven', $options: 'i' } },
        ],
        major: 'Computer Science',
      });
      if (Array.isArray(result)) {
        expect(result.length).toBe(1);
      }
    });
  });

  describe('Empty results', () => {
    it('should return empty array for no matches', async () => {
      setupMocks([]);

      const result = await searchUsers('NonexistentUser', {});

      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result.length).toBe(0);
      }
    });
  });
});
