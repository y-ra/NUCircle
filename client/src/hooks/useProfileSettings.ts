import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getUserByUsername,
  deleteUser,
  resetPassword,
  updateBiography,
  getUserStats,
  updateUserStatVisibility,
  type UserStats,
  updateUserProfile,
  updateExternalLinks,
} from '../services/userService';
import badgeService from '../services/badgeService';
import { SafeDatabaseUser, Badge } from '../types/types';
import useUserContext from './useUserContext';

/**
 * A custom hook to encapsulate all logic/state for the ProfileSettings component.
 */
const useProfileSettings = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser, socket } = useUserContext();

  // Local state
  const [userData, setUserData] = useState<SafeDatabaseUser | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newCareerGoals, setNewCareerGoals] = useState('');
  const [newTechnicalInterests, setNewTechnicalInterests] = useState('');

  // User stats
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [editProfileMode, setEditProfileMode] = useState(false);
  const [newMajor, setNewMajor] = useState('');
  const [newGradYear, setNewGradYear] = useState<string | number>('');
  const [newCoopInterests, setNewCoopInterests] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [showStats, setShowStats] = useState(true);
  const [editLinksMode, setEditLinksMode] = useState(false);
  const [newLinkedIn, setNewLinkedIn] = useState('');
  const [newGithub, setNewGithub] = useState('');
  const [newPortfolio, setNewPortfolio] = useState('');
  const [linkValidationError, setLinkValidationError] = useState<string | null>(null);
  useEffect(() => {
    if (!username || !socket) return;

    const handleUserUpdate = (data: { user: SafeDatabaseUser; type: string }) => {
      if (data.user.username === username && data.type === 'updated') {
        setUserData(data.user);
        setShowStats(data.user.showStats ?? true);
      }
    };

    socket.on('userUpdate', handleUserUpdate);

    return () => {
      socket.off('userUpdate', handleUserUpdate);
    };
  }, [username, socket]);

  // For delete-user confirmation modal
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const [showPassword, setShowPassword] = useState(false);

  const canEditProfile =
    currentUser.username && userData?.username ? currentUser.username === userData.username : false;

  useEffect(() => {
    if (!username) return;

    const fetchUserData = async () => {
      try {
        setLoading(true);
        const data = await getUserByUsername(username);
        setUserData(data);

        // Initialize external links state
        setNewLinkedIn(data.externalLinks?.linkedin || '');
        setNewGithub(data.externalLinks?.github || '');
        setNewPortfolio(data.externalLinks?.portfolio || '');

        // Fetch badges for the user
        try {
          const userBadges = await badgeService.getUserBadges(username);
          setBadges(userBadges);
        } catch (badgeError) {
          // If badge fetch fails, just set empty array
          setBadges([]);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error fetching user profile';
        setErrorMessage(`Error fetching user profile: ${errorMsg}`);
        setUserData(null);
        setBadges([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [username]);

  useEffect(() => {
    // Initialize showStats from userData when it loads
    if (userData) {
      setShowStats(userData.showStats ?? true);
    }
  }, [userData]);

  /**
   * Fetch user statistics such as questions posted, answers posted, etc.
   */
  // Fetch stats when userData loads
  useEffect(() => {
    const fetchStats = async () => {
      if (!userData) return;

      try {
        const stats = await getUserStats(userData.username);
        setUserStats(stats);
      } catch (error) {
        setErrorMessage('Error fetching user stats');
      }
    };

    fetchStats();
  }, [userData]);

  /**
   * Toggles the visibility of the password fields.
   */
  const togglePasswordVisibility = () => {
    setShowPassword(prevState => !prevState);
  };

  /**
   * Validate the password fields before attempting to reset.
   */
  const validatePasswords = () => {
    if (newPassword.trim() === '' || confirmNewPassword.trim() === '') {
      setErrorMessage('Please enter and confirm your new password.');
      return false;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Passwords do not match.');
      return false;
    }
    return true;
  };

  /**
   * Handler for resetting the password
   */
  const handleResetPassword = async () => {
    if (!username) return;
    if (!validatePasswords()) {
      return;
    }
    try {
      await resetPassword(username, newPassword);
      setSuccessMessage('Password reset successful!');
      setErrorMessage(null);
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      setErrorMessage('Failed to reset password.');
      setSuccessMessage(null);
    }
  };

  const handleUpdateProfile = async () => {
    if (!username) {
      setErrorMessage('Username is required to update profile');
      setSuccessMessage(null);
      return;
    }

    try {
      const updates: {
        major?: string;
        graduationYear?: number;
        coopInterests?: string;
        firstName?: string;
        lastName?: string;
        careerGoals?: string;
        technicalInterests?: string;
      } = {};
      if (newMajor.trim()) updates.major = newMajor;
      if (newGradYear) updates.graduationYear = parseInt(newGradYear.toString());
      if (newCoopInterests && newCoopInterests.trim())
        updates.coopInterests = newCoopInterests.trim();
      if (newFirstName.trim()) updates.firstName = newFirstName;
      if (newLastName.trim()) updates.lastName = newLastName;
      if (newCareerGoals !== undefined) updates.careerGoals = newCareerGoals;
      if (newTechnicalInterests !== undefined) updates.technicalInterests = newTechnicalInterests;

      // Log the updates for debugging
      const updatedUser = await updateUserProfile(username, updates);
      setUserData(updatedUser);
      setEditProfileMode(false);
      setSuccessMessage('Profile updated successfully!');
      setErrorMessage(null);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to update profile';
      setErrorMessage(`Failed to update profile: ${errorMsg}`);
      setSuccessMessage(null);
    }
  };

  /**
   * Validates a URL string. Returns true if the URL is valid or empty.
   */
  const isValidUrl = (url: string): boolean => {
    if (!url.trim()) return true; // Empty URLs are allowed
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleUpdateExternalLinks = async () => {
    if (!username) return;

    // Validate all URLs
    const linkedinValid = isValidUrl(newLinkedIn);
    const githubValid = isValidUrl(newGithub);
    const portfolioValid = isValidUrl(newPortfolio);

    if (!linkedinValid || !githubValid || !portfolioValid) {
      setLinkValidationError('URLs must start with http:// or https://');
      setErrorMessage(null);
      setSuccessMessage(null);
      return;
    }

    setLinkValidationError(null);

    try {
      const updatedUser = await updateExternalLinks(username, {
        linkedin: newLinkedIn.trim() || undefined,
        github: newGithub.trim() || undefined,
        portfolio: newPortfolio.trim() || undefined,
      });
      setUserData(updatedUser);
      setEditLinksMode(false);
      setSuccessMessage('External links updated successfully!');
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage('Failed to update external links');
      setSuccessMessage(null);
    }
  };

  const handleUpdateBiography = async () => {
    if (!username) return;
    try {
      // Await the async call to update the biography
      const updatedUser = await updateBiography(username, newBio);

      // Ensure state updates occur sequentially after the API call completes
      await new Promise(resolve => {
        setUserData(updatedUser); // Update the user data
        resolve(null); // Resolve the promise
      });
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage('Failed to update biography.');
      setSuccessMessage(null);
    }
  };

  /**
   * Handler for deleting the user (triggers confirmation modal)
   */
  const handleDeleteUser = () => {
    if (!username) return;
    setShowConfirmation(true);
    setPendingAction(() => async () => {
      try {
        await deleteUser(username);
        setSuccessMessage(`User "${username}" deleted successfully.`);
        setErrorMessage(null);
        navigate('/');
      } catch (error) {
        setErrorMessage('Failed to delete user.');
        setSuccessMessage(null);
      } finally {
        setShowConfirmation(false);
      }
    });
  };

  const handleViewCollectionsPage = () => {
    navigate(`/collections/${username}`);
    return;
  };

  /**
   * Toggles visibility of the user's profile stats.
   */
  const toggleStatsVisibility = async () => {
    if (!userData) return;

    const newValue = !showStats;

    try {
      await updateUserStatVisibility(userData.username, 'showStats', newValue);
      setShowStats(newValue);
      setUserData(prev => (prev ? { ...prev, showStats: newValue } : null));
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  };

  return {
    userData,
    badges,
    newPassword,
    confirmNewPassword,
    setNewPassword,
    setConfirmNewPassword,
    loading,
    newBio,
    setNewBio,
    successMessage,
    errorMessage,
    showConfirmation,
    setShowConfirmation,
    pendingAction,
    setPendingAction,
    canEditProfile,
    showPassword,
    togglePasswordVisibility,
    handleResetPassword,
    handleUpdateBiography,
    handleDeleteUser,
    handleViewCollectionsPage,
    userStats,
    editProfileMode,
    setEditProfileMode,
    newMajor,
    setNewMajor,
    newGradYear,
    setNewGradYear,
    newCoopInterests,
    setNewCoopInterests,
    newFirstName,
    setNewFirstName,
    newLastName,
    setNewLastName,
    handleUpdateProfile,
    showStats,
    toggleStatsVisibility,
    editLinksMode,
    setEditLinksMode,
    newLinkedIn,
    setNewLinkedIn,
    newGithub,
    setNewGithub,
    newPortfolio,
    setNewPortfolio,
    handleUpdateExternalLinks,
    linkValidationError,
    setLinkValidationError,
    newCareerGoals,
    setNewCareerGoals,
    newTechnicalInterests,
    setNewTechnicalInterests,
  };
};

export default useProfileSettings;
