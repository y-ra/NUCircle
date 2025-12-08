import supertest from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import * as communityService from '../../services/community.service';
import { DatabaseCommunity } from '../../types/types';
import * as userUtil from '../../services/user.service';

// mock jwt auth to always authenticate successfully
jest.mock('../../middleware/auth', () => ({
  __esModule: true,
  default: (req: any, res: any, next: any) => {
    // Extract username from request params, body (username or admin), or query for testing
    // Use query.currentUsername to override for auth failure tests (must check first)
    // Check headers for a test override header
    const testOverride = req.headers?.['x-test-username'];
    const username =
      testOverride ||
      req.query?.currentUsername ||
      req.params?.username ||
      req.body?.username ||
      req.body?.admin ||
      req.query?.username ||
      'test_user';
    req.user = { userId: 'test-user-id', username: username };
    next();
  },
}));

// Mock community data for testing
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

// Expected JSON response format
const mockCommunityResponse = {
  _id: mockCommunity._id.toString(),
  name: 'Test Community',
  description: 'Test Description',
  admin: 'admin_user',
  participants: ['admin_user', 'user1', 'user2'],
  visibility: 'PUBLIC',
  createdAt: new Date('2024-03-01').toISOString(),
  updatedAt: new Date('2024-03-01').toISOString(),
};

// Service method spies
const getCommunityspy = jest.spyOn(communityService, 'getCommunity');
const getAllCommunitiesSpy = jest.spyOn(communityService, 'getAllCommunities');
const toggleCommunityMembershipSpy = jest.spyOn(communityService, 'toggleCommunityMembership');
const createCommunitySpy = jest.spyOn(communityService, 'createCommunity');
const deleteCommunitySpy = jest.spyOn(communityService, 'deleteCommunity');
const getCommunitiesByUserSpy = jest.spyOn(communityService, 'getCommunitiesByUser');
const getUserByUsernameSpy = jest.spyOn(userUtil, 'getUserByUsername');
const recordCommunityVisitSpy = jest.spyOn(communityService, 'recordCommunityVisit');

