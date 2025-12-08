import { ObjectId } from 'mongodb';
import { Request } from 'express';

/**
 * Represents a Work Experience request payload.
 */
export interface WorkExperience {
  username: string;
  title: string;
  company: string;
  type: string;
  location: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

export type WorkExperienceUpdate = {
  title?: string;
  company?: string;
  type?: string;
  location?: string;
  startDate?: string;
  endDate?: string | null;
  description?: string;
};

/**
 * Represents a Work Experience stored in the database.
 */
export interface DatabaseWorkExperience extends WorkExperience {
  _id: ObjectId;
}

/**
 * Work Experience return type for service calls.
 */
export type WorkExperienceResponse = DatabaseWorkExperience | { error: string };

interface CreateWorkExperienceRequest extends Request {
  body: WorkExperience;
}

interface UpdateWorkExperienceRequest extends Request {
  params: { experienceId: string };
  body: WorkExperienceUpdate;
}

interface DeleteWorkExperienceRequest extends Request {
  params: { experienceId: string };
}

interface GetWorkExperiencesRequest extends Request {
  params: { username: string };
}

interface GetWorkExperienceByIdRequest extends Request {
  params: { experienceId: string };
}
