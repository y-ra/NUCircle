import mongoose, { Query } from 'mongoose';
import UserModel from '../../models/users.model';
import {
  deleteUserByUsername,
  getUserByUsername,
  getUsersList,
  loginUser,
  saveUser,
  updateUser,
  updateUserOnlineStatus,
  searchUsers,
  getUniqueGraduationYears,
  getUniqueMajors,
  getLeaderboard,
  getOnlineUsers,
} from '../../services/user.service';
import { SafeDatabaseUser, User, UserLogin } from '../../types/types';
import { user, safeUser } from '../mockData.models';
import bcryptjs from 'bcryptjs';
import { ObjectId } from 'mongodb';
import WorkExperienceModel from '../../models/workExperience.model';
import CommunityModel from '../../models/community.model';

describe('User model', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('saveUser', () => {
    it('should return the saved user', async () => {
      jest
        .spyOn(UserModel, 'create')
        .mockResolvedValueOnce({ ...user, _id: mongoose.Types.ObjectId } as unknown as ReturnType<
          typeof UserModel.create<User>
        >);

      const savedUser = (await saveUser(user)) as SafeDatabaseUser;

      expect(savedUser._id).toBeDefined();
      expect(savedUser.username).toEqual(user.username);
      expect(savedUser.dateJoined).toEqual(user.dateJoined);
    });

    it('should set hasSeenWelcomeMessage to false by default for new users', async () => {
      jest.spyOn(UserModel, 'create').mockResolvedValueOnce({
        ...user,
        _id: mongoose.Types.ObjectId,
        hasSeenWelcomeMessage: false,
      } as unknown as ReturnType<typeof UserModel.create<User>>);

      const savedUser = (await saveUser(user)) as SafeDatabaseUser;

      expect(savedUser.hasSeenWelcomeMessage).toBe(false);
    });

    it('should throw an error if error when saving to database', async () => {
      jest
        .spyOn(UserModel, 'create')
        .mockRejectedValueOnce(() => new Error('Error saving document'));

      const saveError = await saveUser(user);

      expect('error' in saveError).toBe(true);
    });

    it('should return error when create returns null', async () => {
      jest.spyOn(UserModel, 'create').mockResolvedValueOnce(null as any);

      const saveError = await saveUser(user);

      expect('error' in saveError).toBe(true);
    });
  });
});

describe('updateUserOnlineStatus', () => {
  const mockUsername = 'test_user';
  const mockSocketId = 'socket_abc12345';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User becomes ONLINE', () => {
    it('should set status isOnline=true and store socketId', async () => {
      const mockUser = {
        _id: new ObjectId(),
        username: mockUsername,
        firstName: 'Test',
        lastName: 'User',
        isOnline: true,
        socketId: mockSocketId,
        lastSeen: new Date('2025-11-11'),
      };

      const mockSelect = jest.fn().mockResolvedValue(mockUser);
      const mockFindOneAndUpdate = jest.fn().mockReturnValue({
        select: mockSelect,
      });
      (UserModel.findOneAndUpdate as jest.Mock) = mockFindOneAndUpdate;

      const result = await updateUserOnlineStatus(mockUsername, true, mockSocketId);

      expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
        { username: mockUsername },
        {
          $set: {
            isOnline: true,
            socketId: mockSocketId,
          },
        },
        { new: true },
      );

      expect(mockSelect).toHaveBeenCalledWith('-password');
      expect(result).toEqual(mockUser);
    });
  });

  describe('User becomes OFFLINE', () => {
    it('should set status isOnline=false, clear socketId, and record lastSeen', async () => {
      const mockUser = {
        _id: new ObjectId(),
        username: mockUsername,
        firstName: 'Test',
        lastName: 'User',
        isOnline: false,
        socketId: null,
        lastSeen: expect.any(Date),
      };

      const mockSelect = jest.fn().mockResolvedValue(mockUser);
      const mockFindOneAndUpdate = jest.fn().mockReturnValue({
        select: mockSelect,
      });
      (UserModel.findOneAndUpdate as jest.Mock) = mockFindOneAndUpdate;

      const result = await updateUserOnlineStatus(mockUsername, false, null);

      expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
        { username: mockUsername },
        {
          $set: {
            isOnline: false,
            socketId: null,
            lastSeen: expect.any(Date),
          },
        },
        { new: true },
      );

      expect(result).toEqual(mockUser);
    });

    it('should set lastSeen to current time when going offline', async () => {
      const beforeTime = new Date();

      const mockUser = {
        _id: new ObjectId(),
        username: mockUsername,
        firstName: 'Test',
        lastName: 'User',
        isOnline: false,
        socketId: null,
        lastSeen: new Date(),
      };

      const mockSelect = jest.fn().mockResolvedValue(mockUser);
      const mockFindOneAndUpdate = jest.fn().mockReturnValue({
        select: mockSelect,
      });
      (UserModel.findOneAndUpdate as jest.Mock) = mockFindOneAndUpdate;

      await updateUserOnlineStatus(mockUsername, false, null);

      const afterTime = new Date();

      const updateCall = mockFindOneAndUpdate.mock.calls[0][1].$set;
      const lastSeenValue = updateCall.lastSeen;

      expect(lastSeenValue.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(lastSeenValue.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('Error handling', () => {
    it('should return error when user not found', async () => {
      const mockSelect = jest.fn().mockResolvedValue(null);
      const mockFindOneAndUpdate = jest.fn().mockReturnValue({
        select: mockSelect,
      });
      (UserModel.findOneAndUpdate as jest.Mock) = mockFindOneAndUpdate;

      const result = await updateUserOnlineStatus(mockUsername, true, mockSocketId);

      expect(result).toHaveProperty('error');
      expect((result as { error: string }).error).toContain(
        'Error updating this users online status',
      );
    });

    it('should handle database errors', async () => {
      const mockSelect = jest.fn().mockRejectedValue(new Error('Database connection failed'));
      const mockFindOneAndUpdate = jest.fn().mockReturnValue({
        select: mockSelect,
      });
      (UserModel.findOneAndUpdate as jest.Mock) = mockFindOneAndUpdate;

      const result = await updateUserOnlineStatus(mockUsername, true, mockSocketId);

      expect(result).toHaveProperty('error');
      expect((result as { error: string }).error).toContain(
        'Error occurred when updating this users status',
      );
    });

    it('should use default socketId parameter when not provided', async () => {
      const mockUser = {
        _id: new ObjectId(),
        username: mockUsername,
        firstName: 'Test',
        lastName: 'User',
        isOnline: true,
        socketId: null,
      };

      const mockSelect = jest.fn().mockResolvedValue(mockUser);
      const mockFindOneAndUpdate = jest.fn().mockReturnValue({
        select: mockSelect,
      });
      (UserModel.findOneAndUpdate as jest.Mock) = mockFindOneAndUpdate;

      // Call without socketId parameter to test default
      const result = await updateUserOnlineStatus(mockUsername, true);

      expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
        { username: mockUsername },
        {
          $set: {
            isOnline: true,
            socketId: null, // Default value
          },
        },
        { new: true },
      );
      expect(result).not.toHaveProperty('error');
    });
  });
});

describe('getUserByUsername', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return the matching user', async () => {
    jest.spyOn(UserModel, 'findOne').mockImplementation((filter?: any) => {
      expect(filter.username).toBeDefined();
      const query: any = {};
      query.select = jest.fn().mockReturnValue(Promise.resolve(user));
      return query;
    });

    const retrievedUser = (await getUserByUsername(user.username)) as SafeDatabaseUser;

    expect(retrievedUser.username).toEqual(user.username);
    expect(retrievedUser.dateJoined).toEqual(user.dateJoined);
  });

  it('should throw an error if the user is not found', async () => {
    jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(null);

    const getUserError = await getUserByUsername(user.username);

    expect('error' in getUserError).toBe(true);
  });

  it('should return error when findOne returns null with select', async () => {
    jest.spyOn(UserModel, 'findOne').mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    } as unknown as Query<SafeDatabaseUser, typeof UserModel>);

    const getUserError = await getUserByUsername(user.username);

    expect('error' in getUserError).toBe(true);
  });

  it('should throw an error if there is an error while searching the database', async () => {
    jest.spyOn(UserModel, 'findOne').mockReturnValue({
      select: jest.fn().mockRejectedValue(new Error('Error finding document')),
    } as unknown as Query<SafeDatabaseUser, typeof UserModel>);

    const getUserError = await getUserByUsername(user.username);

    expect('error' in getUserError).toBe(true);
  });
});

