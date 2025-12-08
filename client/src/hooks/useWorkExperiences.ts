import { useState, useEffect } from 'react';
import {
  createWorkExperience,
  getWorkExperiencesByUser,
  updateWorkExperience,
  deleteWorkExperience,
} from '../services/workExperienceService';
import useUserContext from './useUserContext';
import {
  DatabaseWorkExperience,
  WorkExperience,
  WorkExperienceUpdatePayload,
  WorkExperienceUpdate,
} from '../types/types';

const useWorkExperiences = (username: string) => {
  const { user, socket } = useUserContext();
  const [experiences, setExperiences] = useState<DatabaseWorkExperience[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const canEdit = user.username === username;

  useEffect(() => {
    // fetch work experiences
    const fetchExperiences = async () => {
      try {
        setLoading(true);
        const data = await getWorkExperiencesByUser(username);
        setExperiences(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch work experiences: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchExperiences();
  }, [username]);

  // create new work experience
  const handleAddExperience = async (newExperience: WorkExperience) => {
    try {
      setLoading(true);
      await createWorkExperience(newExperience);
      setError(null);
    } catch (err) {
      setError('Failed to create work experience: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // update an experience
  const handleUpdateExperience = async (
    experienceId: string,
    updatedData: WorkExperienceUpdate,
  ) => {
    try {
      setLoading(true);
      const updated = await updateWorkExperience(experienceId, updatedData);
      setExperiences(prev =>
        prev.map(exp => (exp._id.toString() === experienceId ? updated : exp)),
      );
      setError(null);
    } catch (err) {
      setError('Failed to update work experience: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // confirm delete experience
  const requestDelete = (experienceId: string) => {
    setPendingDeleteId(experienceId);
    setShowConfirmation(true);
  };

  // delete an experience
  const confirmDeleteExperience = async () => {
    if (!pendingDeleteId) return;
    try {
      setLoading(true);
      await deleteWorkExperience(pendingDeleteId);
      setExperiences(prev => prev.filter(exp => exp._id.toString() !== pendingDeleteId));
      setError(null);
    } catch (err) {
      setError('Failed to delete work experience: ' + (err as Error).message);
    } finally {
      setLoading(false);
      setPendingDeleteId(null);
      setShowConfirmation(false);
    }
  };

  // handle socket updates for real-time changes
  useEffect(() => {
    if (!socket) return;

    const handleWorkExperienceUpdated = (workExperienceUpdate: WorkExperienceUpdatePayload) => {
      switch (workExperienceUpdate.type) {
        case 'created':
          setExperiences(prev => [workExperienceUpdate.workExperience, ...prev]);
          break;
        case 'updated':
          setExperiences(prev =>
            prev.map(exp =>
              exp._id.toString() === workExperienceUpdate.workExperience._id.toString()
                ? workExperienceUpdate.workExperience
                : exp,
            ),
          );
          break;
        case 'deleted':
          setExperiences(prev =>
            prev.filter(
              exp => exp._id.toString() !== workExperienceUpdate.workExperience._id.toString(),
            ),
          );
          break;
        default:
          break;
      }
    };
    socket.on('workExperienceUpdate', handleWorkExperienceUpdated);

    return () => {
      socket.off('workExperienceUpdate', handleWorkExperienceUpdated);
    };
  }, [socket]);

  return {
    experiences,
    loading,
    error,
    canEdit,
    handleAddExperience,
    handleUpdateExperience,
    requestDelete,
    confirmDeleteExperience,
    showConfirmation,
    pendingDeleteId,
    setShowConfirmation,
  };
};

export default useWorkExperiences;
