import * as React from 'react';
import './index.css';
import useProfileSettings from '../../hooks/useProfileSettings';
import Badges from '../main/badges';
import WorkExperienceList from '../main/workExperience';

const ProfileSettings: React.FC = () => {
  const {
    userData,
    badges,
    loading,
    newBio,
    newPassword,
    confirmNewPassword,
    successMessage,
    errorMessage,
    showConfirmation,
    pendingAction,
    canEditProfile,
    showPassword,
    togglePasswordVisibility,
    setNewBio,
    setNewPassword,
    setConfirmNewPassword,
    setShowConfirmation,
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
  } = useProfileSettings();

  if (loading) {
    return (
      <div className='profile-settings'>
        <div className='profile-card'>
          <h2>Loading user data...</h2>
        </div>
      </div>
    );
  }

  // Show error message if there's an error, even if userData is null
  if (errorMessage && !userData) {
    return (
      <div className='profile-settings'>
        <div className='profile-card'>
          <h2>Error Loading Profile</h2>
          <p className='error-message'>{errorMessage}</p>
        </div>
      </div>
    );
  }

  // Only show "No user data found" if loading is complete, there's no error, and no data
  if (!userData && !loading && !errorMessage) {
    return (
      <div className='profile-settings'>
        <div className='profile-card'>
          <h2>No user data found. Make sure the username parameter is correct.</h2>
        </div>
      </div>
    );
  }

  // If we still don't have userData at this point, don't render the rest
  if (!userData) {
    return null;
  }
  return (
    <div className='profile-settings'>
      <div className='profile-left-column'>
        <div className='profile-card'>
          <h2>
            {userData.firstName} {userData.lastName}
          </h2>
          <div className='profile-username'>@ {userData.username}</div>

          {successMessage && <p className='success-message'>{successMessage}</p>}
          {errorMessage && <p className='error-message'>{errorMessage}</p>}

          <div className='profile-info-section'>
            {!editProfileMode && (
              <div className='profile-info-display'>
                <div>
                  <strong>Major:</strong>
                  <p>{userData.major || 'Not specified'} </p>
                </div>
                <div>
                  <strong>Graduation Year:</strong>
                  <p>{userData.graduationYear || 'Not specified'} </p>
                </div>
                <div>
                  <strong>Co-op Interests:</strong>
                  <p>{userData.coopInterests || 'Not specified'} </p>
                </div>
                <div>
                  <strong>Career Goals:</strong>
                  <p>{userData.careerGoals || 'Not specified'} </p>
                </div>
                <div>
                  <strong>Technical Interests:</strong>
                  <p>{userData.technicalInterests || 'Not specified'}</p>
                </div>
                <div>
                  <strong>Biography:</strong>
                  <p>{userData.biography || 'No biography yet.'}</p>
                </div>
                {canEditProfile && (
                  <button
                    className='edit-profile-button'
                    onClick={() => {
                      setEditProfileMode(true);
                      setNewFirstName(userData.firstName || '');
                      setNewLastName(userData.lastName || '');
                      setNewMajor(userData.major || '');
                      setNewGradYear(userData.graduationYear || '');
                      setNewCoopInterests(userData.coopInterests || '');
                      setNewCareerGoals(userData.careerGoals || ' ');
                      setNewTechnicalInterests(userData.technicalInterests || ' ');
                      setNewBio(userData.biography || '');
                    }}>
                    Edit Profile Info
                  </button>
                )}
              </div>
            )}

            {editProfileMode && canEditProfile && (
              <div className='profile-edit'>
                <label>
                  <strong>First Name:</strong>
                  <input
                    className='input-text'
                    type='text'
                    value={newFirstName}
                    onChange={e => setNewFirstName(e.target.value)}
                    placeholder='Enter your first name'
                  />
                </label>
                <label>
                  <strong>Last Name:</strong>
                  <input
                    className='input-text'
                    type='text'
                    value={newLastName}
                    onChange={e => setNewLastName(e.target.value)}
                    placeholder='Enter your last name'
                  />
                </label>
                <label>
                  <strong>Major:</strong>
                  <input
                    className='input-text'
                    type='text'
                    value={newMajor}
                    onChange={e => setNewMajor(e.target.value)}
                    placeholder='Enter your major'
                  />
                </label>
                <label>
                  <strong>Graduation Year:</strong>
                  <input
                    className='input-text'
                    type='number'
                    value={newGradYear}
                    onChange={e => setNewGradYear(e.target.value)}
                    placeholder='Enter graduation year'
                    min='2020'
                    max='2035'
                  />
                </label>
                <label>
                  <strong>Co-op Interests:</strong>
                  <select
                    className='input-text'
                    value={newCoopInterests}
                    onChange={e => setNewCoopInterests(e.target.value)}>
                    <option value=''>Select co-op interest</option>
                    <option value='Searching for co-op'>Searching for co-op</option>
                    <option value='Completed co-ops'>Completed co-ops</option>
                    <option value='Not interested in co-op'>Not interested in co-op</option>
                  </select>
                </label>
                <label>
                  <strong>Career Goals:</strong>
                  <input
                    className='input-text'
                    type='text'
                    value={newCareerGoals}
                    onChange={e => setNewCareerGoals(e.target.value)}
                    placeholder='e.g., data science, finance, product management'
                  />
                  <small style={{ color: '#888', fontSize: '0.85em' }}>
                    Comma-separated values (e.g., "data science, finance")
                  </small>
                </label>
                <label>
                  <strong>Technical Interests:</strong>
                  <input
                    className='input-text'
                    type='text'
                    value={newTechnicalInterests}
                    onChange={e => setNewTechnicalInterests(e.target.value)}
                    placeholder='e.g., machine learning, web development, cloud computing'
                  />
                  <small style={{ color: '#888', fontSize: '0.85em' }}>
                    Comma-separated values (e.g., "machine learning, react")
                  </small>
                </label>
                <label>
                  <strong>Biography:</strong>
                  <textarea
                    className='input-text biography-input'
                    value={newBio}
                    onChange={e => setNewBio(e.target.value)}
                    placeholder='Write your biography here...'
                  />
                </label>
                <div className='profile-edit-actions'>
                  <button
                    className='cancel-profile-button'
                    onClick={() => setEditProfileMode(false)}>
                    Cancel
                  </button>
                  <button
                    className='edit-profile-button'
                    onClick={async () => {
                      await handleUpdateProfile();
                      await handleUpdateBiography();
                    }}>
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className='external-links-section'>
            <h4>External Links</h4>
            {!editLinksMode && (
              <div>
                {userData.externalLinks?.linkedin && (
                  <p>
                    <strong>LinkedIn:</strong>{' '}
                    <a
                      href={userData.externalLinks.linkedin}
                      target='_blank'
                      rel='noopener noreferrer'>
                      {userData.externalLinks.linkedin}
                    </a>
                  </p>
                )}
                {userData.externalLinks?.github && (
                  <p>
                    <strong>GitHub:</strong>{' '}
                    <a
                      href={userData.externalLinks.github}
                      target='_blank'
                      rel='noopener noreferrer'>
                      {userData.externalLinks.github}
                    </a>
                  </p>
                )}
                {userData.externalLinks?.portfolio && (
                  <p>
                    <strong>Portfolio:</strong>{' '}
                    <a
                      href={userData.externalLinks.portfolio}
                      target='_blank'
                      rel='noopener noreferrer'>
                      {userData.externalLinks.portfolio}
                    </a>
                  </p>
                )}
                {!userData.externalLinks?.linkedin &&
                  !userData.externalLinks?.github &&
                  !userData.externalLinks?.portfolio && <p>No external links added yet.</p>}
                {canEditProfile && (
                  <button
                    className='edit-profile-button'
                    onClick={() => {
                      setEditLinksMode(true);
                      setNewLinkedIn(userData.externalLinks?.linkedin || '');
                      setNewGithub(userData.externalLinks?.github || '');
                      setNewPortfolio(userData.externalLinks?.portfolio || '');
                    }}>
                    {userData.externalLinks?.linkedin ||
                    userData.externalLinks?.github ||
                    userData.externalLinks?.portfolio
                      ? 'Edit Links'
                      : 'Add Links'}
                  </button>
                )}
              </div>
            )}

            {editLinksMode && canEditProfile && (
              <div className='links-edit'>
                {linkValidationError && (
                  <p className='error-message link-error-message'>{linkValidationError}</p>
                )}
                <label>
                  <strong>LinkedIn:</strong>
                  <input
                    className='input-text'
                    type='url'
                    value={newLinkedIn}
                    onChange={e => {
                      setNewLinkedIn(e.target.value);
                      setLinkValidationError(null);
                    }}
                    placeholder='https://linkedin.com/in/yourprofile'
                  />
                </label>
                <label>
                  <strong>GitHub:</strong>
                  <input
                    className='input-text'
                    type='url'
                    value={newGithub}
                    onChange={e => {
                      setNewGithub(e.target.value);
                      setLinkValidationError(null);
                    }}
                    placeholder='https://github.com/yourusername'
                  />
                </label>
                <label>
                  <strong>Portfolio:</strong>
                  <input
                    className='input-text'
                    type='url'
                    value={newPortfolio}
                    onChange={e => {
                      setNewPortfolio(e.target.value);
                      setLinkValidationError(null);
                    }}
                    placeholder='https://yourportfolio.com'
                  />
                </label>
                <div className='profile-edit-actions'>
                  <button
                    className='cancel-profile-button'
                    onClick={() => {
                      setEditLinksMode(false);
                      setLinkValidationError(null);
                    }}>
                    Cancel
                  </button>
                  <button className='edit-profile-button' onClick={handleUpdateExternalLinks}>
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>

          <button className='view-collections-btn' onClick={handleViewCollectionsPage}>
            View Collections
          </button>
        </div>

        {canEditProfile && (
          <div className='password-reset-section'>
            <h4>Reset Password</h4>
            <input
              className='input-text'
              type={showPassword ? 'text' : 'password'}
              placeholder='New Password'
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
            <input
              className='input-text'
              type={showPassword ? 'text' : 'password'}
              placeholder='Confirm New Password'
              value={confirmNewPassword}
              onChange={e => setConfirmNewPassword(e.target.value)}
            />
            <div className='password-actions'>
              <button className='cancel-profile-button' onClick={togglePasswordVisibility}>
                {showPassword ? 'Hide Passwords' : 'Show Passwords'}
              </button>
              <button className='edit-profile-button' onClick={handleResetPassword}>
                Reset
              </button>
            </div>

            <h4>Danger Zone</h4>
            <button
              id='delete-btn'
              className='edit-profile-button danger'
              onClick={handleDeleteUser}>
              Delete This User
            </button>
          </div>
        )}

        {showConfirmation && (
          <div className='modal'>
            <div className='modal-content'>
              <p>
                Are you sure you want to delete user <strong>{userData?.username}</strong>? This
                action cannot be undone.
              </p>
              <div className='modal-actions'>
                <button className='button button-danger' onClick={() => pendingAction?.()}>
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

      <div className='profile-right-column'>
        <WorkExperienceList username={userData.username} />

        <div className='profile-right-bottom'>
          <div className='stats-section'>
            <h2 style={{ marginTop: '0px' }}>User Stats</h2>

            <div className='stats-grid'>
              {/* Date Joined Stat Box */}
              <div className='stat-box'>
                <div className='stat-label'>Date Joined</div>
                <div className='stat-value'>
                  {userData.dateJoined
                    ? new Date(userData.dateJoined).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'N/A'}
                </div>
              </div>

              {/* Points Stat Box */}
              {(showStats || canEditProfile) && (
                <div className='stat-box'>
                  <div className='stat-label'>Points</div>
                  <div className='stat-value'>{userData.points || 0}</div>
                </div>
              )}

              {/* Questions Stat Box */}
              {(showStats || canEditProfile) && (
                <div className='stat-box'>
                  <div className='stat-label'>Questions</div>
                  <div className='stat-value'>{userStats?.questionsPosted || 0}</div>
                </div>
              )}

              {/* Answers Stat Box */}
              {(showStats || canEditProfile) && (
                <div className='stat-box'>
                  <div className='stat-label'>Answers</div>
                  <div className='stat-value'>{userStats?.answersPosted || 0}</div>
                </div>
              )}

              {/* Communities Stat Box */}
              {(showStats || canEditProfile) && (
                <div className='stat-box'>
                  <div className='stat-label'>Communities</div>
                  <div className='stat-value'>{userStats?.communitiesJoined || 0}</div>
                </div>
              )}

              {/* Quizzes Stat Box */}
              {(showStats || canEditProfile) && (
                <div className='stat-box'>
                  <div className='stat-label'>Quizzes Won</div>
                  <div className='stat-value'>
                    {userStats?.quizzesWon || 0} / {userStats?.quizzesPlayed || 0}
                  </div>
                </div>
              )}
            </div>

            {/* Publish/Unpublish Stats Button */}
            {canEditProfile && (
              <button
                className='edit-profile-button'
                onClick={toggleStatsVisibility}
                style={{
                  backgroundColor: showStats ? '#939da6ff' : '#FF6F61',
                }}>
                {showStats ? 'Unpublish Stats' : 'Publish Stats'}
              </button>
            )}
          </div>
          <div className='badges-section'>
            <h2 id='badges-profile-title'>Badges</h2>
            <Badges badges={badges} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
