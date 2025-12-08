import { Schema } from 'mongoose';

/**
 * Mongoose schema for the Work Experience collection.
 *
 * This schema defines the structure for storing work experiences in the database.
 * Each Work Experience includes the following fields:
 * - 'username': The username of the user associated with this work experience.
 * - `title`: The title of the work experience.
 * - `company`: The company where the work experience took place.
 * - `type`: The type of work experience (co-op, internship, full-time, etc.).
 * - `location`: The location of the work experience.
 * - `startDate`: The start date of the work experience.
 * - `endDate`: The end date of the work experience (optional).
 * - `description`: A description of the work experience (optional).
 */
const workExperienceSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    startDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
  },
  { collection: 'WorkExperience' },
);

export default workExperienceSchema;