describe('getUsersList', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return the users', async () => {
    jest.spyOn(UserModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([safeUser]),
    } as any);

    const retrievedUsers = (await getUsersList()) as SafeDatabaseUser[];

    expect(retrievedUsers[0].username).toEqual(safeUser.username);
    expect(retrievedUsers[0].dateJoined).toEqual(safeUser.dateJoined);
  });

  it('should throw an error if the users cannot be found', async () => {
    jest.spyOn(UserModel, 'find').mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    } as any);

    const getUsersError = await getUsersList();

    expect('error' in getUsersError).toBe(true);
  });

  it('should throw an error if there is an error while searching the database', async () => {
    jest.spyOn(UserModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockRejectedValue(new Error('Error finding documents')),
    } as any);

    const getUsersError = await getUsersList();

    expect((getUsersError as { error: string }).error).toMatch('Error occurred when finding users');
  });
});

describe('loginUser', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return the user if authentication succeeds', async () => {
    jest.spyOn(UserModel, 'findOne').mockResolvedValue({
      ...safeUser,
      password: await bcryptjs.hash(user.password, 10),
    });

    const credentials: UserLogin = {
      username: user.username,
      password: user.password,
    };

    const loggedInUser = (await loginUser(credentials)) as SafeDatabaseUser;

    expect(loggedInUser.username).toEqual(user.username);
    expect(loggedInUser.dateJoined).toEqual(user.dateJoined);
  });

  it('should include hasSeenWelcomeMessage in login response', async () => {
    jest.spyOn(UserModel, 'findOne').mockResolvedValue({
      ...safeUser,
      password: await bcryptjs.hash(user.password, 10),
      hasSeenWelcomeMessage: false,
    });

    const credentials: UserLogin = {
      username: user.username,
      password: user.password,
    };

    const loggedInUser = (await loginUser(credentials)) as SafeDatabaseUser;

    expect(loggedInUser.hasSeenWelcomeMessage).toBe(false);
  });

  it('should return the user if the password fails', async () => {
    jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(null);

    const credentials: UserLogin = {
      username: user.username,
      password: 'wrongPassword',
    };

    const loginError = await loginUser(credentials);

    expect('error' in loginError).toBe(true);
  });

  it('should return the user is not found', async () => {
    jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(null);

    const credentials: UserLogin = {
      username: 'wrongUsername',
      password: user.password,
    };

    const loginError = await loginUser(credentials);

    expect('error' in loginError).toBe(true);
  });

  it('should return error when findOne returns null with select in loginUser', async () => {
    jest.spyOn(UserModel, 'findOne').mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    } as unknown as Query<SafeDatabaseUser, typeof UserModel>);

    const credentials: UserLogin = {
      username: user.username,
      password: user.password,
    };

    const loginError = await loginUser(credentials);

    expect('error' in loginError).toBe(true);
  });

  it('should handle non-Error exceptions in loginUser', async () => {
    // Mock findOne to throw a non-Error value (string)
    jest.spyOn(UserModel, 'findOne').mockRejectedValueOnce('String error' as any);

    const credentials: UserLogin = {
      username: user.username,
      password: user.password,
    };

    const loginError = await loginUser(credentials);

    expect('error' in loginError).toBe(true);
    if ('error' in loginError) {
      expect(loginError.error).toBe('Authentication failed');
    }
  });
});

describe('deleteUserByUsername', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return the deleted user when deleted succesfully', async () => {
    jest.spyOn(UserModel, 'findOneAndDelete').mockImplementation((filter?: any) => {
      expect(filter.username).toBeDefined();
      const query: any = {};
      query.select = jest.fn().mockReturnValue(Promise.resolve(safeUser));
      return query;
    });

    const deletedUser = (await deleteUserByUsername(user.username)) as SafeDatabaseUser;

    expect(deletedUser.username).toEqual(user.username);
    expect(deletedUser.dateJoined).toEqual(user.dateJoined);
  });

  it('should throw an error if the username is not found', async () => {
    jest.spyOn(UserModel, 'findOneAndDelete').mockResolvedValue(null);

    const deletedError = await deleteUserByUsername(user.username);

    expect('error' in deletedError).toBe(true);
  });

  it('should return error when findOneAndDelete returns null with select', async () => {
    jest.spyOn(UserModel, 'findOneAndDelete').mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    } as unknown as Query<SafeDatabaseUser, typeof UserModel>);

    const deletedError = await deleteUserByUsername(user.username);

    expect('error' in deletedError).toBe(true);
  });

  it('should throw an error if a database error while deleting', async () => {
    jest.spyOn(UserModel, 'findOneAndDelete').mockReturnValue({
      select: jest.fn().mockRejectedValue(new Error('Error deleting document')),
    } as unknown as Query<SafeDatabaseUser, typeof UserModel>);

    const deletedError = await deleteUserByUsername(user.username);

    expect('error' in deletedError).toBe(true);
  });
});

