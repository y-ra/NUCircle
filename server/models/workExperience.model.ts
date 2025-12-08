import mongoose, { Model } from 'mongoose';
import workExperienceSchema from './schema/workExperience.schema';
import { DatabaseWorkExperience } from '../types/types';

/**
 * Mongoose model for the `WorkExperience` collection.
 *
 * This model is created using the `DataBaseWorkExperience` interface and the `workExperienceSchema`, representing the
 * `WorkExperience` collection in the MongoDB database, and provides an interface for interacting with
 * the stored work experiences.
 *
 * @type {Model<DatabaseWorkExperience>}
 */
const WorkExperienceModel: Model<DatabaseWorkExperience> = mongoose.model<DatabaseWorkExperience>(
  'WorkExperience',
  workExperienceSchema,
);

export default WorkExperienceModel;
