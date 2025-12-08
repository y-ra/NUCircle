import WorkExperienceModel from '../models/workExperience.model';
import {
  WorkExperience,
  DatabaseWorkExperience,
  WorkExperienceResponse,
  WorkExperienceUpdate,
} from '../types/types';

/**
 * creates a new work experience in the database.
 * @param workExperience the work experience to create.
 * @returns the created work experience.
 */
export const createWorkExperience = async (
  workExperience: WorkExperience,
): Promise<WorkExperienceResponse> => {
  try {
    const normalized = {
      ...workExperience,
      startDate: new Date(workExperience.startDate).toISOString(),
      endDate: workExperience.endDate ? new Date(workExperience.endDate).toISOString() : null,
    };
    const newWorkExperience = await WorkExperienceModel.create(normalized);
    if (!newWorkExperience) {
      throw new Error('Failed to create work experience');
    }
    return newWorkExperience;
  } catch (error) {
    return { error: (error as Error).message };
  }
};

/**
 * Deletes a work experience from the database.
 * @param id the ID of the work experience to delete.
 * @param username the username of the user who owns the work experience.
 * @returns the deleted work experience.
 */
export const deleteWorkExperience = async (
  id: string,
  usernameToView: string,
): Promise<WorkExperienceResponse> => {
  try {
    const deleteWorkExperience = await WorkExperienceModel.findOneAndDelete({
      _id: id,
      username: usernameToView,
    });
    if (!deleteWorkExperience) {
      throw new Error('Failed to delete work experience');
    }
    return deleteWorkExperience;
  } catch (error) {
    return { error: (error as Error).message };
  }
};

/**
 * Updates a work experience in the database.
 * @param experienceId the id of the work experience to update.
 * @param username the id of the username who owns the work experience.
 * @param updatedData the updated data for the work experience.
 * @returns the updated work experience.
 */
export const updateWorkExperience = async (
  experienceId: string,
  usernameToView: string,
  updatedData: WorkExperienceUpdate,
): Promise<WorkExperienceResponse> => {
  try {
    const normalizedUpdate: WorkExperienceUpdate = { ...updatedData };
    if (updatedData.startDate !== undefined) {
      normalizedUpdate.startDate =
        updatedData.startDate === '' ? undefined : new Date(updatedData.startDate).toISOString();
    }
    if (updatedData.endDate !== undefined) {
      normalizedUpdate.endDate =
        updatedData.endDate === '' || updatedData.endDate === null
          ? null
          : new Date(updatedData.endDate).toISOString();
    }

    const updatedWorkExperience = await WorkExperienceModel.findOneAndUpdate(
      { _id: experienceId, username: usernameToView },
      { $set: normalizedUpdate },
      { new: true },
    );
    if (!updatedWorkExperience) {
      throw new Error('Failed to update work experience');
    }
    return updatedWorkExperience;
  } catch (error) {
    return { error: (error as Error).message };
  }
};

/**
 * Gets all work experiences for a given user.
 * @param username the username of the user whose work experiences to retrieve.
 * @returns an array of work experiences for the user or an error.
 */
export const getWorkExperiencesByUser = async (
  usernameToView: string,
): Promise<DatabaseWorkExperience[] | { error: string }> => {
  try {
    const workExperiences = await WorkExperienceModel.find({ username: usernameToView });
    return workExperiences;
  } catch (error) {
    return { error: (error as Error).message };
  }
};

/**
 * Gets a single work experience by its ID.
 * @param experienceId the id of the work experience
 * @returns the work experience.
 */
export const getWorkExperienceById = async (
  experienceId: string,
): Promise<WorkExperienceResponse> => {
  try {
    const experience = await WorkExperienceModel.findById(experienceId);
    if (!experience) {
      throw new Error('Failed to get work experience');
    }
    return experience;
  } catch (error) {
    return { error: (error as Error).message };
  }
};