describe('updateUser', () => {
  const updatedUser: User = {
    ...user,
    password: 'newPassword',
  };

  const safeUpdatedUser: SafeDatabaseUser = {
    _id: new mongoose.Types.ObjectId(),
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    dateJoined: user.dateJoined,
  };

  const updates: Partial<User> = {
    password: 'newPassword',
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return the updated user when updated succesfully', async () => {
    jest.spyOn(UserModel, 'findOneAndUpdate').mockImplementation((filter?: any) => {
      expect(filter.username).toBeDefined();
      const query: any = {};
      query.select = jest.fn().mockReturnValue(Promise.resolve(safeUpdatedUser));
      return query;
    });

    const result = (await updateUser(user.username, updates)) as SafeDatabaseUser;

    expect(result.username).toEqual(user.username);
    expect(result.username).toEqual(updatedUser.username);
    expect(result.dateJoined).toEqual(user.dateJoined);
    expect(result.dateJoined).toEqual(updatedUser.dateJoined);
  });

  it('should throw an error if the username is not found', async () => {
    jest.spyOn(UserModel, 'findOneAndUpdate').mockResolvedValueOnce(null);

    const updatedError = await updateUser(user.username, updates);

    expect('error' in updatedError).toBe(true);
  });

  it('should return error when findOneAndUpdate returns null with select', async () => {
    jest.spyOn(UserModel, 'findOneAndUpdate').mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    } as unknown as Query<SafeDatabaseUser, typeof UserModel>);

    const updatedError = await updateUser(user.username, updates);

    expect('error' in updatedError).toBe(true);
  });

  it('should throw an error if a database error while deleting', async () => {
    jest.spyOn(UserModel, 'findOneAndUpdate').mockReturnValue({
      select: jest.fn().mockRejectedValue(new Error('Error updating document')),
    } as unknown as Query<SafeDatabaseUser, typeof UserModel>);

    const updatedError = await updateUser(user.username, updates);

    expect('error' in updatedError).toBe(true);
  });

  it('should update the biography if the user is found', async () => {
    const newBio = 'This is a new biography';
    const biographyUpdates: Partial<User> = { biography: newBio };
    jest.spyOn(UserModel, 'findOneAndUpdate').mockImplementation((filter?: any) => {
      expect(filter.username).toBeDefined();
      const query: any = {};
      query.select = jest
        .fn()
        .mockReturnValue(Promise.resolve({ ...safeUpdatedUser, biography: newBio }));
      return query;
    });

    const result = await updateUser(user.username, biographyUpdates);

    // Check that the result is a SafeUser and the biography got updated
    if ('username' in result) {
      expect(result.biography).toEqual(newBio);
    } else {
      throw new Error('Expected a safe user, got an error object.');
    }
  });

  it('should return an error if biography update fails because user not found', async () => {
    // Simulate user not found
    jest.spyOn(UserModel, 'findOneAndUpdate').mockResolvedValueOnce(null);

    const newBio = 'No user found test';
    const biographyUpdates: Partial<User> = { biography: newBio };
    const updatedError = await updateUser(user.username, biographyUpdates);

    expect('error' in updatedError).toBe(true);
  });

  it('should update hasSeenWelcomeMessage to true when updating user', async () => {
    const welcomeMessageUpdates: Partial<User> = { hasSeenWelcomeMessage: true };
    jest.spyOn(UserModel, 'findOneAndUpdate').mockImplementation((filter?: any) => {
      expect(filter.username).toBeDefined();
      const query: any = {};
      query.select = jest
        .fn()
        .mockReturnValue(Promise.resolve({ ...safeUpdatedUser, hasSeenWelcomeMessage: true }));
      return query;
    });

    const result = await updateUser(user.username, welcomeMessageUpdates);

    if ('username' in result) {
      expect(result.hasSeenWelcomeMessage).toBe(true);
    } else {
      throw new Error('Expected a safe user, got an error object.');
    }
  });

  it('should update external links when updating user', async () => {
    const externalLinks = {
      linkedin: 'https://linkedin.com/in/testuser',
      github: 'https://github.com/testuser',
      portfolio: 'https://testuser.com',
    };
    const externalLinksUpdates: Partial<User> = { externalLinks };
    jest.spyOn(UserModel, 'findOneAndUpdate').mockImplementation((filter?: any) => {
      expect(filter.username).toBeDefined();
      const query: any = {};
      query.select = jest
        .fn()
        .mockReturnValue(Promise.resolve({ ...safeUpdatedUser, externalLinks }));
      return query;
    });

    const result = await updateUser(user.username, externalLinksUpdates);

    if ('username' in result) {
      expect(result.externalLinks).toEqual(externalLinks);
      expect(result.externalLinks?.linkedin).toBe('https://linkedin.com/in/testuser');
      expect(result.externalLinks?.github).toBe('https://github.com/testuser');
      expect(result.externalLinks?.portfolio).toBe('https://testuser.com');
    } else {
      throw new Error('Expected a safe user, got an error object.');
    }
  });

  it('should update partial external links when updating user', async () => {
    const externalLinks = {
      linkedin: 'https://linkedin.com/in/testuser',
    };
    const externalLinksUpdates: Partial<User> = { externalLinks };
    jest.spyOn(UserModel, 'findOneAndUpdate').mockImplementation((filter?: any) => {
      expect(filter.username).toBeDefined();
      const query: any = {};
      query.select = jest
        .fn()
        .mockReturnValue(Promise.resolve({ ...safeUpdatedUser, externalLinks }));
      return query;
    });

    const result = await updateUser(user.username, externalLinksUpdates);

    if ('username' in result) {
      expect(result.externalLinks).toEqual(externalLinks);
      expect(result.externalLinks?.linkedin).toBe('https://linkedin.com/in/testuser');
      expect(result.externalLinks?.github).toBeUndefined();
      expect(result.externalLinks?.portfolio).toBeUndefined();
    } else {
      throw new Error('Expected a safe user, got an error object.');
    }
  });

  it('should return an error if external links update fails because user not found', async () => {
    jest.spyOn(UserModel, 'findOneAndUpdate').mockResolvedValueOnce(null);

    const externalLinks = {
      linkedin: 'https://linkedin.com/in/testuser',
    };
    const externalLinksUpdates: Partial<User> = { externalLinks };
    const updatedError = await updateUser(user.username, externalLinksUpdates);

    expect('error' in updatedError).toBe(true);
  });
});

describe('updateUser - career fields', () => {
  const safeUpdatedUser: SafeDatabaseUser = {
    _id: new mongoose.Types.ObjectId(),
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    dateJoined: user.dateJoined,
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should update careerGoals when updating user', async () => {
    const careerGoals = 'data science, finance, product management';
    const careerGoalsUpdates: Partial<User> = { careerGoals };
    jest.spyOn(UserModel, 'findOneAndUpdate').mockImplementation((filter?: any) => {
      expect(filter.username).toBeDefined();
      const query: any = {};
      query.select = jest
        .fn()
        .mockReturnValue(Promise.resolve({ ...safeUpdatedUser, careerGoals }));
      return query;
    });

    const result = await updateUser(user.username, careerGoalsUpdates);

    if ('username' in result) {
      expect(result.careerGoals).toEqual(careerGoals);
    } else {
      throw new Error('Expected a safe user, got an error object.');
    }
  });

  it('should update technicalInterests when updating user', async () => {
    const technicalInterests = 'machine learning, react, cloud computing';
    const technicalInterestsUpdates: Partial<User> = { technicalInterests };
    jest.spyOn(UserModel, 'findOneAndUpdate').mockImplementation((filter?: any) => {
      expect(filter.username).toBeDefined();
      const query: any = {};
      query.select = jest
        .fn()
        .mockReturnValue(Promise.resolve({ ...safeUpdatedUser, technicalInterests }));
      return query;
    });

    const result = await updateUser(user.username, technicalInterestsUpdates);

    if ('username' in result) {
      expect(result.technicalInterests).toEqual(technicalInterests);
    } else {
      throw new Error('Expected a safe user, got an error object.');
    }
  });

  it('should update both careerGoals and technicalInterests together', async () => {
    const careerGoals = 'software engineering';
    const technicalInterests = 'typescript, node.js';
    const updates: Partial<User> = { careerGoals, technicalInterests };

    jest.spyOn(UserModel, 'findOneAndUpdate').mockImplementation((filter?: any) => {
      expect(filter.username).toBeDefined();
      const query: any = {};
      query.select = jest
        .fn()
        .mockReturnValue(Promise.resolve({ ...safeUpdatedUser, careerGoals, technicalInterests }));
      return query;
    });

    const result = await updateUser(user.username, updates);

    if ('username' in result) {
      expect(result.careerGoals).toEqual(careerGoals);
      expect(result.technicalInterests).toEqual(technicalInterests);
    } else {
      throw new Error('Expected a safe user, got an error object.');
    }
  });

  it('should clear careerGoals when set to empty string', async () => {
    const careerGoals = '';
    const careerGoalsUpdates: Partial<User> = { careerGoals };
    jest.spyOn(UserModel, 'findOneAndUpdate').mockImplementation((filter?: any) => {
      expect(filter.username).toBeDefined();
      const query: any = {};
      query.select = jest
        .fn()
        .mockReturnValue(Promise.resolve({ ...safeUpdatedUser, careerGoals }));
      return query;
    });

    const result = await updateUser(user.username, careerGoalsUpdates);

    if ('username' in result) {
      expect(result.careerGoals).toEqual('');
    } else {
      throw new Error('Expected a safe user, got an error object.');
    }
  });

  it('should return an error if career goals update fails because user not found', async () => {
    jest.spyOn(UserModel, 'findOneAndUpdate').mockResolvedValueOnce(null);

    const careerGoals = 'data science';
    const careerGoalsUpdates: Partial<User> = { careerGoals };
    const updatedError = await updateUser(user.username, careerGoalsUpdates);

    expect('error' in updatedError).toBe(true);
  });
});

