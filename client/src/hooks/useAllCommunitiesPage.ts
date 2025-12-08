import { ChangeEvent, useEffect, useState } from 'react';
import useUserContext from './useUserContext';
import { getCommunities } from '../services/communityService';
import { CommunityUpdatePayload, DatabaseCommunity } from '../types/types';

/**
 * Custom hook to manage the state and logic for the all communities page, including
 * fetching communities, handling search input, and joining communities.
 *
 * @returns An object containing the following:
 * - communities: The list of communities.
 * - search: The current search input value.
 * - handleInputChange: Function to handle changes in the search input.
 * - error: Any error message encountered during fetching.
 * - setError: Function to set the error message.
 */
const useAllCommunitiesPage = () => {
  const { socket } = useUserContext();
  const [communities, setCommunities] = useState<DatabaseCommunity[]>([]);
  const [search, setSearch] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value.toLowerCase());
  };

  useEffect(() => {
    let isMounted = true;

    const fetchCommunities = async () => {
      try {
        const fetchedCommunities = await getCommunities();
        if (isMounted) {
          setCommunities(fetchedCommunities);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError('Failed to fetch communities');
        }
      }
    };

    const handleCommunityUpdate = (communityUpdate: CommunityUpdatePayload) => {
      if (!isMounted) return;

      switch (communityUpdate.type) {
        case 'created':
          setCommunities(prev => [communityUpdate.community, ...prev]);
          break;
        case 'updated':
          setCommunities(prev =>
            prev.map(community =>
              community._id === communityUpdate.community._id
                ? { ...community, ...communityUpdate.community }
                : community,
            ),
          );
          break;
        case 'deleted':
          setCommunities(prev =>
            prev.filter(community => community._id !== communityUpdate.community._id),
          );
          break;
        default:
          break;
      }
    };

    fetchCommunities();

    if (socket && socket.connected) {
      socket.on('communityUpdate', handleCommunityUpdate);

      return () => {
        isMounted = false;
        if (socket && socket.connected) {
          socket.off('communityUpdate', handleCommunityUpdate);
        }
      };
    }

    return () => {
      isMounted = false;
    };
  }, [socket]);

  return {
    communities,
    search,
    handleInputChange,
    error,
    setError,
  };
};

export default useAllCommunitiesPage;
