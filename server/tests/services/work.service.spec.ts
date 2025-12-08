import mongoose from 'mongoose';
import WorkExperienceModel from '../../models/workExperience.model';
import { WorkExperience, DatabaseWorkExperience } from '../../types/types';
import {
  createWorkExperience,
  deleteWorkExperience,
  updateWorkExperience,
  getWorkExperiencesByUser,
  getWorkExperienceById,
} from '../../services/workExperience.service';

// Tests for Work Experience Service
describe('Work Experience Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockId = new mongoose.Types.ObjectId('691a9d75327f3531609bda10');
  const mockWorkExperience: DatabaseWorkExperience = {
    _id: mockId,
    username: 'testuser',
    title: 'Test Position',
    company: 'Test Company',
    type: 'Co-op',
    location: 'Boston',
    startDate: '2024-01-01T00:00:00.000Z',
    endDate: '2024-06-01T00:00:00.000Z',
    description: 'Test description',
  };
  const mockWorkExperienceInput: WorkExperience = {
    username: 'testuser',
    title: 'Test Position',
    company: 'Test Company',
    type: 'Co-op',
    location: 'Boston',
    startDate: '2024-01-01T00:00:00.000Z',
    endDate: '2024-06-01T00:00:00.000Z',
    description: 'Test description',
  };

  // Create Work Experience
  describe('createWorkExperience', () => {
    it('should create a new work experience successfully', async () => {
      jest.spyOn(WorkExperienceModel, 'create').mockResolvedValue(mockWorkExperience as any);

      const result = await createWorkExperience(mockWorkExperienceInput);

      expect(WorkExperienceModel.create).toHaveBeenCalledWith({
        ...mockWorkExperienceInput,
        startDate: new Date(mockWorkExperienceInput.startDate).toISOString(),
        endDate: new Date(mockWorkExperienceInput.endDate!).toISOString(),
      });
      expect(result).toEqual(mockWorkExperience);
      expect(WorkExperienceModel.create).toHaveBeenCalledTimes(1);
    });

    it('should create a work experience with null endDate when endDate is falsy', async () => {
      const workExperienceWithoutEndDate: WorkExperience = {
        ...mockWorkExperienceInput,
        endDate: undefined as any,
      };
      const mockWorkExperienceWithoutEndDate = {
        ...mockWorkExperience,
        endDate: null,
      };

      jest
        .spyOn(WorkExperienceModel, 'create')
        .mockResolvedValue(mockWorkExperienceWithoutEndDate as any);

      const result = await createWorkExperience(workExperienceWithoutEndDate);

      expect(WorkExperienceModel.create).toHaveBeenCalledWith({
        ...workExperienceWithoutEndDate,
        startDate: new Date(workExperienceWithoutEndDate.startDate).toISOString(),
        endDate: null,
      });
      expect(result).toEqual(mockWorkExperienceWithoutEndDate);
    });
    it('should return error when creation returns null', async () => {
      jest.spyOn(WorkExperienceModel, 'create').mockResolvedValueOnce(null as any);

      const result = await createWorkExperience(mockWorkExperienceInput);

      expect(WorkExperienceModel.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ error: 'Failed to create work experience' });
    });

    it('returns error message when database throws', async () => {
      jest.spyOn(WorkExperienceModel, 'create').mockRejectedValueOnce(new Error('Database error'));

      const result = await createWorkExperience(mockWorkExperienceInput);

      expect(WorkExperienceModel.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ error: 'Database error' });
    });
  });

  // Delete Work Experience
  describe('deleteWorkExperience', () => {
    it('should delete a work experience successfully', async () => {
      jest.spyOn(WorkExperienceModel, 'findOneAndDelete').mockResolvedValue(mockWorkExperience);

      const result = await deleteWorkExperience(mockId.toString(), 'testuser');
      expect(result).toEqual(mockWorkExperience);
      expect(WorkExperienceModel.findOneAndDelete).toHaveBeenCalledWith({
        _id: mockId.toString(),
        username: 'testuser',
      });
      expect(WorkExperienceModel.findOneAndDelete).toHaveBeenCalledTimes(1);
    });

    it('should return error when work experience not found', async () => {
      jest.spyOn(WorkExperienceModel, 'findOneAndDelete').mockResolvedValueOnce(null);
      const result = await deleteWorkExperience(mockId.toString(), 'testuser');
      expect(WorkExperienceModel.findOneAndDelete).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ error: 'Failed to delete work experience' });
    });

    it('should return error when databse throws error', async () => {
      jest
        .spyOn(WorkExperienceModel, 'findOneAndDelete')
        .mockRejectedValueOnce(new Error('Database error'));
      const result = await deleteWorkExperience(mockId.toString(), 'testuser');

      expect(WorkExperienceModel.findOneAndDelete).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ error: 'Database error' });
    });
  });

  // Update Work Experience
  describe('updateWorkExperience', () => {
    const udpateData = {
      title: 'Updated Position',
      startDate: '2024-02-01T00:00:00.000Z',
    };
    const udpatedExperience = {
      ...mockWorkExperience,
      title: 'Updated Position',
      startDate: '2024-02-01T00:00:00.000Z',
    };
    it('should update a work experience successfully', async () => {
      jest.spyOn(WorkExperienceModel, 'findOneAndUpdate').mockResolvedValue(udpatedExperience);

      const result = await updateWorkExperience(mockId.toString(), 'testuser', udpateData);

      expect(WorkExperienceModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockId.toString(), username: 'testuser' },
        {
          $set: {
            title: 'Updated Position',
            startDate: new Date(udpateData.startDate).toISOString(),
          },
        },
        { new: true },
      );
      expect(result).toEqual(udpatedExperience);
      expect(WorkExperienceModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
    });
    it('should handle empty udpate data correctly', async () => {
      const emptyUpdateData = {};
      jest.spyOn(WorkExperienceModel, 'findOneAndUpdate').mockResolvedValue(mockWorkExperience);

      const result = await updateWorkExperience(mockId.toString(), 'testuser', emptyUpdateData);

      expect(WorkExperienceModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockId.toString(), username: 'testuser' },
        {
          $set: {},
        },
        { new: true },
      );
      expect(result).toEqual(mockWorkExperience);
      expect(WorkExperienceModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
    });
    it('should handle empty string startDate and null endDate correctly', async () => {
      const updateDataWithEmptyDates = {
        startDate: '',
        endDate: null,
      };
      const updatedExperienceWithNullDates = {
        ...mockWorkExperience,
        startDate: undefined,
        endDate: null,
      };
      jest
        .spyOn(WorkExperienceModel, 'findOneAndUpdate')
        .mockResolvedValue(updatedExperienceWithNullDates);

      const result = await updateWorkExperience(
        mockId.toString(),
        'testuser',
        updateDataWithEmptyDates,
      );

      expect(WorkExperienceModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockId.toString(), username: 'testuser' },
        {
          $set: {
            startDate: undefined,
            endDate: null,
          },
        },
        { new: true },
      );
      expect(result).toEqual(updatedExperienceWithNullDates);
      expect(WorkExperienceModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
    });

    it('should handle empty string endDate correctly', async () => {
      const updateDataWithEmptyEndDate = {
        endDate: '',
      };
      const updatedExperienceWithNullEndDate = {
        ...mockWorkExperience,
        endDate: null,
      };
      jest
        .spyOn(WorkExperienceModel, 'findOneAndUpdate')
        .mockResolvedValue(updatedExperienceWithNullEndDate);

      const result = await updateWorkExperience(
        mockId.toString(),
        'testuser',
        updateDataWithEmptyEndDate,
      );

      expect(WorkExperienceModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockId.toString(), username: 'testuser' },
        {
          $set: {
            endDate: null, // Empty string should become null
          },
        },
        { new: true },
      );
      expect(result).toEqual(updatedExperienceWithNullEndDate);
    });
    it('should return error when update returns null', async () => {
      jest.spyOn(WorkExperienceModel, 'findOneAndUpdate').mockResolvedValueOnce(null);

      const result = await updateWorkExperience(mockId.toString(), 'testuser', udpateData);

      expect(WorkExperienceModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ error: 'Failed to update work experience' });
    });
    it('should return error when database throws error', async () => {
      jest
        .spyOn(WorkExperienceModel, 'findOneAndUpdate')
        .mockRejectedValueOnce(new Error('Database error'));

      const result = await updateWorkExperience(mockId.toString(), 'testuser', udpateData);

      expect(WorkExperienceModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ error: 'Database error' });
    });
  });

  // Get Work Experiences By User
  describe('getWorkExperiencesByUser', () => {
    it('should retrieve all work experiences for a user', async () => {
      const experiences = [mockWorkExperience];
      jest.spyOn(WorkExperienceModel, 'find').mockResolvedValue(experiences);
      const result = await getWorkExperiencesByUser('testuser');
      expect(WorkExperienceModel.find).toHaveBeenCalledWith({ username: 'testuser' });
      expect(result).toEqual(experiences);
    });
    it('should retrieve all work experiences for a user if there are more than one', async () => {
      const secondExperience: DatabaseWorkExperience = {
        _id: new mongoose.Types.ObjectId('791a9d75327f3531609bda11'),
        username: 'testuser',
        title: 'Second Position',
        company: 'Second Company',
        type: 'Internship',
        location: 'New York',
        startDate: '2023-05-01T00:00:00.000Z',
        endDate: '2023-08-01T00:00:00.000Z',
        description: 'Second description',
      };
      const experiences = [mockWorkExperience, secondExperience];
      jest.spyOn(WorkExperienceModel, 'find').mockResolvedValue(experiences);
      const result = await getWorkExperiencesByUser('testuser');
      expect(WorkExperienceModel.find).toHaveBeenCalledWith({ username: 'testuser' });
      expect(result).toEqual(experiences);
    });
    it('should return null array when user has no work experiences', async () => {
      jest.spyOn(WorkExperienceModel, 'find').mockResolvedValueOnce([]);
      const result = await getWorkExperiencesByUser('testuser');
      expect(WorkExperienceModel.find).toHaveBeenCalledWith({ username: 'testuser' });
      expect(result).toEqual([]);
    });
    it('should return error when database throws error', async () => {
      jest.spyOn(WorkExperienceModel, 'find').mockRejectedValueOnce(new Error('Database error'));
      const result = await getWorkExperiencesByUser('testuser');
      expect(WorkExperienceModel.find).toHaveBeenCalledWith({ username: 'testuser' });
      expect(result).toEqual({ error: 'Database error' });
    });
  });

  // Get Work Experience By ID
  describe('getWorkExperienceById', () => {
    it('should retrieve a work experience by ID', async () => {
      jest.spyOn(WorkExperienceModel, 'findById').mockResolvedValue(mockWorkExperience);
      const result = await getWorkExperienceById(mockId.toString());
      expect(WorkExperienceModel.findById).toHaveBeenCalledWith(mockId.toString());
      expect(result).toEqual(mockWorkExperience);
    });
    it('should return error when work experience not found', async () => {
      jest.spyOn(WorkExperienceModel, 'findById').mockResolvedValueOnce(null);
      const result = await getWorkExperienceById(mockId.toString());
      expect(WorkExperienceModel.findById).toHaveBeenCalledWith(mockId.toString());
      expect(result).toEqual({ error: 'Failed to get work experience' });
    });
    it('should return error when database throws error', async () => {
      jest
        .spyOn(WorkExperienceModel, 'findById')
        .mockRejectedValueOnce(new Error('Database error'));
      const result = await getWorkExperienceById(mockId.toString());
      expect(WorkExperienceModel.findById).toHaveBeenCalledWith(mockId.toString());
      expect(result).toEqual({ error: 'Database error' });
    });
  });
});
