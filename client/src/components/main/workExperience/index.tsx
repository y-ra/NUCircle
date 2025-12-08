import useWorkExperiences from '../../../hooks/useWorkExperiences';
import './index.css';
import WorkExperienceCard from './workExperienceCard';
import AddWorkExperienceForm from './addWorkExperience';
import { useState } from 'react';

interface WorkExperienceListProps {
  username: string;
}

const WorkExperienceList = ({ username }: WorkExperienceListProps) => {
  const {
    experiences,
    loading,
    error,
    canEdit,
    handleAddExperience,
    handleUpdateExperience,
    requestDelete,
    confirmDeleteExperience,
    showConfirmation,
    setShowConfirmation,
  } = useWorkExperiences(username);

  const [showForm, setShowForm] = useState(false);

  return (
    <div className='work-experience-section'>
      <div className='work-experience-header'>
        <h2 style={{ fontSize: '30px' }}>Work Experience</h2>
        {canEdit && (
          <button className='add-work-button' onClick={() => setShowForm(prev => !prev)}>
            {showForm ? 'Cancel' : '+ Add'}
          </button>
        )}
      </div>

      {showForm && canEdit && (
        <AddWorkExperienceForm
          onAdd={data => {
            handleAddExperience(data);
            setShowForm(false);
          }}
          username={username}
        />
      )}

      {loading && <p>Loading work experiences...</p>}
      {error && <p className='error-message'>{error}</p>}
      {experiences.length === 0 ? (
        <p>No work experiences added yet.</p>
      ) : (
        experiences.map(exp => (
          <WorkExperienceCard
            key={exp._id.toString()}
            experience={exp}
            canEdit={canEdit}
            onUpdate={handleUpdateExperience}
            onDelete={requestDelete}
          />
        ))
      )}

      {showConfirmation && (
        <div className='modal'>
          <div className='modal-content'>
            <p>
              Are you sure you want to delete this work experience? This action cannot be undone.
            </p>
            <div className='modal-actions'>
              <button className='button button-danger' onClick={confirmDeleteExperience}>
                Confirm
              </button>
              <button
                className='button button-secondary'
                onClick={() => setShowConfirmation(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkExperienceList;
