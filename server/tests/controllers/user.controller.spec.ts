import supertest from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import * as util from '../../services/user.service';
import { SafeDatabaseUser, User } from '../../types/types';
import CommunityModel from '../../models/community.model';
import WorkExperienceModel from '../../models/workExperience.model';
import QuestionModel from '../../models/questions.model';
import AnswerModel from '../../models/answers.model';
import GameModel from '../../models/games.model';
import * as badgeService from '../../services/badge.service';

// mock jwt auth to always authenticate successfully
jest.mock('../../middleware/auth', () => ({
  __esModule: true,
  default: (req: any, res: any, next: any) => {
    req.user = { userId: 'test-user-id', username: 'user1' };
    next();
  },
}));

const mockUser: User = {
  username: 'user1',
  password: 'password',
  firstName: 'John',
  lastName: 'Doe',
  dateJoined: new Date('2024-12-03'),
};

const mockSafeUser: SafeDatabaseUser = {
  _id: new mongoose.Types.ObjectId(),
  username: 'user1',
  dateJoined: new Date('2024-12-03'),
  firstName: 'John',
  lastName: 'Doe',
};

const mockUserJSONResponse = {
  _id: mockSafeUser._id.toString(),
  username: 'user1',
  firstName: 'John',
  lastName: 'Doe',
  dateJoined: new Date('2024-12-03').toISOString(),
};

const saveUserSpy = jest.spyOn(util, 'saveUser');
const loginUserSpy = jest.spyOn(util, 'loginUser');
const updatedUserSpy = jest.spyOn(util, 'updateUser');
const getUserByUsernameSpy = jest.spyOn(util, 'getUserByUsername');
const getUsersListSpy = jest.spyOn(util, 'getUsersList');
const deleteUserByUsernameSpy = jest.spyOn(util, 'deleteUserByUsername');

