import { useEffect, useState } from 'react';
import useUserContext from './useUserContext';
import { SafeDatabaseUser, UserUpdatePayload } from '../types/types';
import {
  getUsers,
  searchUsers,
  getFilterOptions,
  UserSearchFilters,
  EnrichedUser,
  getLeaderboard,
} from '../services/userService';
import { getCommunities } from '../services/communityService';

const useUsersListPage = () => {
  const { socket } = useUserContext();

  const [filteredUsers, setFilteredUsers] = useState<EnrichedUser[]>([]);
  const [leaderboard, setLeaderboard] = useState<SafeDatabaseUser[]>([]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filters, setFilters] = useState<UserSearchFilters>({});
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const [majors, setMajors] = useState<string[]>([]);
  const [graduationYears, setGraduationYears] = useState<number[]>([]);
  const [communities, setCommunities] = useState<{ _id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [users, leaders] = await Promise.all([getUsers(), getLeaderboard(20)]);
        setFilteredUsers(users as EnrichedUser[]);
        setLeaderboard(leaders);
      } catch (error) {
        setFilteredUsers([]);
        setLeaderboard([]);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const options = await getFilterOptions();
        setMajors(options.majors);
        setGraduationYears(options.graduationYears);

        const allCommunities = await getCommunities();
        setCommunities(allCommunities.map(c => ({ _id: c._id.toString(), name: c.name })));
      } catch (error) {
        setMajors([]);
        setGraduationYears([]);
      }
    };

    fetchFilterOptions();
  }, []);

  const handleSearch = async () => {
    setIsSearching(true);

    try {
      const hasSearch = searchQuery.trim() !== '';
      const hasFilters = Object.values(filters).some(v => v);

      if (!hasSearch && !hasFilters) {
        const res = await getUsers();
        setFilteredUsers(res as EnrichedUser[]);
      } else {
        const results = await searchUsers(searchQuery, filters);
        setFilteredUsers(results);
      }
    } catch (error) {
      setFilteredUsers([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = async () => {
    setSearchQuery('');
    setFilters({});
    const res = await getUsers();
    setFilteredUsers(res as EnrichedUser[]);
  };

  const updateFilter = (key: keyof UserSearchFilters, value: string | number | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const toggleFilters = () => {
    setShowFilters(prev => !prev);
  };

  useEffect(() => {
    const removeUserFromList = (prevUserList: EnrichedUser[], user: SafeDatabaseUser) =>
      prevUserList.filter(otherUser => user.username !== otherUser.username);

    const addUserToList = (
      prevUserList: EnrichedUser[],
      user: SafeDatabaseUser,
    ): EnrichedUser[] => {
      const userExists = prevUserList.some(otherUser => otherUser.username === user.username);

      if (userExists) {
        return prevUserList.map(otherUser =>
          otherUser.username === user.username
            ? { ...user, workExperiences: [], communities: [] }
            : otherUser,
        );
      }

      return [{ ...user, workExperiences: [], communities: [] }, ...prevUserList];
    };

    const handleModifiedUserUpdate = (userUpdate: UserUpdatePayload) => {
      setFilteredUsers(prevList => {
        switch (userUpdate.type) {
          case 'created':
          case 'updated':
            return addUserToList(prevList, userUpdate.user);
          case 'deleted':
            return removeUserFromList(prevList, userUpdate.user);
          default:
            return prevList;
        }
      });

      // Update leaderboard
      setLeaderboard(prev => {
        const updated = prev.map(u =>
          u.username === userUpdate.user.username ? userUpdate.user : u,
        );
        return updated.sort((a, b) => (b.points || 0) - (a.points || 0));
      });
    };

    const handleUserStatusUpdate = (statusUpdate: {
      username: string;
      isOnline: boolean;
      lastSeen?: Date;
    }) => {
      setFilteredUsers(prevList =>
        prevList.map(user =>
          user.username === statusUpdate.username
            ? { ...user, isOnline: statusUpdate.isOnline, lastSeen: statusUpdate.lastSeen }
            : user,
        ),
      );
    };

    socket.on('userUpdate', handleModifiedUserUpdate);
    socket.on('userStatusUpdate', handleUserStatusUpdate);

    return () => {
      socket.off('userUpdate', handleModifiedUserUpdate);
      socket.off('userStatusUpdate', handleUserStatusUpdate);
    };
  }, [socket]);

  const handleChallengeClick = (recipientUsername: string) => {
    if (!socket) {
      return;
    }

    socket.emit('sendQuizInvite', recipientUsername);
  };

  return {
    userList: filteredUsers,
    leaderboard,
    searchQuery,
    setSearchQuery,
    filters,
    updateFilter,
    handleSearch,
    handleClearSearch,
    isSearching,
    showFilters,
    toggleFilters,
    majors,
    graduationYears,
    communities,
    handleChallengeClick,
  };
};

export default useUsersListPage;