describe('updateUser - career fields', () => {
  const safeUpdatedUser: SafeDatabaseUser = {
    _id: new mongoose.Types.ObjectId(),
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    dateJoined: user.dateJoined,
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should update careerGoals when updating user', async () => {
    const careerGoals = 'data science, finance, product management';
    const careerGoalsUpdates: Partial<User> = { careerGoals };
    jest.spyOn(UserModel, 'findOneAndUpdate').mockImplementation((filter?: any) => {
      expect(filter.username).toBeDefined();
      const query: any = {};
      query.select = jest
        .fn()
        .mockReturnValue(Promise.resolve({ ...safeUpdatedUser, careerGoals }));
      return query;
    });

    const result = await updateUser(user.username, careerGoalsUpdates);

    if ('username' in result) {
      expect(result.careerGoals).toEqual(careerGoals);
    } else {
      throw new Error('Expected a safe user, got an error object.');
    }
  });

  it('should update technicalInterests when updating user', async () => {
    const technicalInterests = 'machine learning, react, cloud computing';
    const technicalInterestsUpdates: Partial<User> = { technicalInterests };
    jest.spyOn(UserModel, 'findOneAndUpdate').mockImplementation((filter?: any) => {
      expect(filter.username).toBeDefined();
      const query: any = {};
      query.select = jest
        .fn()
        .mockReturnValue(Promise.resolve({ ...safeUpdatedUser, technicalInterests }));
      return query;
    });

    const result = await updateUser(user.username, technicalInterestsUpdates);

    if ('username' in result) {
      expect(result.technicalInterests).toEqual(technicalInterests);
    } else {
      throw new Error('Expected a safe user, got an error object.');
    }
  });

  it('should update both careerGoals and technicalInterests together', async () => {
    const careerGoals = 'software engineering';
    const technicalInterests = 'typescript, node.js';
    const updates: Partial<User> = { careerGoals, technicalInterests };

    jest.spyOn(UserModel, 'findOneAndUpdate').mockImplementation((filter?: any) => {
      expect(filter.username).toBeDefined();
      const query: any = {};
      query.select = jest
        .fn()
        .mockReturnValue(Promise.resolve({ ...safeUpdatedUser, careerGoals, technicalInterests }));
      return query;
    });

    const result = await updateUser(user.username, updates);

    if ('username' in result) {
      expect(result.careerGoals).toEqual(careerGoals);
      expect(result.technicalInterests).toEqual(technicalInterests);
    } else {
      throw new Error('Expected a safe user, got an error object.');
    }
  });

  it('should clear careerGoals when set to empty string', async () => {
    const careerGoals = '';
    const careerGoalsUpdates: Partial<User> = { careerGoals };
    jest.spyOn(UserModel, 'findOneAndUpdate').mockImplementation((filter?: any) => {
      expect(filter.username).toBeDefined();
      const query: any = {};
      query.select = jest
        .fn()
        .mockReturnValue(Promise.resolve({ ...safeUpdatedUser, careerGoals }));
      return query;
    });

    const result = await updateUser(user.username, careerGoalsUpdates);

    if ('username' in result) {
      expect(result.careerGoals).toEqual('');
    } else {
      throw new Error('Expected a safe user, got an error object.');
    }
  });

  it('should return an error if career goals update fails because user not found', async () => {
    jest.spyOn(UserModel, 'findOneAndUpdate').mockResolvedValueOnce(null);

    const careerGoals = 'data science';
    const careerGoalsUpdates: Partial<User> = { careerGoals };
    const updatedError = await updateUser(user.username, careerGoalsUpdates);

    expect('error' in updatedError).toBe(true);
  });

  it('should update major field', async () => {
    const major = 'Computer Science';
    const majorUpdates: Partial<User> = { major };
    jest.spyOn(UserModel, 'findOneAndUpdate').mockImplementation((filter?: any) => {
      expect(filter.username).toBeDefined();
      const query: any = {};
      query.select = jest.fn().mockReturnValue(Promise.resolve({ ...safeUpdatedUser, major }));
      return query;
    });

    const result = await updateUser(user.username, majorUpdates);

    if ('username' in result) {
      expect(result.major).toEqual(major);
    } else {
      throw new Error('Expected a safe user, got an error object.');
    }
  });

  it('should update graduationYear field', async () => {
    const graduationYear = 2025;
    const gradYearUpdates: Partial<User> = { graduationYear };
    jest.spyOn(UserModel, 'findOneAndUpdate').mockImplementation((filter?: any) => {
      expect(filter.username).toBeDefined();
      const query: any = {};
      query.select = jest
        .fn()
        .mockReturnValue(Promise.resolve({ ...safeUpdatedUser, graduationYear }));
      return query;
    });

    const result = await updateUser(user.username, gradYearUpdates);

    if ('username' in result) {
      expect(result.graduationYear).toEqual(graduationYear);
    } else {
      throw new Error('Expected a safe user, got an error object.');
    }
  });

  it('should update coopInterests field', async () => {
    const coopInterests = 'Searching for co-op';
    const coopUpdates: Partial<User> = { coopInterests };
    jest.spyOn(UserModel, 'findOneAndUpdate').mockImplementation((filter?: any) => {
      expect(filter.username).toBeDefined();
      const query: any = {};
      query.select = jest
        .fn()
        .mockReturnValue(Promise.resolve({ ...safeUpdatedUser, coopInterests }));
      return query;
    });

    const result = await updateUser(user.username, coopUpdates);

    if ('username' in result) {
      expect(result.coopInterests).toEqual(coopInterests);
    } else {
      throw new Error('Expected a safe user, got an error object.');
    }
  });

  it('should update showStats field', async () => {
    const showStats = false;
    const showStatsUpdates: Partial<User> = { showStats };
    jest.spyOn(UserModel, 'findOneAndUpdate').mockImplementation((filter?: any) => {
      expect(filter.username).toBeDefined();
      const query: any = {};
      query.select = jest.fn().mockReturnValue(Promise.resolve({ ...safeUpdatedUser, showStats }));
      return query;
    });

    const result = await updateUser(user.username, showStatsUpdates);

    if ('username' in result) {
      expect(result.showStats).toEqual(false);
    } else {
      throw new Error('Expected a safe user, got an error object.');
    }
  });

  it('should update points field', async () => {
    const points = 100;
    const pointsUpdates: Partial<User> = { points };
    jest.spyOn(UserModel, 'findOneAndUpdate').mockImplementation((filter?: any) => {
      expect(filter.username).toBeDefined();
      const query: any = {};
      query.select = jest.fn().mockReturnValue(Promise.resolve({ ...safeUpdatedUser, points }));
      return query;
    });

    const result = await updateUser(user.username, pointsUpdates);

    if ('username' in result) {
      expect(result.points).toEqual(100);
    } else {
      throw new Error('Expected a safe user, got an error object.');
    }
  });

  it('should update badges field', async () => {
    const badges = [{ type: 'achievement', name: 'First Post', earnedAt: new Date() }];
    const badgesUpdates: Partial<User> = { badges };
    jest.spyOn(UserModel, 'findOneAndUpdate').mockImplementation((filter?: any) => {
      expect(filter.username).toBeDefined();
      const query: any = {};
      query.select = jest.fn().mockReturnValue(Promise.resolve({ ...safeUpdatedUser, badges }));
      return query;
    });

    const result = await updateUser(user.username, badgesUpdates);

    if ('username' in result) {
      expect(result.badges).toEqual(badges);
    } else {
      throw new Error('Expected a safe user, got an error object.');
    }
  });
});