describe('Test userController', () => {
  describe('POST /signup', () => {
    it('should successfully create user with email provided', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: mockUser.password,
        email: 'test@northeastern.edu',
      };

      const mockSafeUserWithEmail = {
        ...mockSafeUser,
        email: 'test@northeastern.edu',
      };

      saveUserSpy.mockResolvedValueOnce(mockSafeUserWithEmail);

      const response = await supertest(app).post('/api/user/signup').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('test@northeastern.edu');
      expect(saveUserSpy).toHaveBeenCalledWith({
        ...mockReqBody,
        biography: '',
        dateJoined: expect.any(Date),
      });
    });

    it('should handle non-Error objects in catch block', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: mockUser.password,
      };

      saveUserSpy.mockRejectedValueOnce('String error');

      const response = await supertest(app).post('/api/user/signup').send(mockReqBody);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error when saving user: String error');
    });

    it('should return 500 for duplicate email registration', async () => {
      const mockReqBody = {
        username: 'newuser',
        password: mockUser.password,
        email: 'existing@northeastern.edu',
      };

      saveUserSpy.mockResolvedValueOnce({ error: 'Email already in use' });

      const response = await supertest(app).post('/api/user/signup').send(mockReqBody);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Email already in use');
    });
    it('should create a new user given correct arguments', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: mockUser.password,
        biography: 'This is a test biography',
      };

      saveUserSpy.mockResolvedValueOnce({ ...mockSafeUser, biography: mockReqBody.biography });

      const response = await supertest(app).post('/api/user/signup').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body.user).toEqual({
        ...mockUserJSONResponse,
        biography: mockReqBody.biography,
      });
      expect(response.body.token).toBeDefined();
      expect(saveUserSpy).toHaveBeenCalledWith({
        ...mockReqBody,
        biography: mockReqBody.biography,
        dateJoined: expect.any(Date),
      });
    });

    // Note: Testing biography ?? '' branch is difficult because OpenAPI validation
    // may require biography field. The branch coverage for this line may be
    // achieved through other means or may be considered edge case coverage.

    it('should return hasSeenWelcomeMessage as false for new users', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: mockUser.password,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
      };

      saveUserSpy.mockResolvedValueOnce({ ...mockSafeUser, hasSeenWelcomeMessage: false });

      const response = await supertest(app).post('/api/user/signup').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body.user.hasSeenWelcomeMessage).toBe(false);
    });

    it('should return 400 for request missing username', async () => {
      const mockReqBody = {
        password: mockUser.password,
      };

      const response = await supertest(app).post('/api/user/signup').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/username');
    });

    it('should return 400 for request with empty username', async () => {
      const mockReqBody = {
        username: '',
        password: mockUser.password,
      };

      const response = await supertest(app).post('/api/user/signup').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/username');
    });

    it('should return 400 for request missing password', async () => {
      const mockReqBody = {
        username: mockUser.username,
      };

      const response = await supertest(app).post('/api/user/signup').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/password');
    });

    it('should return 400 for request with empty password', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: '',
      };

      const response = await supertest(app).post('/api/user/signup').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/password');
    });

    it('should return 500 for a database error while saving', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: mockUser.password,
      };

      saveUserSpy.mockResolvedValueOnce({ error: 'Error saving user' });

      const response = await supertest(app).post('/api/user/signup').send(mockReqBody);

      expect(response.status).toBe(500);
    });
  });

  describe('POST /login', () => {
    it('should succesfully login for a user given correct arguments', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: mockUser.password,
      };

      loginUserSpy.mockResolvedValueOnce(mockSafeUser);

      const response = await supertest(app).post('/api/user/login').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body.user).toEqual(mockUserJSONResponse);
      expect(loginUserSpy).toHaveBeenCalledWith(mockReqBody);
    });

    it('should handle non-Error objects in catch block', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: mockUser.password,
      };

      loginUserSpy.mockRejectedValueOnce('String error');

      const response = await supertest(app).post('/api/user/login').send(mockReqBody);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Login failed');
    });

    it('should return 400 for request missing username', async () => {
      const mockReqBody = {
        password: mockUser.password,
      };

      const response = await supertest(app).post('/api/user/login').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/username');
    });

    it('should return 400 for request with empty username', async () => {
      const mockReqBody = {
        username: '',
        password: mockUser.password,
      };

      const response = await supertest(app).post('/api/user/login').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/username');
    });

    it('should return 400 for request missing password', async () => {
      const mockReqBody = {
        username: mockUser.username,
      };

      const response = await supertest(app).post('/api/user/login').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/password');
    });

    it('should return 400 for request with empty password', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: '',
      };

      const response = await supertest(app).post('/api/user/login').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/password');
    });

    it('should return 500 for a database error while saving', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: mockUser.password,
      };

      loginUserSpy.mockResolvedValueOnce({ error: 'Error authenticating user' });

      const response = await supertest(app).post('/api/user/login').send(mockReqBody);

      expect(response.status).toBe(500);
    });
  });

  describe('POST /resetPassword', () => {
    it('should succesfully return updated user object given correct arguments', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: 'newPassword',
      };

      updatedUserSpy.mockResolvedValueOnce(mockSafeUser);

      const response = await supertest(app).patch('/api/user/resetPassword').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ...mockUserJSONResponse });
      expect(updatedUserSpy).toHaveBeenCalledWith(mockUser.username, { password: 'newPassword' });
    });

    it('should return 400 for request missing username', async () => {
      const mockReqBody = {
        password: 'newPassword',
      };

      const response = await supertest(app).patch('/api/user/resetPassword').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/username');
    });

    it('should return 400 for request with empty username', async () => {
      const mockReqBody = {
        username: '',
        password: 'newPassword',
      };

      const response = await supertest(app).patch('/api/user/resetPassword').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/username');
    });

    it('should return 400 for request missing password', async () => {
      const mockReqBody = {
        username: mockUser.username,
      };

      const response = await supertest(app).patch('/api/user/resetPassword').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/password');
    });

    it('should return 400 for request with empty password', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: '',
      };

      const response = await supertest(app).patch('/api/user/resetPassword').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/password');
    });

    it('should return 500 for a database error while updating', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: 'newPassword',
      };

      updatedUserSpy.mockResolvedValueOnce({ error: 'Error updating user' });

      const response = await supertest(app).patch('/api/user/resetPassword').send(mockReqBody);

      expect(response.status).toBe(500);
    });
  });

  describe('GET /getUser', () => {
    it('should return the user given correct arguments', async () => {
      getUserByUsernameSpy.mockResolvedValueOnce(mockSafeUser);

      const response = await supertest(app).get(`/api/user/getUser/${mockUser.username}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUserJSONResponse);
      expect(getUserByUsernameSpy).toHaveBeenCalledWith(mockUser.username);
    });

    it('should handle users with null work experiences', async () => {
      getUsersListSpy.mockResolvedValueOnce([mockSafeUser]);

      jest.spyOn(WorkExperienceModel, 'find').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null), // Return null instead of empty array
      } as any);

      jest.spyOn(CommunityModel, 'find').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      } as any);

      const response = await supertest(app).get('/api/user/getUsers');

      expect(response.status).toBe(200);
      expect(response.body[0].workExperiences).toEqual([]);
    });

    it('should handle users with null communities', async () => {
      getUsersListSpy.mockResolvedValueOnce([mockSafeUser]);

      jest.spyOn(WorkExperienceModel, 'find').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      } as any);

      jest.spyOn(CommunityModel, 'find').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null), // Return null instead of empty array
      } as any);

      const response = await supertest(app).get('/api/user/getUsers');

      expect(response.status).toBe(200);
      expect(response.body[0].communities).toEqual([]);
    });

    it('should return 500 if database error while searching username', async () => {
      getUserByUsernameSpy.mockResolvedValueOnce({ error: 'Error finding user' });

      const response = await supertest(app).get(`/api/user/getUser/${mockUser.username}`);

      expect(response.status).toBe(500);
    });

    it('should return 404 if username not provided', async () => {
      // Express automatically returns 404 for missing parameters when
      // defined as required in the route
      const response = await supertest(app).get('/api/user/getUser/');
      expect(response.status).toBe(404);
    });
  });

  describe('GET /getUsers', () => {
    it('should return the users from the database', async () => {
      getUsersListSpy.mockResolvedValueOnce([mockSafeUser]);

      // Mock WorkExperience and Community queries
      jest.spyOn(WorkExperienceModel, 'find').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      } as any);

      jest.spyOn(CommunityModel, 'find').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      } as any);

      const response = await supertest(app).get(`/api/user/getUsers`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].username).toBe(mockSafeUser.username);
    });
  });

  it('should return 500 if database error while finding users', async () => {
    getUsersListSpy.mockResolvedValueOnce({ error: 'Error finding users' });

    const response = await supertest(app).get(`/api/user/getUsers`);

    expect(response.status).toBe(500);
  });
});

describe('DELETE /deleteUser', () => {
  it('should return the deleted user given correct arguments', async () => {
    deleteUserByUsernameSpy.mockResolvedValueOnce(mockSafeUser);

    const response = await supertest(app).delete(`/api/user/deleteUser/${mockUser.username}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockUserJSONResponse);
    expect(deleteUserByUsernameSpy).toHaveBeenCalledWith(mockUser.username);
  });

  it('should return 500 if database error while searching username', async () => {
    deleteUserByUsernameSpy.mockResolvedValueOnce({ error: 'Error deleting user' });

    const response = await supertest(app).delete(`/api/user/deleteUser/${mockUser.username}`);

    expect(response.status).toBe(500);
  });

  it('should return 404 if username not provided', async () => {
    // Express automatically returns 404 for missing parameters when
    // defined as required in the route
    const response = await supertest(app).delete('/api/user/deleteUser/');
    expect(response.status).toBe(404);
  });

  describe('PATCH /updateBiography', () => {
    it('should successfully update biography given correct arguments', async () => {
      const mockReqBody = {
        username: mockUser.username,
        biography: 'This is my new bio',
      };

      // Mock a successful updateUser call
      updatedUserSpy.mockResolvedValueOnce(mockSafeUser);

      const response = await supertest(app).patch('/api/user/updateBiography').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUserJSONResponse);
      // Ensure updateUser is called with the correct args
      expect(updatedUserSpy).toHaveBeenCalledWith(mockUser.username, {
        biography: 'This is my new bio',
      });
    });

    it('should return 400 for request missing username', async () => {
      const mockReqBody = {
        biography: 'some new biography',
      };

      const response = await supertest(app).patch('/api/user/updateBiography').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/username');
    });

    it('should return 400 for request with empty username', async () => {
      const mockReqBody = {
        username: '',
        biography: 'a new bio',
      };

      const response = await supertest(app).patch('/api/user/updateBiography').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/username');
    });

    it('should return 400 for request missing biography field', async () => {
      const mockReqBody = {
        username: mockUser.username,
      };

      const response = await supertest(app).patch('/api/user/updateBiography').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/biography');
    });

    it('should return 500 if updateUser returns an error', async () => {
      const mockReqBody = {
        username: mockUser.username,
        biography: 'Attempting update biography',
      };

      // Simulate a DB error
      updatedUserSpy.mockResolvedValueOnce({ error: 'Error updating user' });

      const response = await supertest(app).patch('/api/user/updateBiography').send(mockReqBody);

      expect(response.status).toBe(500);
      expect(response.text).toContain(
        'Error when updating user biography: Error: Error updating user',
      );
    });
  });

  describe('PATCH /markWelcomeSeen', () => {
    it('should successfully mark welcome message as seen', async () => {
      const updatedUser: SafeDatabaseUser = {
        ...mockSafeUser,
        hasSeenWelcomeMessage: true,
      };

      updatedUserSpy.mockResolvedValueOnce(updatedUser);

      const response = await supertest(app).patch('/api/user/markWelcomeSeen').send();

      expect(response.status).toBe(200);
      expect(response.body.hasSeenWelcomeMessage).toBe(true);
      expect(updatedUserSpy).toHaveBeenCalledWith('user1', { hasSeenWelcomeMessage: true });
    });

    it('should return 500 if updateUser returns an error', async () => {
      // Simulate a DB error
      updatedUserSpy.mockResolvedValueOnce({ error: 'Error updating user' });

      const response = await supertest(app).patch('/api/user/markWelcomeSeen').send();

      expect(response.status).toBe(500);
      expect(response.text).toContain(
        'Error when marking welcome message as seen: Error: Error updating user',
      );
    });
  });

  describe('PATCH /updateExternalLinks', () => {
    it('should successfully update external links given correct arguments', async () => {
      const mockReqBody = {
        username: mockUser.username,
        externalLinks: {
          linkedin: 'https://linkedin.com/in/testuser',
          github: 'https://github.com/testuser',
          portfolio: 'https://testuser.com',
        },
      };

      const updatedUser: SafeDatabaseUser = {
        ...mockSafeUser,
        externalLinks: mockReqBody.externalLinks,
      };

      updatedUserSpy.mockResolvedValueOnce(updatedUser);

      const response = await supertest(app)
        .patch('/api/user/updateExternalLinks')
        .send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body.externalLinks).toEqual(mockReqBody.externalLinks);
      expect(updatedUserSpy).toHaveBeenCalledWith(mockUser.username, {
        externalLinks: mockReqBody.externalLinks,
      });
    });

    it('should successfully update partial external links', async () => {
      const mockReqBody = {
        username: mockUser.username,
        externalLinks: {
          linkedin: 'https://linkedin.com/in/testuser',
        },
      };

      const updatedUser: SafeDatabaseUser = {
        ...mockSafeUser,
        externalLinks: mockReqBody.externalLinks,
      };

      updatedUserSpy.mockResolvedValueOnce(updatedUser);

      const response = await supertest(app)
        .patch('/api/user/updateExternalLinks')
        .send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body.externalLinks.linkedin).toBe(mockReqBody.externalLinks.linkedin);
      expect(updatedUserSpy).toHaveBeenCalledWith(mockUser.username, {
        externalLinks: mockReqBody.externalLinks,
      });
    });

    it('should successfully update with empty external links object', async () => {
      const mockReqBody = {
        username: mockUser.username,
        externalLinks: {},
      };

      const updatedUser: SafeDatabaseUser = {
        ...mockSafeUser,
        externalLinks: {},
      };

      updatedUserSpy.mockResolvedValueOnce(updatedUser);

      const response = await supertest(app)
        .patch('/api/user/updateExternalLinks')
        .send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body.externalLinks).toEqual({});
      expect(updatedUserSpy).toHaveBeenCalledWith(mockUser.username, {
        externalLinks: {},
      });
    });

    it('should return 400 for request missing username', async () => {
      const mockReqBody = {
        externalLinks: {
          linkedin: 'https://linkedin.com/in/testuser',
        },
      };

      const response = await supertest(app)
        .patch('/api/user/updateExternalLinks')
        .send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/username');
    });

    it('should return 400 for request with empty username', async () => {
      const mockReqBody = {
        username: '',
        externalLinks: {
          linkedin: 'https://linkedin.com/in/testuser',
        },
      };

      const response = await supertest(app)
        .patch('/api/user/updateExternalLinks')
        .send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/username');
    });

    it('should return 500 if updateUser returns an error', async () => {
      const mockReqBody = {
        username: mockUser.username,
        externalLinks: {
          linkedin: 'https://linkedin.com/in/testuser',
        },
      };

      updatedUserSpy.mockResolvedValueOnce({ error: 'Error updating user' });

      const response = await supertest(app)
        .patch('/api/user/updateExternalLinks')
        .send(mockReqBody);

      expect(response.status).toBe(500);
      expect(response.text).toContain(
        'Error when updating external links: Error: Error updating user',
      );
    });
  });
});

