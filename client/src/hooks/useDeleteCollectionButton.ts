import { useNavigate, useParams } from 'react-router-dom';
import { deleteCollection } from '../services/collectionService';
import useUserContext from './useUserContext';
import { useState } from 'react';

/**
 * Custom hook to manage the state and behavior of the delete collection button.
 *
 * @returns An object containing the following:
 * - handleDeleteCollection - A function to handle the button click.
 */
const useDeleteCollectionButton = () => {
  const { user } = useUserContext();
  const navigate = useNavigate();
  const { username } = useParams();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // confirm delete experience
  const requestDelete = (experienceId: string) => {
    setPendingDeleteId(experienceId);
    setShowConfirmation(true);
  };

  // delete an experience
  const confirmDeleteExperience = async () => {
    if (!pendingDeleteId) return;
    await deleteCollection(pendingDeleteId, user.username);
    setPendingDeleteId(null);
    setShowConfirmation(false);
    navigate(`/collections/${username}`);
  };

  return {
    requestDelete,
    confirmDeleteExperience,
    showConfirmation,
    pendingDeleteId,
    setShowConfirmation,
  };
};

export default useDeleteCollectionButton;
