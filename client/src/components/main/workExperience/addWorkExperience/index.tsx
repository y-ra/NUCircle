import { useState } from 'react';
import { WorkExperience } from '../../../../types/types';
import './index.css';

interface AddWorkExperienceFormProps {
  onAdd: (newExperience: WorkExperience) => void;
  username: string;
}

const AddWorkExperienceForm = ({ onAdd, username }: AddWorkExperienceFormProps) => {
  const [formState, setFormState] = useState<WorkExperience>({
    username: username,
    title: '',
    company: '',
    type: '',
    location: '',
    startDate: '',
    endDate: '',
    description: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormState(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formState.title ||
      !formState.company ||
      !formState.type ||
      !formState.location ||
      !formState.startDate
    ) {
      setError('Title, Company, Type, Location, and Start Date are required.');
      return;
    }
    setError(null);
    onAdd(formState);
    // Reset form
    setFormState({
      username: username,
      title: '',
      company: '',
      type: '',
      location: '',
      startDate: '',
      endDate: '',
      description: '',
    });
  };
  return (
    <div className='work-experience-form-container'>
      <h3>Add Work Experience</h3>

      {error && <p className='error-message'>{error}</p>}

      <form className='work-experience-form' onSubmit={handleSubmit}>
        <label className='input-text'>
          <div>
            Title <span className='mandatory'>*</span>
          </div>
          <input
            type='text'
            name='title'
            value={formState.title}
            onChange={handleChange}
            className='input-field'
            required
          />
        </label>

        <label className='input-text'>
          <div>
            Company <span className='mandatory'>*</span>
          </div>
          <input
            type='text'
            name='company'
            value={formState.company}
            onChange={handleChange}
            className='input-field'
            required
          />
        </label>

        <label className='input-text'>
          <div>
            Type <span className='mandatory'>*</span>
          </div>
          <select
            name='type'
            value={formState.type}
            onChange={handleChange}
            className='input-field'
            required>
            <option value=''>Select type . . .</option>
            <option value='Co-op'>Co-op</option>
            <option value='Internship'>Internship</option>
            <option value='Full-time'>Full-time</option>
            <option value='Part-time'>Part-time</option>
          </select>
        </label>

        <label className='input-text'>
          <div>
            Location <span className='mandatory'>*</span>
          </div>
          <input
            type='text'
            name='location'
            value={formState.location}
            onChange={handleChange}
            className='input-field'
            required
          />
        </label>

        <label className='input-text'>
          <div>
            Start Date <span className='mandatory'>*</span>
          </div>
          <input
            type='date'
            name='startDate'
            value={formState.startDate}
            onChange={handleChange}
            className='input-field'
            required
          />
        </label>

        <label className='input-text'>
          End Date
          <input
            type='date'
            name='endDate'
            value={formState.endDate}
            onChange={handleChange}
            className='input-field'
          />
        </label>

        <label className='input-text'>
          Description
          <textarea
            className='input-description'
            name='description'
            value={formState.description}
            onChange={handleChange}
          />
        </label>

        <div className='form-actions'>
          <button className='form_postBtn' type='submit'>
            Save
          </button>
          <div className='mandatory_indicator'>* indicates mandatory fields</div>
        </div>
      </form>
    </div>
  );
};

export default AddWorkExperienceForm;
