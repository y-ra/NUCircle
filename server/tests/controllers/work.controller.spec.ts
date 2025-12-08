import supertest from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import * as util from '../../services/workExperience.service';
import { DatabaseWorkExperience, WorkExperience } from '../../types/types';

// mock jwt auth to always authenticate successfully
jest.mock('../../middleware/auth', () => ({
  __esModule: true,
  default: (req: any, res: any, next: any) => {
    // Prioritize params.username, then body.username, then query.username or currentUsername
    const username =
      req.params?.username ||
      //   req.body?.username ||
      req.query?.username ||
      req.query?.currentUsername || // This might be overriding
      'test_user';
    req.user = { userId: 'test-user-id', username: username };
    next();
  },
}));

// spy on service functions
const createSpy = jest.spyOn(util, 'createWorkExperience');
const deleteSpy = jest.spyOn(util, 'deleteWorkExperience');
const updateSpy = jest.spyOn(util, 'updateWorkExperience');
const getByUserSpy = jest.spyOn(util, 'getWorkExperiencesByUser');
const getByIdSpy = jest.spyOn(util, 'getWorkExperienceById');

// mock data
const mockId = new mongoose.Types.ObjectId('691a9d75327f3531609bda10');

const mockWork: DatabaseWorkExperience = {
  _id: mockId,
  username: 'test_user',
  title: 'Test Position',
  company: 'Test Company',
  type: 'Co-op',
  location: 'Boston',
  startDate: new Date('2024-01-01').toISOString(),
  endDate: new Date('2024-06-01').toISOString(),
  description: 'Test description',
};
const mockWorkInput: WorkExperience = {
  username: 'test_user',
  title: 'Test Position',
  company: 'Test Company',
  type: 'Co-op',
  location: 'Boston',
  startDate: new Date('2024-01-01').toISOString(),
  endDate: new Date('2024-06-01').toISOString(),
  description: 'Test description',
};

