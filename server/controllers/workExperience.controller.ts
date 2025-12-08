import express, { Response, Router } from 'express';
import {
  WorkExperience,
  FakeSOSocket,
  CreateWorkExperienceRequest,
  UpdateWorkExperienceRequest,
  DeleteWorkExperienceRequest,
  GetWorkExperiencesRequest,
  GetWorkExperienceByIdRequest,
} from '../types/types';
import {
  createWorkExperience,
  deleteWorkExperience,
  updateWorkExperience,
  getWorkExperiencesByUser,
  getWorkExperienceById,
} from '../services/workExperience.service';

/**
 * This controller handles work experience-related routes.
 * @param socket The socket instance to emit events.
 * @returns {express.Router} The router object containing the work experience routes.
 * @throws {Error} Throws an error if the work experience operations fail.
 */
const workExperienceController = (socket: FakeSOSocket) => {
  const router: Router = express.Router();

  /**
   * Creates a new work experience
   */
  const createWorkExperienceRoute = async (
    req: CreateWorkExperienceRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const workExperienceData: WorkExperience = req.body;
      if (workExperienceData.username !== req.user!.username) {
        res.status(401).send('Unauthorized: username does not match token');
        return;
      }
      const result = await createWorkExperience(workExperienceData);
      if ('error' in result) {
        throw new Error(result.error);
      }
      socket.emit('workExperienceUpdate', { workExperience: result, type: 'created' });
      res.status(200).json(result);
    } catch (error) {
      res.status(500).send(`Error when creating work experience: ${(error as Error).message}`);
    }
  };

  /**
   * Deletes a work experience
   */
  const deleteWorkExperienceRoute = async (
    req: DeleteWorkExperienceRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const { experienceId } = req.params;
      const username = req.user!.username;
      const deletedExperience = await deleteWorkExperience(experienceId, username);
      if ('error' in deletedExperience) {
        throw new Error(deletedExperience.error);
      }
      socket.emit('workExperienceUpdate', { workExperience: deletedExperience, type: 'deleted' });
      res.status(200).json(deletedExperience);
    } catch (error) {
      res.status(500).send(`Error when deleting work experience: ${(error as Error).message}`);
    }
  };

  /**
   * Updates a work experience
   */
  const updateWorkExperienceRoute = async (
    req: UpdateWorkExperienceRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const { experienceId } = req.params;
      const username = req.user!.username;
      const updatedData = req.body;
      const updatedExperience = await updateWorkExperience(experienceId, username, updatedData);
      if ('error' in updatedExperience) {
        throw new Error(updatedExperience.error);
      }
      socket.emit('workExperienceUpdate', { workExperience: updatedExperience, type: 'updated' });
      res.status(200).json(updatedExperience);
    } catch (error) {
      res.status(500).send(`Error when updating work experience: ${(error as Error).message}`);
    }
  };

  /**
   * Gets all work experiences for a user
   */
  const getWorkExperiencesByUserRoute = async (
    req: GetWorkExperiencesRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const { username } = req.params;
      const experiences = await getWorkExperiencesByUser(username);
      if ('error' in experiences) {
        throw new Error(experiences.error);
      }
      res.status(200).json(experiences);
    } catch (error) {
      res.status(500).send(`Error when getting work experiences: ${(error as Error).message}`);
    }
  };

  /**
   * Gets a work experience by ID
   */
  const getWorkExperienceByIdRoute = async (
    req: GetWorkExperienceByIdRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const { experienceId } = req.params;
      const experience = await getWorkExperienceById(experienceId);
      if ('error' in experience) {
        throw new Error(experience.error);
      }
      res.status(200).json(experience);
    } catch (error) {
      res.status(500).send(`Error when getting work experience by ID: ${(error as Error).message}`);
    }
  };

  router.post('/create', createWorkExperienceRoute);
  router.delete('/delete/:experienceId', deleteWorkExperienceRoute);
  router.patch('/update/:experienceId', updateWorkExperienceRoute);
  router.get('/user/:username', getWorkExperiencesByUserRoute);
  router.get('/:experienceId', getWorkExperienceByIdRoute);
  return router;
};

export default workExperienceController;