describe('GET /me', () => {
  it('should return the current authenticated user', async () => {
    getUserByUsernameSpy.mockResolvedValueOnce(mockSafeUser);

    const response = await supertest(app).get('/api/user/me');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockUserJSONResponse);
    expect(getUserByUsernameSpy).toHaveBeenCalledWith('user1');
  });

  it('should return 404 when user not found', async () => {
    getUserByUsernameSpy.mockResolvedValueOnce({ error: 'User not found' });

    const response = await supertest(app).get('/api/user/me');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('User not found');
  });

  it('should return 500 on unexpected error', async () => {
    getUserByUsernameSpy.mockRejectedValueOnce(new Error('Database error'));

    const response = await supertest(app).get('/api/user/me');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to get current user');
  });
});
describe('GET /stats/:username', () => {
  it('should return user statistics', async () => {
    jest.spyOn(QuestionModel, 'countDocuments').mockResolvedValue(5);
    jest.spyOn(AnswerModel, 'countDocuments').mockResolvedValue(10);
    jest.spyOn(CommunityModel, 'countDocuments').mockResolvedValue(3);
    jest.spyOn(GameModel, 'find').mockResolvedValue([
      { players: ['user1'], state: { winners: ['user1'] } },
      { players: ['user1'], state: { winners: ['user2'] } },
      { players: ['user1'], state: { winners: ['user1'] } },
    ] as any);

    const response = await supertest(app).get('/api/user/stats/user1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      questionsPosted: 5,
      answersPosted: 10,
      communitiesJoined: 3,
      quizzesWon: 2,
      quizzesPlayed: 3,
    });
  });

  it('should return 500 on database error', async () => {
    jest.spyOn(QuestionModel, 'countDocuments').mockRejectedValue(new Error('DB error'));

    const response = await supertest(app).get('/api/user/stats/user1');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to get user stats');
  });
});