describe('searchUsers', () => {
  const mockUser1: SafeDatabaseUser = {
    _id: new mongoose.Types.ObjectId(),
    username: 'user1',
    firstName: 'John',
    lastName: 'Doe',
    dateJoined: new Date(),
    careerGoals: 'data science, machine learning',
    technicalInterests: 'python, tensorflow',
  };

  const mockUser2: SafeDatabaseUser = {
    _id: new mongoose.Types.ObjectId(),
    username: 'user2',
    firstName: 'Jane',
    lastName: 'Smith',
    dateJoined: new Date(),
    careerGoals: 'finance, product management',
    technicalInterests: 'excel, sql',
  };

  const mockWorkExperience = {
    company: 'Tech Corp',
    title: 'Software Engineer',
    type: 'Full-time',
  };

  const mockCommunity = {
    _id: new mongoose.Types.ObjectId(),
    name: 'AI Enthusiasts',
    participants: ['user1'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should search users by career goals', async () => {
    const mockFind = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockUser1]),
      }),
    });
    (UserModel.find as jest.Mock) = mockFind;

    jest.spyOn(WorkExperienceModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    } as any);

    jest.spyOn(CommunityModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    } as any);

    const result = await searchUsers('', { careerGoals: 'data science' });

    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({
        careerGoals: expect.objectContaining({
          $regex: expect.any(String),
          $options: 'i',
        }),
      }),
    );

    if (!('error' in result)) {
      expect(result).toHaveLength(1);
      expect(result[0].username).toBe('user1');
    } else {
      throw new Error('Expected users array, got error');
    }
  });

  it('should search users by technical interests', async () => {
    const mockFind = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockUser1]),
      }),
    });
    (UserModel.find as jest.Mock) = mockFind;

    jest.spyOn(WorkExperienceModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    } as any);

    jest.spyOn(CommunityModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    } as any);

    const result = await searchUsers('', { technicalInterests: 'python' });

    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({
        technicalInterests: expect.objectContaining({
          $regex: expect.any(String),
          $options: 'i',
        }),
      }),
    );

    if (!('error' in result)) {
      expect(result).toHaveLength(1);
      expect(result[0].username).toBe('user1');
    } else {
      throw new Error('Expected users array, got error');
    }
  });

  it('should search users by multiple career goals (comma-separated)', async () => {
    const mockFind = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockUser1, mockUser2]),
      }),
    });
    (UserModel.find as jest.Mock) = mockFind;

    jest.spyOn(WorkExperienceModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    } as any);

    jest.spyOn(CommunityModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    } as any);

    const result = await searchUsers('', { careerGoals: 'data science, finance' });

    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({
        careerGoals: expect.objectContaining({
          $regex: expect.stringContaining('|'),
          $options: 'i',
        }),
      }),
    );

    if (!('error' in result)) {
      expect(result.length).toBeGreaterThanOrEqual(1);
    } else {
      throw new Error('Expected users array, got error');
    }
  });

  it('should handle career goals with special regex characters', async () => {
    const mockFind = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });
    (UserModel.find as jest.Mock) = mockFind;

    jest.spyOn(WorkExperienceModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    } as any);

    jest.spyOn(CommunityModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    } as any);

    const result = await searchUsers('', { careerGoals: 'C++ programming' });

    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({
        careerGoals: expect.objectContaining({
          $regex: expect.any(String),
          $options: 'i',
        }),
      }),
    );

    if (!('error' in result)) {
      expect(result).toEqual([]);
    } else {
      throw new Error('Expected users array, got error');
    }
  });

  it('should trim whitespace from career goals filters', async () => {
    const mockFind = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockUser1]),
      }),
    });
    (UserModel.find as jest.Mock) = mockFind;

    jest.spyOn(WorkExperienceModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    } as any);

    jest.spyOn(CommunityModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    } as any);

    const result = await searchUsers('', { careerGoals: '  data science  ,  finance  ' });

    if (!('error' in result)) {
      expect(mockFind).toHaveBeenCalled();
    } else {
      throw new Error('Expected users array, got error');
    }
  });

  it('should ignore empty career goals after trimming', async () => {
    const mockFind = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockUser1, mockUser2]),
      }),
    });
    (UserModel.find as jest.Mock) = mockFind;

    jest.spyOn(WorkExperienceModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    } as any);

    jest.spyOn(CommunityModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    } as any);

    const result = await searchUsers('', { careerGoals: ',,,data science,,,,' });

    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({
        careerGoals: expect.objectContaining({
          $regex: expect.any(String),
        }),
      }),
    );

    if (!('error' in result)) {
      expect(result.length).toBeGreaterThanOrEqual(0);
    } else {
      throw new Error('Expected users array, got error');
    }
  });

  it('should search by both career goals and technical interests', async () => {
    const mockFind = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockUser1]),
      }),
    });
    (UserModel.find as jest.Mock) = mockFind;

    jest.spyOn(WorkExperienceModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    } as any);

    jest.spyOn(CommunityModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    } as any);

    const result = await searchUsers('', {
      careerGoals: 'data science',
      technicalInterests: 'python',
    });

    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({
        careerGoals: expect.any(Object),
        technicalInterests: expect.any(Object),
      }),
    );

    if (!('error' in result)) {
      expect(result).toHaveLength(1);
    } else {
      throw new Error('Expected users array, got error');
    }
  });

  it('should combine career goals filter with major filter', async () => {
    const mockFind = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockUser1]),
      }),
    });
    (UserModel.find as jest.Mock) = mockFind;

    jest.spyOn(WorkExperienceModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    } as any);

    jest.spyOn(CommunityModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    } as any);

    const result = await searchUsers('', {
      major: 'Computer Science',
      careerGoals: 'data science',
    });

    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({
        major: 'Computer Science',
        careerGoals: expect.any(Object),
      }),
    );

    if (!('error' in result)) {
      expect(result).toHaveLength(1);
    } else {
      throw new Error('Expected users array, got error');
    }
  });

  it('should combine career goals filter with graduation year filter', async () => {
    const mockFind = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockUser1]),
      }),
    });
    (UserModel.find as jest.Mock) = mockFind;

    jest.spyOn(WorkExperienceModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    } as any);

    jest.spyOn(CommunityModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    } as any);

    const result = await searchUsers('', {
      graduationYear: 2025,
      careerGoals: 'data science',
    });

    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({
        graduationYear: 2025,
        careerGoals: expect.any(Object),
      }),
    );

    if (!('error' in result)) {
      expect(result).toHaveLength(1);
    } else {
      throw new Error('Expected users array, got error');
    }
  });

  it('should enrich users with work experiences and communities', async () => {
    const mockFind = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockUser1]),
      }),
    });
    (UserModel.find as jest.Mock) = mockFind;

    jest.spyOn(WorkExperienceModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockWorkExperience]),
      }),
    } as any);

    jest.spyOn(CommunityModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockCommunity]),
      }),
    } as any);

    const result = await searchUsers('', { careerGoals: 'data science' });

    if (!('error' in result)) {
      expect(result).toHaveLength(1);
      expect(result[0].workExperiences).toBeDefined();
      expect(result[0].communities).toBeDefined();
      expect(result[0].workExperiences).toHaveLength(1);
      expect(result[0].communities).toHaveLength(1);
    } else {
      throw new Error('Expected users array, got error');
    }
  });

  it('should return error when database query fails', async () => {
    const mockFind = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('Database error')),
      }),
    });
    (UserModel.find as jest.Mock) = mockFind;

    const result = await searchUsers('', { careerGoals: 'data science' });

    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('Failed to search users');
    }
  });

  it('should handle empty career goals string (no filter applied)', async () => {
    const mockFind = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockUser1, mockUser2]),
      }),
    });
    (UserModel.find as jest.Mock) = mockFind;

    jest.spyOn(WorkExperienceModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    } as any);

    jest.spyOn(CommunityModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    } as any);

    const result = await searchUsers('', { careerGoals: '' });

    // Should not add careerGoals to query if empty
    expect(mockFind).toHaveBeenCalledWith(
      expect.not.objectContaining({
        careerGoals: expect.anything(),
      }),
    );

    if (!('error' in result)) {
      expect(result.length).toBe(2);
    } else {
      throw new Error('Expected users array, got error');
    }
  });

  it('should handle only whitespace in technical interests', async () => {
    const mockFind = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockUser1, mockUser2]),
      }),
    });
    (UserModel.find as jest.Mock) = mockFind;

    jest.spyOn(WorkExperienceModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    } as any);

    jest.spyOn(CommunityModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    } as any);

    const result = await searchUsers('', { technicalInterests: '   ,  ,  ' });

    // Should not add technicalInterests to query if only whitespace
    expect(mockFind).toHaveBeenCalledWith(
      expect.not.objectContaining({
        technicalInterests: expect.anything(),
      }),
    );

    if (!('error' in result)) {
      expect(result.length).toBe(2);
    } else {
      throw new Error('Expected users array, got error');
    }
  });

  it('should search users by name in search query', async () => {
    const mockFind = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockUser1]),
      }),
    });
    (UserModel.find as jest.Mock) = mockFind;

    jest.spyOn(WorkExperienceModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    } as any);

    jest.spyOn(CommunityModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    } as any);

    const result = await searchUsers('John', {});

    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({
        $or: expect.arrayContaining([
          expect.objectContaining({ firstName: expect.any(Object) }),
          expect.objectContaining({ lastName: expect.any(Object) }),
          expect.objectContaining({ username: expect.any(Object) }),
        ]),
      }),
    );

    if (!('error' in result)) {
      expect(result).toHaveLength(1);
    } else {
      throw new Error('Expected users array, got error');
    }
  });

  it('should filter users by community', async () => {
    const mockFind = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockUser1, mockUser2]),
      }),
    });
    (UserModel.find as jest.Mock) = mockFind;

    jest.spyOn(CommunityModel, 'findById').mockResolvedValue(mockCommunity as any);

    jest.spyOn(WorkExperienceModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    } as any);

    jest.spyOn(CommunityModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    } as any);

    const result = await searchUsers('', { communityId: mockCommunity._id.toString() });

    if (!('error' in result)) {
      expect(result).toHaveLength(1);
      expect(result[0].username).toBe('user1');
    } else {
      throw new Error('Expected users array, got error');
    }
  });

  it('should handle non-existent community filter', async () => {
    const mockFind = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockUser1, mockUser2]),
      }),
    });
    (UserModel.find as jest.Mock) = mockFind;

    jest.spyOn(CommunityModel, 'findById').mockResolvedValue(null);

    jest.spyOn(WorkExperienceModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    } as any);

    jest.spyOn(CommunityModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    } as any);

    const result = await searchUsers('', { communityId: 'nonexistent-id' });

    if (!('error' in result)) {
      // Should return all users since community wasn't found
      expect(result.length).toBe(2);
    } else {
      throw new Error('Expected users array, got error');
    }
  });

  it('should search by work experience company', async () => {
    const mockUserFind = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });
    (UserModel.find as jest.Mock) = mockUserFind;

    jest.spyOn(WorkExperienceModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([{ username: 'user1' }]),
      }),
    } as any);

    mockUserFind
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([mockUser1]),
        }),
      });

    jest.spyOn(CommunityModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    } as any);

    const result = await searchUsers('Tech Corp', {});

    if (!('error' in result)) {
      expect(result).toHaveLength(1);
    } else {
      throw new Error('Expected users array, got error');
    }
  });

  it('should merge users from name search and work experience search', async () => {
    const mockUserFind = jest.fn();

    // First call: name search returns user2
    mockUserFind.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockUser2]),
      }),
    });

    // Second call: work experience search returns user1
    mockUserFind.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockUser1]),
      }),
    });

    (UserModel.find as jest.Mock) = mockUserFind;

    jest.spyOn(WorkExperienceModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([{ username: 'user1' }]),
      }),
    } as any);

    jest.spyOn(CommunityModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    } as any);

    const result = await searchUsers('search', {});

    if (!('error' in result)) {
      expect(result.length).toBeGreaterThanOrEqual(1);
    } else {
      throw new Error('Expected users array, got error');
    }
  });

  it('should not duplicate users when merging work experience results', async () => {
    const mockUserFind = jest.fn();

    // First call: name search returns user1
    mockUserFind.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockUser1]),
      }),
    });

    // Second call: work experience search also returns user1
    mockUserFind.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockUser1]),
      }),
    });

    (UserModel.find as jest.Mock) = mockUserFind;

    jest.spyOn(WorkExperienceModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([{ username: 'user1' }]),
      }),
    } as any);

    jest.spyOn(CommunityModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    } as any);

    const result = await searchUsers('search', {});

    if (!('error' in result)) {
      // Should only have user1 once
      expect(result).toHaveLength(1);
      expect(result[0].username).toBe('user1');
    } else {
      throw new Error('Expected users array, got error');
    }
  });
});

