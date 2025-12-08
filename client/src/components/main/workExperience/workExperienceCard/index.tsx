import { DatabaseWorkExperience, WorkExperienceUpdate } from '../../../../types/types';
import { useState } from 'react';
import './index.css';

interface WorkExperienceCardProps {
  experience: DatabaseWorkExperience;
  canEdit: boolean;
  onUpdate: (id: string, updated: WorkExperienceUpdate) => void;
  onDelete: (id: string) => void;
}

const WorkExperienceCard = ({
  experience,
  canEdit,
  onUpdate,
  onDelete,
}: WorkExperienceCardProps) => {
  const [editMode, setEditMode] = useState<boolean>(false);
  const [formState, setFormState] = useState<WorkExperienceUpdate>({
    title: experience.title,
    company: experience.company,
    type: experience.type,
    location: experience.location,
    startDate: experience.startDate ? experience.startDate.substring(0, 10) : '',
    endDate: experience.endDate ? experience.endDate.substring(0, 10) : '',
    description: experience.description || '',
  });

  const handleSave = () => {
    onUpdate(experience._id.toString(), formState);
    setEditMode(false);
  };
  if (editMode && canEdit) {
    return (
      <div className='work-experience-card edit-mode'>
        <div className='form-row'>
          <div className='field-group'>
            <label className='field-label'>Title</label>
            <input
              className='input-field'
              id='WE-title-input'
              type='text'
              value={formState.title}
              onChange={e => setFormState({ ...formState, title: e.target.value })}
            />
          </div>

          <div className='field-group'>
            <label className='field-label'>Company</label>
            <input
              className='input-field'
              id='WE-company-input'
              type='text'
              value={formState.company}
              onChange={e => setFormState({ ...formState, company: e.target.value })}
            />
          </div>
        </div>

        <div className='form-row'>
          <div className='field-group'>
            <label className='field-label'>Type</label>
            <select
              name='type'
              value={formState.type}
              onChange={e => setFormState({ ...formState, type: e.target.value })}
              className='input-field'
              required>
              <option value=''>Select type . . .</option>
              <option value='Co-op'>Co-op</option>
              <option value='Internship'>Internship</option>
              <option value='Full-time'>Full-time</option>
              <option value='Part-time'>Part-time</option>
            </select>
          </div>

          <div className='field-group'>
            <label className='field-label'>Location</label>
            <input
              className='input-field'
              id='WE-location-input'
              type='text'
              value={formState.location}
              onChange={e => setFormState({ ...formState, location: e.target.value })}
            />
          </div>
        </div>

        <div className='form-row'>
          <div className='field-group'>
            <label className='field-label'>Start Date</label>
            <input
              className='input-field'
              type='date'
              value={formState.startDate || ''}
              onChange={e => setFormState({ ...formState, startDate: e.target.value })}
            />
          </div>

          <div className='field-group'>
            <label className='field-label'>End Date</label>
            <input
              className='input-field'
              type='date'
              value={formState.endDate || ''}
              onChange={e => setFormState({ ...formState, endDate: e.target.value })}
            />
          </div>
        </div>

        <div className='field-group full-width'>
          <label className='field-label'>Description</label>
          <textarea
            className='input-description'
            value={formState.description}
            onChange={e => setFormState({ ...formState, description: e.target.value })}
          />
        </div>

        <div className='actions'>
          <button onClick={() => setEditMode(false)} className='button-primary cancel'>
            Cancel
          </button>
          <button onClick={handleSave} className='button-primary'>
            Save
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className='work-experience-card'>
      <div className='works-header'>
        <div>
          <span id='work-experience-title'>{experience.title}</span> - {experience.company}
        </div>
        <div className='date-range'>
          {new Date(experience.startDate).toLocaleDateString()} -{' '}
          {experience.endDate ? new Date(experience.endDate).toLocaleDateString() : 'Present'}
        </div>
      </div>
      <div className='work-type-location'>
        {experience.type} | {experience.location}
      </div>

      {experience.description && <div className='work-description'>{experience.description}</div>}
      {canEdit && (
        <div className='actions'>
          <button className='edit-button' onClick={() => setEditMode(true)}>
            <svg
              width='22'
              height='22'
              viewBox='0 0 21 21'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'>
              <g clip-path='url(#clip0_368_101)'>
                <path
                  d='M13.1249 4.37503L16.6249 7.87503M18.5272 5.96053C18.9898 5.49802 19.2498 4.87069 19.2498 4.21653C19.2499 3.56236 18.9901 2.93496 18.5276 2.47234C18.0651 2.00972 17.4378 1.74978 16.7836 1.74969C16.1295 1.74961 15.5021 2.0094 15.0394 2.4719L3.36169 14.1523C3.15853 14.3548 3.00829 14.6042 2.92419 14.8785L1.76832 18.6865C1.7457 18.7622 1.744 18.8426 1.76337 18.9191C1.78275 18.9957 1.8225 19.0656 1.87839 19.1214C1.93428 19.1772 2.00424 19.2168 2.08083 19.2361C2.15743 19.2554 2.23781 19.2535 2.31344 19.2308L6.12232 18.0758C6.39634 17.9924 6.64572 17.8431 6.84857 17.6409L18.5272 5.96053Z'
                  stroke='#82C0FF'
                  stroke-width='2'
                  stroke-linecap='round'
                  stroke-linejoin='round'
                />
              </g>
              <defs>
                <clipPath id='clip0_368_101'>
                  <rect width='21' height='21' fill='white' />
                </clipPath>
              </defs>
            </svg>
          </button>
          <button className='delete-button' onClick={() => onDelete(experience._id.toString())}>
            <svg
              width='28'
              height='28'
              viewBox='0 0 24 24'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'>
              <path
                d='M7 21C6.45 21 5.97934 20.8043 5.588 20.413C5.19667 20.0217 5.00067 19.5507 5 19V6C4.71667 6 4.47934 5.904 4.288 5.712C4.09667 5.52 4.00067 5.28267 4 5C3.99934 4.71733 4.09534 4.48 4.288 4.288C4.48067 4.096 4.718 4 5 4H9C9 3.71667 9.096 3.47933 9.288 3.288C9.48 3.09667 9.71734 3.00067 10 3H14C14.2833 3 14.521 3.096 14.713 3.288C14.905 3.48 15.0007 3.71733 15 4H19C19.2833 4 19.521 4.096 19.713 4.288C19.905 4.48 20.0007 4.71733 20 5C19.9993 5.28267 19.9033 5.52033 19.712 5.713C19.5207 5.90567 19.2833 6.00133 19 6V19C19 19.55 18.8043 20.021 18.413 20.413C18.0217 20.805 17.5507 21.0007 17 21H7ZM17 6H7V19H17V6ZM10 17C10.2833 17 10.521 16.904 10.713 16.712C10.905 16.52 11.0007 16.2827 11 16V9C11 8.71667 10.904 8.47933 10.712 8.288C10.52 8.09667 10.2827 8.00067 10 8C9.71734 7.99933 9.48 8.09533 9.288 8.288C9.096 8.48067 9 8.718 9 9V16C9 16.2833 9.096 16.521 9.288 16.713C9.48 16.905 9.71734 17.0007 10 17ZM14 17C14.2833 17 14.521 16.904 14.713 16.712C14.905 16.52 15.0007 16.2827 15 16V9C15 8.71667 14.904 8.47933 14.712 8.288C14.52 8.09667 14.2827 8.00067 14 8C13.7173 7.99933 13.48 8.09533 13.288 8.288C13.096 8.48067 13 8.718 13 9V16C13 16.2833 13.096 16.521 13.288 16.713C13.48 16.905 13.7173 17.0007 14 17Z'
                fill='#F16262'
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkExperienceCard;