describe('GET /search', () => {
  it('should search users with query and filters', async () => {
    const mockSearchResults = [mockSafeUser];
    jest.spyOn(util, 'searchUsers').mockResolvedValueOnce(mockSearchResults as any);

    const response = await supertest(app).get('/api/user/search').query({
      q: 'John',
      major: 'Computer Science',
      graduationYear: '2025',
      communityId: 'comm123',
      careerGoals: 'Software Engineer',
      technicalInterests: 'AI',
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([mockUserJSONResponse]); // Use JSON response format
  });

  it('should search without query parameters', async () => {
    const mockSearchResults = [mockSafeUser];
    jest.spyOn(util, 'searchUsers').mockResolvedValueOnce(mockSearchResults as any);

    const response = await supertest(app).get('/api/user/search');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([mockUserJSONResponse]); // Use JSON response format
  });

  it('should return 500 on search error', async () => {
    jest.spyOn(util, 'searchUsers').mockRejectedValueOnce(new Error('Search failed'));

    const response = await supertest(app).get('/api/user/search');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to search users');
  });
});

describe('GET /filter-options', () => {
  it('should return filter options', async () => {
    jest.spyOn(util, 'getUniqueMajors').mockResolvedValueOnce(['CS', 'EE'] as any);
    jest.spyOn(util, 'getUniqueGraduationYears').mockResolvedValueOnce([2024, 2025] as any);

    const response = await supertest(app).get('/api/user/filter-options');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      majors: ['CS', 'EE'],
      graduationYears: [2024, 2025],
    });
  });

  it('should return 500 on error', async () => {
    jest.spyOn(util, 'getUniqueMajors').mockRejectedValueOnce(new Error('DB error'));

    const response = await supertest(app).get('/api/user/filter-options');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to get filter options');
  });
});

