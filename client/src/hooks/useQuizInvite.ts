import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuizInvite } from '../types/types';
import useUserContext from './useUserContext';

/**
 * Custom hook to manage quiz invitation state and socket events.
 * It listens for incoming invitations and handles responses.
 */
const useQuizInvite = () => {
  const [pendingInvitation, setPendingInvite] = useState<QuizInvite | null>(null);
  const [isResponding, setIsResponding] = useState(false);
  const navigate = useNavigate();
  const { socket, user } = useUserContext();

  useEffect(() => {
    if (!socket) return;

    // Function for handling quiz invitations when incoming
    const handleRecievedInvite = (invite: QuizInvite) => {
      setPendingInvite(invite);
      setIsResponding(false);
    };

    // Function for handling when invitation is accepted
    const handleAcceptedInvite = (result: {
      inviteId: string;
      challengerUsername: string;
      recipientUsername: string;
      accepted: boolean;
      gameId?: string;
    }) => {
      setPendingInvite(null);
      setIsResponding(false);
      if (result.gameId) {
        // Navigate to the game page
        navigate(`/games/${result.gameId}`);
      }
    };

    // Function for handling when invitation is declined
    const handleDeclinedInvite = (result: {
      inviteId: string;
      challengerUsername: string;
      recipientUsername: string;
      accepted: boolean;
    }) => {
      setPendingInvite(null);
      setIsResponding(false);

      if (user?.username === result.challengerUsername) {
        alert(`${result.recipientUsername} declined your quiz challenge.`);
      }
    };

    // Register socket listeners
    socket.on('quizInviteReceived', handleRecievedInvite);
    socket.on('quizInviteAccepted', handleAcceptedInvite);
    socket.on('quizInviteDeclined', handleDeclinedInvite);

    return () => {
      socket.off('quizInviteReceived', handleRecievedInvite);
      socket.off('quizInviteAccepted', handleAcceptedInvite);
      socket.off('quizInviteDeclined', handleDeclinedInvite);
    };
  }, [socket, navigate, user]);

  // Handle the pending invitation
  const handlePendingAccept = () => {
    if (!socket || !pendingInvitation || isResponding) return;
    setIsResponding(true);
    socket.emit('respondToQuizInvite', pendingInvitation.id, true);
    // Modal will close when we receive 'quizInviteAccepted' event
  };

  // Function for handling when invitation is declined
  const handlePendingDecline = () => {
    if (!socket || !pendingInvitation || isResponding) return;
    setIsResponding(true);
    socket.emit('respondToQuizInvite', pendingInvitation.id, false);
    setPendingInvite(null);
    setIsResponding(false);
  };

  return {
    pendingInvitation,
    handlePendingAccept,
    handlePendingDecline,
    isResponding,
  };
};

export default useQuizInvite;