describe('Work Experience Controller', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  // POST /create
  describe('POST /create', () => {
    it('should create a new work experience', async () => {
      createSpy.mockResolvedValue(mockWork);

      const res = await supertest(app).post('/api/work/create').send(mockWorkInput);

      expect(res.status).toBe(200);
      expect(res.body._id).toBeDefined();
      expect(createSpy).toHaveBeenCalledWith(mockWorkInput);
    });
    it('should return 401 when username does not match token', async () => {
      const res = await supertest(app)
        .post('/api/work/create')
        .set('user', JSON.stringify({ username: 'test_user' }))
        .send({ ...mockWorkInput, username: 'different_user' });
      expect(res.status).toBe(401);
      expect(res.text).toBe('Unauthorized: username does not match token');
      expect(createSpy).not.toHaveBeenCalled();
    });
    it('should return 500 when service returns error', async () => {
      createSpy.mockResolvedValue({ error: 'Creation failed' });

      const res = await supertest(app).post('/api/work/create').send(mockWorkInput);
      expect(res.status).toBe(500);
      expect(res.text).toContain('Error when creating work experience: Creation failed');
      expect(createSpy).toHaveBeenCalledWith(mockWorkInput);
    });
    it('should return 500 when service throws', async () => {
      createSpy.mockRejectedValue(new Error('Service exception'));
      const res = await supertest(app).post('/api/work/create').send(mockWorkInput);
      expect(res.status).toBe(500);
      expect(res.text).toContain('Error when creating work experience: Service exception');
      expect(createSpy).toHaveBeenCalledWith(mockWorkInput);
    });
  });

  // DELETE /delete/:experienceId
  describe('DELETE /delete/:experienceId', () => {
    it('should delete a work experience', async () => {
      deleteSpy.mockResolvedValue(mockWork);
      const res = await supertest(app)
        .delete(`/api/work/delete/${mockId.toString()}`)
        .query({ username: 'test_user' });
      expect(res.status).toBe(200);
      expect(res.body._id).toBe(mockId.toString());
      expect(deleteSpy).toHaveBeenCalledWith(mockId.toString(), 'test_user');
    });
    it('should return 500 when service returns error', async () => {
      deleteSpy.mockResolvedValue({ error: 'Deletion failed' });
      const res = await supertest(app)
        .delete(`/api/work/delete/${mockId.toString()}`)
        .query({ username: 'test_user' });
      expect(res.status).toBe(500);
      expect(res.text).toContain('Error when deleting work experience: Deletion failed');
      expect(deleteSpy).toHaveBeenCalledWith(mockId.toString(), 'test_user');
    });
    it('should return 500 when service throws', async () => {
      deleteSpy.mockRejectedValue(new Error('Service exception'));
      const res = await supertest(app)
        .delete(`/api/work/delete/${mockId.toString()}`)
        .query({ username: 'test_user' });
      expect(res.status).toBe(500);
      expect(res.text).toContain('Error when deleting work experience: Service exception');
      expect(deleteSpy).toHaveBeenCalledWith(mockId.toString(), 'test_user');
    });
  });

  // PATCH /update/:experienceId
  describe('PATCH /update/:experienceId', () => {
    it('should update a work experience', async () => {
      const updatedWork = { ...mockWork, title: 'Updated Position' };
      updateSpy.mockResolvedValue(updatedWork);
      const res = await supertest(app)
        .patch(`/api/work/update/${mockId.toString()}`)
        .send({ title: 'Updated Position' })
        .query({ username: 'test_user' });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Position');
      expect(updateSpy).toHaveBeenCalledWith(mockId.toString(), 'test_user', {
        title: 'Updated Position',
      });
    });
    it('should return 500 when service returns error', async () => {
      updateSpy.mockResolvedValue({ error: 'Update failed' });
      const res = await supertest(app)
        .patch(`/api/work/update/${mockId.toString()}`)
        .send({ title: 'Updated Position' })
        .query({ username: 'test_user' });
      expect(res.status).toBe(500);
      expect(res.text).toContain('Error when updating work experience: Update failed');
      expect(updateSpy).toHaveBeenCalledWith(mockId.toString(), 'test_user', {
        title: 'Updated Position',
      });
    });
    it('should return 500 when service throws', async () => {
      updateSpy.mockRejectedValue(new Error('Service exception'));
      const res = await supertest(app)
        .patch(`/api/work/update/${mockId.toString()}`)
        .send({ title: 'Updated Position' })
        .query({ username: 'test_user' });
      expect(res.status).toBe(500);
      expect(res.text).toContain('Error when updating work experience: Service exception');
    });
  });

  // GET /user/:username
  describe('GET /user/:username', () => {
    it('should get work experiences for a user', async () => {
      const list = [mockWork, { ...mockWork, _id: new mongoose.Types.ObjectId(), title: 'X' }];
      getByUserSpy.mockResolvedValueOnce(list);

      const res = await supertest(app).get('/api/work/user/test_user');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(getByUserSpy).toHaveBeenCalledWith('test_user');
    });
    it('should return 500 when service returns error', async () => {
      getByUserSpy.mockResolvedValueOnce({ error: 'Fetch failed' });
      const res = await supertest(app).get('/api/work/user/test_user');
      expect(res.status).toBe(500);
      expect(res.text).toContain('Error when getting work experiences: Fetch failed');
      expect(getByUserSpy).toHaveBeenCalledWith('test_user');
    });
    it('should return 500 when service throws', async () => {
      getByUserSpy.mockRejectedValueOnce(new Error('Service exception'));
      const res = await supertest(app).get('/api/work/user/test_user');
      expect(res.status).toBe(500);
      expect(res.text).toContain('Error when getting work experiences: Service exception');
      expect(getByUserSpy).toHaveBeenCalledWith('test_user');
    });
  });

  // GET /:experienceId
  describe('GET /:experienceId', () => {
    it('should get a work experience by ID', async () => {
      getByIdSpy.mockResolvedValueOnce(mockWork);
      const res = await supertest(app).get(`/api/work/${mockId.toString()}`);
      expect(res.status).toBe(200);
      expect(res.body._id).toBe(mockId.toString());
      expect(getByIdSpy).toHaveBeenCalledWith(mockId.toString());
    });
    it('should return 500 when service returns error', async () => {
      getByIdSpy.mockResolvedValueOnce({ error: 'Fetch by ID failed' });
      const res = await supertest(app).get(`/api/work/${mockId.toString()}`);
      expect(res.status).toBe(500);
      expect(res.text).toContain('Error when getting work experience by ID: Fetch by ID failed');
      expect(getByIdSpy).toHaveBeenCalledWith(mockId.toString());
    });
    it('should return 500 when service throws', async () => {
      getByIdSpy.mockRejectedValueOnce(new Error('Service exception'));
      const res = await supertest(app).get(`/api/work/${mockId.toString()}`);
      expect(res.status).toBe(500);
      expect(res.text).toContain('Error when getting work experience by ID: Service exception');
      expect(getByIdSpy).toHaveBeenCalledWith(mockId.toString());
    });
  });
});