describe('PATCH /updateProfile', () => {
  it('should update user profile with all fields', async () => {
    const mockReqBody = {
      username: mockUser.username,
      major: 'Computer Science',
      graduationYear: 2025,
      coopInterests: ['Software', 'AI'],
      firstName: 'Jane',
      lastName: 'Smith',
      careerGoals: 'Software Engineer',
      technicalInterests: ['AI', 'ML'],
    };

    const mockUpdatedUser: SafeDatabaseUser = {
      ...mockSafeUser,
      major: mockReqBody.major,
      graduationYear: mockReqBody.graduationYear,
      coopInterests: mockReqBody.coopInterests.join(', '), // Convert array to string
      firstName: mockReqBody.firstName,
      lastName: mockReqBody.lastName,
      careerGoals: mockReqBody.careerGoals,
      technicalInterests: mockReqBody.technicalInterests.join(', '), // Convert array to string
    };

    updatedUserSpy.mockResolvedValueOnce(mockUpdatedUser);

    const response = await supertest(app).patch('/api/user/updateProfile').send(mockReqBody);

    expect(response.status).toBe(200);
    expect(updatedUserSpy).toHaveBeenCalledWith(mockUser.username, {
      major: mockReqBody.major,
      graduationYear: mockReqBody.graduationYear,
      coopInterests: mockReqBody.coopInterests,
      firstName: mockReqBody.firstName,
      lastName: mockReqBody.lastName,
      careerGoals: mockReqBody.careerGoals,
      technicalInterests: mockReqBody.technicalInterests,
    });
  });

  it('should update user profile with partial fields', async () => {
    const mockReqBody = {
      username: mockUser.username,
      major: 'Computer Science',
    };

    const mockUpdatedUser: SafeDatabaseUser = {
      ...mockSafeUser,
      major: mockReqBody.major,
    };

    updatedUserSpy.mockResolvedValueOnce(mockUpdatedUser);

    const response = await supertest(app).patch('/api/user/updateProfile').send(mockReqBody);

    expect(response.status).toBe(200);
    expect(updatedUserSpy).toHaveBeenCalledWith(mockUser.username, {
      major: mockReqBody.major,
    });
  });

  it('should return 500 if updateUser returns an error', async () => {
    const mockReqBody = {
      username: mockUser.username,
      major: 'Computer Science',
    };

    updatedUserSpy.mockResolvedValueOnce({ error: 'Error updating user' });

    const response = await supertest(app).patch('/api/user/updateProfile').send(mockReqBody);

    expect(response.status).toBe(500);
    expect(response.text).toContain('Error when updating profile: Error: Error updating user');
  });
});