describe('getUniqueMajors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return sorted list of unique majors', async () => {
    jest.spyOn(UserModel, 'distinct').mockResolvedValue(['Computer Science', 'Biology', 'Art']);

    const result = await getUniqueMajors();

    expect(UserModel.distinct).toHaveBeenCalledWith('major');
    expect(result).toEqual(['Art', 'Biology', 'Computer Science']);
  });

  it('should filter out empty and whitespace majors', async () => {
    jest.spyOn(UserModel, 'distinct').mockResolvedValue(['Computer Science', '', '   ', 'Biology']);

    const result = await getUniqueMajors();

    expect(result).toEqual(['Biology', 'Computer Science']);
  });

  it('should return empty array on error', async () => {
    jest.spyOn(UserModel, 'distinct').mockRejectedValue(new Error('Database error'));

    const result = await getUniqueMajors();

    expect(result).toEqual([]);
  });

  it('should handle null values', async () => {
    jest.spyOn(UserModel, 'distinct').mockResolvedValue(['Computer Science', null, 'Biology']);

    const result = await getUniqueMajors();

    expect(result).toEqual(['Biology', 'Computer Science']);
  });
});
describe('getUniqueGraduationYears', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return sorted list of unique graduation years', async () => {
    jest.spyOn(UserModel, 'distinct').mockResolvedValue([2025, 2024, 2026]);

    const result = await getUniqueGraduationYears();

    expect(UserModel.distinct).toHaveBeenCalledWith('graduationYear');
    expect(result).toEqual([2024, 2025, 2026]);
  });

  it('should filter out null and zero values', async () => {
    jest.spyOn(UserModel, 'distinct').mockResolvedValue([2025, null, 0, 2024]);

    const result = await getUniqueGraduationYears();

    expect(result).toEqual([2024, 2025]);
  });

  it('should return empty array on error', async () => {
    jest.spyOn(UserModel, 'distinct').mockRejectedValue(new Error('Database error'));

    const result = await getUniqueGraduationYears();

    expect(result).toEqual([]);
  });

  it('should handle empty array', async () => {
    jest.spyOn(UserModel, 'distinct').mockResolvedValue([]);

    const result = await getUniqueGraduationYears();

    expect(result).toEqual([]);
  });
});