describe('Community Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /getUserCommunities/:username', () => {
    test('should return communities for a user', async () => {
      getCommunitiesByUserSpy.mockResolvedValueOnce([mockCommunity]);

      const response = await supertest(app).get('/api/community/getUserCommunities/test_user');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toEqual(mockCommunityResponse);
      expect(getCommunitiesByUserSpy).toHaveBeenCalledWith('test_user');
    });

    test('should return 500 when service returns error', async () => {
      getCommunitiesByUserSpy.mockResolvedValueOnce({ error: 'Database error' });

      const response = await supertest(app).get('/api/community/getUserCommunities/test_user');
      expect(response.status).toBe(500);
      expect(response.text).toContain('Error retrieving user communities: Database error');
    });

    test('should return empty array when user has no communities', async () => {
      getCommunitiesByUserSpy.mockResolvedValueOnce([]);

      const response = await supertest(app).get('/api/community/getUserCommunities/test_user');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('should return 401 when username does not match authenticated user', async () => {
      // Use query param to set authenticated user to 'test_user', but params.username = 'different_user'
      const response = await supertest(app)
        .get('/api/community/getUserCommunities/different_user')
        .query({ currentUsername: 'test_user' });

      expect(response.status).toBe(401);
      expect(response.text).toBe('Invalid username parameter');
    });
  });

  describe('GET /getCommunity/:communityId', () => {
    test('should return community when found', async () => {
      getCommunityspy.mockResolvedValueOnce(mockCommunity);

      const response = await supertest(app).get(
        '/api/community/getCommunity/65e9b58910afe6e94fc6e6dc',
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCommunityResponse);
      expect(getCommunityspy).toHaveBeenCalledWith('65e9b58910afe6e94fc6e6dc');
    });

    test('should return 500 when community not found', async () => {
      getCommunityspy.mockResolvedValueOnce({ error: 'Community not found' });

      const response = await supertest(app).get(
        '/api/community/getCommunity/65e9b58910afe6e94fc6e6dc',
      );

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error retrieving community: Community not found');
    });

    test('should return 500 when service throws error', async () => {
      getCommunityspy.mockRejectedValueOnce(new Error('Database error'));

      const response = await supertest(app).get(
        '/api/community/getCommunity/65e9b58910afe6e94fc6e6dc',
      );

      expect(response.status).toBe(500);
    });
  });

  describe('GET /getAllCommunities', () => {
    test('should return all communities', async () => {
      const mockCommunities = [mockCommunity, { ...mockCommunity, name: 'Community 2' }];
      getAllCommunitiesSpy.mockResolvedValueOnce(mockCommunities);

      const response = await supertest(app).get('/api/community/getAllCommunities');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(getAllCommunitiesSpy).toHaveBeenCalled();
    });

    test('should return empty array when no communities', async () => {
      getAllCommunitiesSpy.mockResolvedValueOnce([]);

      const response = await supertest(app).get('/api/community/getAllCommunities');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('should return 500 when service returns error', async () => {
      getAllCommunitiesSpy.mockResolvedValueOnce({ error: 'Database error' });

      const response = await supertest(app).get('/api/community/getAllCommunities');

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error retrieving communities: Database error');
    });
  });

  describe('POST /toggleMembership', () => {
    test('should successfully toggle membership when adding user', async () => {
      const mockReqBody = {
        communityId: '65e9b58910afe6e94fc6e6dc',
        username: 'user3',
      };

      const mockResponse = {
        community: {
          ...mockCommunity,
          participants: [...mockCommunity.participants, 'user3'],
        },
        added: true,
      };

      toggleCommunityMembershipSpy.mockResolvedValueOnce(mockResponse);

      getUserByUsernameSpy.mockResolvedValueOnce({
        _id: new mongoose.Types.ObjectId(),
        username: 'user3',
        dateJoined: new Date(),
        firstName: 'User',
        lastName: 'Three',
        socketId: 'fake-socket-id',
      });

      const response = await supertest(app)
        .post('/api/community/toggleMembership')
        .send(mockReqBody);

      expect(response.status).toBe(200);
      expect(toggleCommunityMembershipSpy).toHaveBeenCalledWith(
        mockReqBody.communityId,
        mockReqBody.username,
      );
    });

    test('should successfully toggle membership when removing user', async () => {
      const mockReqBody = {
        communityId: '65e9b58910afe6e94fc6e6dc',
        username: 'user2',
      };

      const mockResponse = {
        community: {
          ...mockCommunity,
          participants: ['admin_user', 'user1'],
        },
        added: true,
      };

      toggleCommunityMembershipSpy.mockResolvedValueOnce(mockResponse);

      getUserByUsernameSpy.mockResolvedValueOnce({
        _id: new mongoose.Types.ObjectId(),
        username: 'user2',
        dateJoined: new Date(),
        firstName: 'User',
        lastName: 'Two',
        socketId: 'fake-socket-id',
      });

      const response = await supertest(app)
        .post('/api/community/toggleMembership')
        .send(mockReqBody);

      expect(response.status).toBe(200);
    });

    test('should return 400 when missing communityId', async () => {
      const mockReqBody = {
        username: 'user3',
      };

      const response = await supertest(app)
        .post('/api/community/toggleMembership')
        .send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/communityId');
    });

    test('should return 400 when missing username', async () => {
      const mockReqBody = {
        communityId: '65e9b58910afe6e94fc6e6dc',
      };

      const response = await supertest(app)
        .post('/api/community/toggleMembership')
        .send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/username');
    });

    test('should return 400 when body is missing', async () => {
      const response = await supertest(app).post('/api/community/toggleMembership');

      expect(response.status).toBe(415);
    });

    test('should return 403 when admin tries to leave', async () => {
      const mockReqBody = {
        communityId: '65e9b58910afe6e94fc6e6dc',
        username: 'admin_user', // Admin trying to leave
      };

      toggleCommunityMembershipSpy.mockResolvedValueOnce({
        error:
          'Community admins cannot leave their communities. Please transfer ownership or delete the community instead.',
      });

      const response = await supertest(app)
        .post('/api/community/toggleMembership')
        .send(mockReqBody);

      expect(response.status).toBe(403);
    });

    test('should return 404 when community not found', async () => {
      const mockReqBody = {
        communityId: '65e9b58910afe6e94fc6e6dc',
        username: 'user3',
      };

      toggleCommunityMembershipSpy.mockResolvedValueOnce({
        error: 'Community not found',
      });

      const response = await supertest(app)
        .post('/api/community/toggleMembership')
        .send(mockReqBody);

      expect(response.status).toBe(404);
    });

    test('should return 500 for other errors', async () => {
      const mockReqBody = {
        communityId: '65e9b58910afe6e94fc6e6dc',
        username: 'user3',
      };

      toggleCommunityMembershipSpy.mockResolvedValueOnce({
        error: 'Database error',
      });

      const response = await supertest(app)
        .post('/api/community/toggleMembership')
        .send(mockReqBody);

      expect(response.status).toBe(500);
    });

    test('should return 401 when username does not match authenticated user', async () => {
      const mockReqBody = {
        communityId: '65e9b58910afe6e94fc6e6dc',
        username: 'different_user',
      };

      // Use header to set authenticated user to 'test_user', but body.username = 'different_user'
      const response = await supertest(app)
        .post('/api/community/toggleMembership')
        .set('x-test-username', 'test_user')
        .send(mockReqBody);

      expect(response.status).toBe(401);
      expect(response.text).toBe('Invalid username parameter');
    });

    test('should return 500 when service throws error', async () => {
      const mockReqBody = {
        communityId: '65e9b58910afe6e94fc6e6dc',
        username: 'user3',
      };

      toggleCommunityMembershipSpy.mockRejectedValueOnce(new Error('Unexpected error'));

      const response = await supertest(app)
        .post('/api/community/toggleMembership')
        .send(mockReqBody);

      expect(response.status).toBe(500);
      expect(response.body.error).toContain(
        'Error toggling community membership: Unexpected error',
      );
    });
  });

  describe('POST /create', () => {
    test('should create a new community successfully', async () => {
      const mockReqBody = {
        name: 'New Community',
        description: 'New Description',
        admin: 'new_admin',
        visibility: 'PRIVATE',
        participants: ['user1'],
      };

      const createdCommunity: DatabaseCommunity = {
        ...mockReqBody,
        _id: new mongoose.Types.ObjectId(),
        participants: ['user1', 'new_admin'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      createCommunitySpy.mockResolvedValueOnce(createdCommunity);

      const response = await supertest(app).post('/api/community/create').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(createCommunitySpy).toHaveBeenCalledWith({
        name: mockReqBody.name,
        description: mockReqBody.description,
        admin: mockReqBody.admin,
        participants: ['user1', 'new_admin'],
        visibility: mockReqBody.visibility,
      });
    });

    test('should create community with default visibility when not provided', async () => {
      const mockReqBody = {
        name: 'New Community',
        description: 'New Description',
        admin: 'new_admin',
      };

      const createdCommunity: DatabaseCommunity = {
        ...mockReqBody,
        _id: new mongoose.Types.ObjectId(),
        participants: ['new_admin'],
        visibility: 'PUBLIC',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      createCommunitySpy.mockResolvedValueOnce(createdCommunity);

      const response = await supertest(app).post('/api/community/create').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(createCommunitySpy).toHaveBeenCalledWith({
        name: mockReqBody.name,
        description: mockReqBody.description,
        admin: mockReqBody.admin,
        participants: ['new_admin'],
        visibility: 'PUBLIC',
      });
    });

    test('should return 400 when missing name', async () => {
      const mockReqBody = {
        description: 'New Description',
        admin: 'new_admin',
      };

      const response = await supertest(app).post('/api/community/create').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/name');
    });

    test('should return 400 when missing description', async () => {
      const mockReqBody = {
        name: 'New Community',
        admin: 'new_admin',
      };

      const response = await supertest(app).post('/api/community/create').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/description');
    });

    test('should return 400 when missing admin', async () => {
      const mockReqBody = {
        name: 'New Community',
        description: 'New Description',
      };

      const response = await supertest(app).post('/api/community/create').send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/admin');
    });

    test('should return 500 when service returns error', async () => {
      const mockReqBody = {
        name: 'New Community',
        description: 'New Description',
        admin: 'new_admin',
      };

      createCommunitySpy.mockResolvedValueOnce({ error: 'Database error' });

      const response = await supertest(app).post('/api/community/create').send(mockReqBody);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error creating a community: Database error');
    });

    test('should return 401 when admin does not match authenticated user', async () => {
      const mockReqBody = {
        name: 'New Community',
        description: 'New Description',
        admin: 'different_admin',
      };

      // Use header to set authenticated user to 'test_user', but body.admin = 'different_admin'
      const response = await supertest(app)
        .post('/api/community/create')
        .set('x-test-username', 'test_user')
        .send(mockReqBody);

      expect(response.status).toBe(401);
      expect(response.text).toBe('Invalid admin parameter');
    });
  });

  describe('DELETE /delete/:communityId', () => {
    test('should delete community successfully when user is admin', async () => {
      const mockReqBody = {
        username: 'admin_user',
      };

      deleteCommunitySpy.mockResolvedValueOnce(mockCommunity);

      const response = await supertest(app)
        .delete('/api/community/delete/65e9b58910afe6e94fc6e6dc')
        .send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        community: mockCommunityResponse,
        message: 'Community deleted successfully',
      });
      expect(deleteCommunitySpy).toHaveBeenCalledWith('65e9b58910afe6e94fc6e6dc', 'admin_user');
    });

    test('should return 400 when missing username', async () => {
      const response = await supertest(app)
        .delete('/api/community/delete/65e9b58910afe6e94fc6e6dc')
        .send({});
      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/username');
    });

    test('should return 400 when username is empty string', async () => {
      const mockReqBody = {
        username: '',
      };

      const response = await supertest(app)
        .delete('/api/community/delete/65e9b58910afe6e94fc6e6dc')
        .send(mockReqBody);

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/username');
    });

    test('should return 403 when user is not admin', async () => {
      const mockReqBody = {
        username: 'user1', // Non-admin user
      };

      deleteCommunitySpy.mockResolvedValueOnce({
        error: 'Unauthorized: Only the community admin can delete this community',
      });

      const response = await supertest(app)
        .delete('/api/community/delete/65e9b58910afe6e94fc6e6dc')
        .send(mockReqBody);

      expect(response.status).toBe(403);
    });

    test('should return 404 when community not found', async () => {
      const mockReqBody = {
        username: 'admin_user',
      };

      deleteCommunitySpy.mockResolvedValueOnce({
        error: 'Community not found',
      });

      const response = await supertest(app)
        .delete('/api/community/delete/65e9b58910afe6e94fc6e6dc')
        .send(mockReqBody);

      expect(response.status).toBe(404);
    });

    test('should return 500 for other errors', async () => {
      const mockReqBody = {
        username: 'admin_user',
      };

      deleteCommunitySpy.mockResolvedValueOnce({
        error: 'Database error',
      });

      const response = await supertest(app)
        .delete('/api/community/delete/65e9b58910afe6e94fc6e6dc')
        .send(mockReqBody);

      expect(response.status).toBe(500);
    });

    test('should return 401 when username does not match authenticated user', async () => {
      const mockReqBody = {
        username: 'different_user',
      };

      // Use header to set authenticated user to 'test_user', but body.username = 'different_user'
      const response = await supertest(app)
        .delete('/api/community/delete/65e9b58910afe6e94fc6e6dc')
        .set('x-test-username', 'test_user')
        .send(mockReqBody);

      expect(response.status).toBe(401);
      expect(response.text).toBe('Invalid username parameter');
    });

    test('should return 500 when service throws error', async () => {
      const mockReqBody = {
        username: 'admin_user',
      };

      deleteCommunitySpy.mockRejectedValueOnce(new Error('Unexpected error'));

      const response = await supertest(app)
        .delete('/api/community/delete/65e9b58910afe6e94fc6e6dc')
        .send(mockReqBody);

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Error deleting community: Unexpected error');
    });
  });
  describe('POST /:communityId/visit', () => {
    test('should record visit successfully', async () => {
      const mockReqBody = {
        username: 'test_user',
      };

      recordCommunityVisitSpy.mockResolvedValueOnce(undefined);

      const response = await supertest(app)
        .post('/api/community/65e9b58910afe6e94fc6e6dc/visit')
        .send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Visit recorded' });
      expect(recordCommunityVisitSpy).toHaveBeenCalledWith('65e9b58910afe6e94fc6e6dc', 'test_user');
    });

    test('should return 500 when service throws error', async () => {
      const mockReqBody = {
        username: 'test_user',
      };

      recordCommunityVisitSpy.mockRejectedValueOnce(new Error('Database error'));

      const response = await supertest(app)
        .post('/api/community/65e9b58910afe6e94fc6e6dc/visit')
        .send(mockReqBody);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error recording visit: Database error');
    });

    test('should return 401 when username does not match authenticated user', async () => {
      const mockReqBody = {
        username: 'different_user',
      };

      // Use header to set authenticated user to 'test_user', but body.username = 'different_user'
      const response = await supertest(app)
        .post('/api/community/65e9b58910afe6e94fc6e6dc/visit')
        .set('x-test-username', 'test_user')
        .send(mockReqBody);

      expect(response.status).toBe(401);
      expect(response.text).toBe('Invalid username parameter');
    });
  });
});
