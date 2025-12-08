import api from './config';
import { WorkExperience, DatabaseWorkExperience, WorkExperienceUpdate } from '../types/types';
const WORK_API_URL = `/api/work`;

/**
 * Fetches work experiences for a given username.
 * @param username the username of the user whose work experiences to retrieve.
 * @returns an array of work experiences.
 */
const getWorkExperiencesByUser = async (username: string): Promise<DatabaseWorkExperience[]> => {
  const res = await api.get(`${WORK_API_URL}/user/${username}`);
  if (res.status !== 200) {
    throw new Error('Error when fetching work experiences');
  }
  return res.data;
};

/**
 * Creates a new work experience.
 * @param workExperience the work experience data to create.
 * @returns the created work experience.
 */
const createWorkExperience = async (
  workExperience: WorkExperience,
): Promise<DatabaseWorkExperience> => {
  const res = await api.post(`${WORK_API_URL}/create`, workExperience);
  if (res.status !== 200) {
    throw new Error('Error when creating work experience');
  }
  return res.data;
};

/**
 * Updates an existing work experience.
 * @param experienceId the ID of the work experience to update.
 * @param updatedData the data to update the work experience with.
 * @returns the updated work experience.
 */
const updateWorkExperience = async (
  experienceId: string,
  updatedData: WorkExperienceUpdate,
): Promise<DatabaseWorkExperience> => {
  const res = await api.patch(`${WORK_API_URL}/update/${experienceId}`, updatedData);
  if (res.status !== 200) {
    throw new Error('Error when updating work experience');
  }
  return res.data;
};

/**
 * Deletes a work experience.
 * @param experienceId the ID of the work experience to delete.
 * @returns the deleted work experience.
 */
const deleteWorkExperience = async (experienceId: string): Promise<DatabaseWorkExperience> => {
  const res = await api.delete(`${WORK_API_URL}/delete/${experienceId}`);
  if (res.status !== 200) {
    throw new Error('Error when deleting work experience');
  }
  return res.data;
};

export {
  getWorkExperiencesByUser,
  createWorkExperience,
  updateWorkExperience,
  deleteWorkExperience,
};