describe('getOnlineUsers', () => {
  const mockOnlineUser1: SafeDatabaseUser = {
    _id: new mongoose.Types.ObjectId(),
    username: 'user1',
    firstName: 'John',
    lastName: 'Doe',
    dateJoined: new Date(),
    isOnline: true,
  };

  const mockOnlineUser2: SafeDatabaseUser = {
    _id: new mongoose.Types.ObjectId(),
    username: 'user2',
    firstName: 'Jane',
    lastName: 'Smith',
    dateJoined: new Date(),
    isOnline: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all online users', async () => {
    jest.spyOn(UserModel, 'find').mockReturnValue({
      select: jest.fn().mockResolvedValue([mockOnlineUser1, mockOnlineUser2]),
    } as any);

    const result = await getOnlineUsers();

    expect(UserModel.find).toHaveBeenCalledWith({ isOnline: true });
    if (!('error' in result)) {
      expect(result).toHaveLength(2);
      expect(result[0].isOnline).toBe(true);
      expect(result[1].isOnline).toBe(true);
    } else {
      throw new Error('Expected users array, got error');
    }
  });

  it('should return empty array when no users are online', async () => {
    jest.spyOn(UserModel, 'find').mockReturnValue({
      select: jest.fn().mockResolvedValue([]),
    } as any);

    const result = await getOnlineUsers();

    if (!('error' in result)) {
      expect(result).toEqual([]);
    } else {
      throw new Error('Expected users array, got error');
    }
  });

  it('should return error when query returns null', async () => {
    jest.spyOn(UserModel, 'find').mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    } as any);

    const result = await getOnlineUsers();

    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('Could not retrieve users online');
    }
  });

  it('should return error when database error occurs', async () => {
    jest.spyOn(UserModel, 'find').mockReturnValue({
      select: jest.fn().mockRejectedValue(new Error('Database error')),
    } as any);

    const result = await getOnlineUsers();

    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('Error occurred when finding online users');
    }
  });
});
describe('getLeaderboard', () => {
  const mockLeaderUser1: SafeDatabaseUser = {
    _id: new mongoose.Types.ObjectId(),
    username: 'topuser',
    firstName: 'Top',
    lastName: 'User',
    dateJoined: new Date(),
    points: 500,
  };

  const mockLeaderUser2: SafeDatabaseUser = {
    _id: new mongoose.Types.ObjectId(),
    username: 'seconduser',
    firstName: 'Second',
    lastName: 'User',
    dateJoined: new Date(),
    points: 300,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return top users sorted by points', async () => {
    const mockSort = jest.fn().mockReturnThis();
    const mockLimit = jest.fn().mockResolvedValue([mockLeaderUser1, mockLeaderUser2]);

    jest.spyOn(UserModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnThis(),
      sort: mockSort,
      limit: mockLimit,
    } as any);

    const result = await getLeaderboard(20);

    expect(mockSort).toHaveBeenCalledWith({ points: -1 });
    expect(mockLimit).toHaveBeenCalledWith(20);

    if (!('error' in result)) {
      expect(result).toHaveLength(2);
      expect(result[0].points).toBe(500);
      expect(result[1].points).toBe(300);
    } else {
      throw new Error('Expected users array, got error');
    }
  });

  it('should use default limit of 20 when not specified', async () => {
    const mockSort = jest.fn().mockReturnThis();
    const mockLimit = jest.fn().mockResolvedValue([]);

    jest.spyOn(UserModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnThis(),
      sort: mockSort,
      limit: mockLimit,
    } as any);

    await getLeaderboard();

    expect(mockLimit).toHaveBeenCalledWith(20);
  });

  it('should return error when query returns null', async () => {
    const mockSort = jest.fn().mockReturnThis();
    const mockLimit = jest.fn().mockResolvedValue(null);

    jest.spyOn(UserModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnThis(),
      sort: mockSort,
      limit: mockLimit,
    } as any);

    const result = await getLeaderboard();

    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('Could not retrieve leaderboard');
    }
  });

  it('should return error when database error occurs', async () => {
    const mockSort = jest.fn().mockReturnThis();
    const mockLimit = jest.fn().mockRejectedValue(new Error('Database error'));

    jest.spyOn(UserModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnThis(),
      sort: mockSort,
      limit: mockLimit,
    } as any);

    const result = await getLeaderboard();

    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('Error occurred when fetching leaderboard');
    }
  });

  it('should handle custom limit parameter', async () => {
    const mockSort = jest.fn().mockReturnThis();
    const mockLimit = jest.fn().mockResolvedValue([mockLeaderUser1]);

    jest.spyOn(UserModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnThis(),
      sort: mockSort,
      limit: mockLimit,
    } as any);

    await getLeaderboard(10);

    expect(mockLimit).toHaveBeenCalledWith(10);
  });

  it('should return empty array when no users have points', async () => {
    const mockSort = jest.fn().mockReturnThis();
    const mockLimit = jest.fn().mockResolvedValue([]);

    jest.spyOn(UserModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnThis(),
      sort: mockSort,
      limit: mockLimit,
    } as any);

    const result = await getLeaderboard();

    if (!('error' in result)) {
      expect(result).toEqual([]);
    } else {
      throw new Error('Expected users array, got error');
    }
  });
});

