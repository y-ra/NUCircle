import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CommunityUpdatePayload,
  DatabaseCommunity,
  PopulatedDatabaseQuestion,
} from '../types/types';
import useUserContext from './useUserContext';
import { deleteCommunity, getCommunityById } from '../services/communityService';
import { getCommunityQuestionsById } from '../services/questionService';
import { getUserByUsername } from '../services/userService';

/**
 * Custom hook to manage the state and logic for the community page, including
 * fetching community details and related questions.
 *
 * @returns An object containing the following:
 * - `community`: The community object.
 * - `communityQuestions`: An array of questions related to the community.
 * - `username`: The username of the logged-in user.
 * - `handleDeleteCommunity`: Function to handle deleting the community.
 */
const useCommunityPage = () => {
  const { user, socket } = useUserContext();
  const [community, setCommunity] = useState<DatabaseCommunity | null>(null);
  const [communityQuestions, setCommunityQuestions] = useState<PopulatedDatabaseQuestion[]>([]);
  const [membersOnlineStatus, setMembersOnlineStatus] = useState<
    Record<string, { isOnline: boolean }>
  >({});
  const navigate = useNavigate();

  const { communityID } = useParams();

  const fetchCommunity = async (communityId: string) => {
    setCommunity(await getCommunityById(communityId));
  };

  const fetchCommunityQuestions = async (communityId: string) => {
    const questions = await getCommunityQuestionsById(communityId);
    setCommunityQuestions(questions);
  };

  const fetchMembersOnlineStatus = async (members: string[]) => {
    const statusMap: Record<string, { isOnline: boolean }> = {};

    for (const username of members) {
      try {
        const userInfo = await getUserByUsername(username);
        if (!('error' in userInfo)) {
          statusMap[username] = { isOnline: userInfo.isOnline ?? false };
        }
      } catch (error) {
        statusMap[username] = { isOnline: false };
      }
    }

    setMembersOnlineStatus(statusMap);
  };

  const handleDeleteCommunity = async () => {
    if (community && community.admin === user.username) {
      await deleteCommunity(community._id.toString(), user.username);
      navigate('/communities');
    }
  };

  useEffect(() => {
    if (communityID) {
      fetchCommunity(communityID);
      fetchCommunityQuestions(communityID);
    }

    const handleCommunityUpdate = (communityUpdate: CommunityUpdatePayload) => {
      if (
        communityUpdate.type === 'updated' &&
        communityUpdate.community._id.toString() === communityID
      ) {
        setCommunity(communityUpdate.community);
        fetchMembersOnlineStatus(communityUpdate.community.participants);
      }
    };

    const handleQuestionUpdate = (questionUpdate: PopulatedDatabaseQuestion) => {
      if (questionUpdate.community?._id.toString() !== communityID) return;

      setCommunityQuestions(prevQuestions => {
        const questionExists = prevQuestions.some(q => q._id === questionUpdate._id);

        if (questionExists) {
          // Update the existing question
          return prevQuestions.map(q => (q._id === questionUpdate._id ? questionUpdate : q));
        }

        return [questionUpdate, ...prevQuestions];
      });
    };

    const handleUserStatusUpdate = (payload: {
      username: string;
      isOnline: boolean;
      lastSeen?: Date;
    }) => {
      setMembersOnlineStatus(prev => ({
        ...prev,
        [payload.username]: { isOnline: payload.isOnline },
      }));
    };

    socket.on('communityUpdate', handleCommunityUpdate);
    socket.on('questionUpdate', handleQuestionUpdate);
    socket.on('userStatusUpdate', handleUserStatusUpdate);

    return () => {
      socket.off('communityUpdate', handleCommunityUpdate);
      socket.off('questionUpdate', handleQuestionUpdate);
      socket.off('userStatusUpdate', handleUserStatusUpdate);
    };
  }, [communityID, socket]);

  useEffect(() => {
    if (community?.participants) {
      fetchMembersOnlineStatus(community.participants);
    }
  }, [community?.participants]);

  const isPartOfCommunity = community ? community.participants.includes(user.username) : false;

  return {
    community,
    communityQuestions,
    user,
    handleDeleteCommunity,
    membersOnlineStatus,
    isPartOfCommunity,
  };
};

export default useCommunityPage;