describe('PATCH /updateStatVisibility', () => {
  it('should update stat visibility successfully', async () => {
    const mockReqBody = {
      username: 'user1',
      field: 'showStats',
      value: false,
    };

    updatedUserSpy.mockResolvedValueOnce({ ...mockSafeUser, showStats: false });

    const response = await supertest(app).patch('/api/user/updateStatVisibility').send(mockReqBody);

    expect(response.status).toBe(200);
    expect(updatedUserSpy).toHaveBeenCalledWith('user1', { showStats: false });
  });

  it('should return 401 if username does not match authenticated user', async () => {
    const mockReqBody = {
      username: 'different-user',
      field: 'showStats',
      value: false,
    };

    const response = await supertest(app).patch('/api/user/updateStatVisibility').send(mockReqBody);

    expect(response.status).toBe(401);
    expect(response.text).toContain('Unauthorized');
  });

  it('should return 400 if field is invalid', async () => {
    const mockReqBody = {
      username: 'user1',
      field: 'invalidField',
      value: false,
    };

    const response = await supertest(app).patch('/api/user/updateStatVisibility').send(mockReqBody);

    expect(response.status).toBe(400);
    expect(response.text).toContain('Invalid field');
  });

  it('should return 500 if updateUser returns an error', async () => {
    const mockReqBody = {
      username: 'user1',
      field: 'showStats',
      value: false,
    };

    updatedUserSpy.mockResolvedValueOnce({ error: 'Error updating user' });

    const response = await supertest(app).patch('/api/user/updateStatVisibility').send(mockReqBody);

    expect(response.status).toBe(500);
    expect(response.text).toContain('Error updating visibility');
  });

  it('should handle Error objects in catch block', async () => {
    const mockReqBody = {
      username: 'user1',
      field: 'showStats',
      value: false,
    };

    updatedUserSpy.mockRejectedValueOnce(new Error('Database connection failed'));

    const response = await supertest(app).patch('/api/user/updateStatVisibility').send(mockReqBody);

    expect(response.status).toBe(500);
    expect(response.text).toContain('Error updating visibility: Database connection failed');
  });
});
describe('GET /leaderboard', () => {
  const checkAndAwardLeaderboardBadgesSpy = jest.spyOn(
    badgeService,
    'checkAndAwardLeaderboardBadges',
  );

  beforeEach(() => {
    checkAndAwardLeaderboardBadgesSpy.mockResolvedValue(undefined);
  });

  it('should return leaderboard with default limit', async () => {
    const mockLeaderboard = [
      { username: 'user1', points: 100 },
      { username: 'user2', points: 90 },
    ];
    jest.spyOn(util, 'getLeaderboard').mockResolvedValueOnce(mockLeaderboard as any);

    const response = await supertest(app).get('/api/user/leaderboard');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockLeaderboard);
    expect(checkAndAwardLeaderboardBadgesSpy).toHaveBeenCalledWith(mockLeaderboard);
  });

  it('should return leaderboard with custom limit', async () => {
    const mockLeaderboard = [{ username: 'user1', points: 100 }];
    jest.spyOn(util, 'getLeaderboard').mockResolvedValueOnce(mockLeaderboard as any);

    const response = await supertest(app).get('/api/user/leaderboard').query({ limit: '10' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockLeaderboard);
    expect(util.getLeaderboard).toHaveBeenCalledWith(10);
  });

  it('should return 500 if getLeaderboard returns an error', async () => {
    jest.spyOn(util, 'getLeaderboard').mockResolvedValueOnce({ error: 'Database error' } as any);

    const response = await supertest(app).get('/api/user/leaderboard');

    expect(response.status).toBe(500);
    expect(response.text).toContain('Error fetching leaderboard');
  });

  it('should return 500 on unexpected error', async () => {
    jest.spyOn(util, 'getLeaderboard').mockRejectedValueOnce(new Error('Unexpected error'));

    const response = await supertest(app).get('/api/user/leaderboard');

    expect(response.status).toBe(500);
    expect(response.text).toContain('Error fetching leaderboard');
  });

  it('should handle Error objects in catch block', async () => {
    jest
      .spyOn(util, 'getLeaderboard')
      .mockRejectedValueOnce(new Error('Database connection failed'));

    const response = await supertest(app).get('/api/user/leaderboard');

    expect(response.status).toBe(500);
    expect(response.text).toContain('Error fetching leaderboard: Database connection failed');
  });
});