describe('saveUser - password validation', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return error for password without uppercase letter', async () => {
    const invalidUser = {
      ...user,
      password: 'password123!',
    };

    const result = await saveUser(invalidUser);

    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('Password must be at least 8 characters long');
      expect(result.error).toContain('uppercase');
    }
  });

  it('should return error for password without lowercase letter', async () => {
    const invalidUser = {
      ...user,
      password: 'PASSWORD123!',
    };

    const result = await saveUser(invalidUser);

    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('lowercase');
    }
  });

  it('should return error for password without number', async () => {
    const invalidUser = {
      ...user,
      password: 'Password!',
    };

    const result = await saveUser(invalidUser);

    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('number');
    }
  });

  it('should return error for password without special character', async () => {
    const invalidUser = {
      ...user,
      password: 'Password123',
    };

    const result = await saveUser(invalidUser);

    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('special character');
    }
  });

  it('should return error for password shorter than 8 characters', async () => {
    const invalidUser = {
      ...user,
      password: 'Pass1!',
    };

    const result = await saveUser(invalidUser);

    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('at least 8 characters');
    }
  });
});

describe('searchUsers - work experience by title', () => {
  const mockUser1: SafeDatabaseUser = {
    _id: new mongoose.Types.ObjectId(),
    username: 'user1',
    firstName: 'John',
    lastName: 'Doe',
    dateJoined: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should search by work experience title', async () => {
    const mockUserFind = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });
    (UserModel.find as jest.Mock) = mockUserFind;

    jest.spyOn(WorkExperienceModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([{ username: 'user1', title: 'Software Engineer' }]),
      }),
    } as any);

    mockUserFind
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([mockUser1]),
        }),
      });

    jest.spyOn(CommunityModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    } as any);

    const result = await searchUsers('Software Engineer', {});

    expect(WorkExperienceModel.find).toHaveBeenCalledWith({
      $or: [
        { company: { $regex: 'Software Engineer', $options: 'i' } },
        { title: { $regex: 'Software Engineer', $options: 'i' } },
      ],
    });

    if (!('error' in result)) {
      expect(result).toHaveLength(1);
      expect(result[0].username).toBe('user1');
    } else {
      throw new Error('Expected users array, got error');
    }
  });

  it('should search by both company and title in work experience', async () => {
    const mockUserFind = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });
    (UserModel.find as jest.Mock) = mockUserFind;

    jest.spyOn(WorkExperienceModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest
          .fn()
          .mockResolvedValue([{ username: 'user1', company: 'Tech Corp', title: 'Engineer' }]),
      }),
    } as any);

    mockUserFind
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([mockUser1]),
        }),
      });

    jest.spyOn(CommunityModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    } as any);

    const result = await searchUsers('Engineer', {});

    if (!('error' in result)) {
      expect(result).toHaveLength(1);
    } else {
      throw new Error('Expected users array, got error');
    }
  });
});

describe('searchUsers - enrichment error handling', () => {
  const mockUser1: SafeDatabaseUser = {
    _id: new mongoose.Types.ObjectId(),
    username: 'user1',
    firstName: 'John',
    lastName: 'Doe',
    dateJoined: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle error when enriching with work experiences fails', async () => {
    const mockFind = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockUser1]),
      }),
    });
    (UserModel.find as jest.Mock) = mockFind;

    jest.spyOn(WorkExperienceModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('WorkExperience query failed')),
      }),
    } as any);

    const result = await searchUsers('', {});

    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('Failed to search users');
    }
  });

  it('should handle error when enriching with communities fails', async () => {
    const mockFind = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockUser1]),
      }),
    });
    (UserModel.find as jest.Mock) = mockFind;

    jest.spyOn(WorkExperienceModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    } as any);

    jest.spyOn(CommunityModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('Community query failed')),
      }),
    } as any);

    const result = await searchUsers('', {});

    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('Failed to search users');
    }
  });
});

describe('loginUser - wrong password', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return error when password is incorrect', async () => {
    const hashedPassword = await bcryptjs.hash('CorrectPassword123!', 10);

    jest.spyOn(UserModel, 'findOne').mockResolvedValue({
      ...safeUser,
      password: hashedPassword,
    });

    const credentials: UserLogin = {
      username: user.username,
      password: 'WrongPassword123!',
    };

    const loginError = await loginUser(credentials);

    expect('error' in loginError).toBe(true);
    if ('error' in loginError) {
      expect(loginError.error).toBe('Invalid username or password');
    }
  });

  it('should not reveal whether username or password was wrong', async () => {
    const hashedPassword = await bcryptjs.hash('CorrectPassword123!', 10);

    jest.spyOn(UserModel, 'findOne').mockResolvedValue({
      ...safeUser,
      password: hashedPassword,
    });

    const wrongPasswordCredentials: UserLogin = {
      username: user.username,
      password: 'WrongPassword123!',
    };

    const wrongUsernameCredentials: UserLogin = {
      username: 'nonexistentuser',
      password: user.password,
    };

    // Mock for wrong username
    jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(null);
    const usernameError = await loginUser(wrongUsernameCredentials);

    // Mock for wrong password
    jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce({
      ...safeUser,
      password: hashedPassword,
    });
    const passwordError = await loginUser(wrongPasswordCredentials);

    // Both should return the same error message
    expect('error' in usernameError).toBe(true);
    expect('error' in passwordError).toBe(true);
    if ('error' in usernameError && 'error' in passwordError) {
      expect(usernameError.error).toBe(passwordError.error);
      expect(usernameError.error).toBe('Invalid username or password');
    }
  });
});
describe('getUsersList - errors', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return error when find returns null', async () => {
    jest.spyOn(UserModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    } as any);

    const getUsersError = await getUsersList();

    expect('error' in getUsersError).toBe(true);
    if ('error' in getUsersError) {
      expect(getUsersError.error).toContain('Users could not be retrieved');
    }
  });

  it('should return error when find returns undefined', async () => {
    jest.spyOn(UserModel, 'find').mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(undefined),
    } as any);

    const getUsersError = await getUsersList();

    expect('error' in getUsersError).toBe(true);
    if ('error' in getUsersError) {
      expect(getUsersError.error).toContain('Users could not be retrieved');
    }
  });
});
