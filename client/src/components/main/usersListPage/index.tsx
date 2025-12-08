import './index.css';
import { useNavigate } from 'react-router-dom';
import UserCardView from './userCard';
import UsersListHeader from './header';
import useUsersListPage from '../../../hooks/useUsersListPage';
import { SafeDatabaseUser } from '../../../types/types';
import useUserContext from '../../../hooks/useUserContext';

interface UserListPageProps {
  handleUserSelect?: (user: SafeDatabaseUser) => void;
  showLeaderboard?: boolean;
}

const UsersListPage = (props: UserListPageProps) => {
  const {
    userList,
    leaderboard,
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
  } = useUsersListPage();

  const { handleUserSelect = null } = props;
  const { user: currentUser } = useUserContext();
  const navigate = useNavigate();
  const showLeaderboard = props.showLeaderboard ?? true;

  const handleUserCardViewClickHandler = (user: SafeDatabaseUser): void => {
    if (handleUserSelect) {
      handleUserSelect(user);
    } else if (user.username) {
      navigate(`/user/${user.username}`);
    }
  };

  return (
    <div className='user-card-container'>
      <UsersListHeader
        userCount={userList.length}
        setUserFilter={setSearchQuery}
        filters={filters}
        updateFilter={updateFilter}
        handleSearch={handleSearch}
        handleClearSearch={handleClearSearch}
        isSearching={isSearching}
        showFilters={showFilters}
        toggleFilters={toggleFilters}
        majors={majors}
        graduationYears={graduationYears}
        communities={communities}
      />
      <div style={{ display: 'flex' }}>
        {/* Left column: All users with search/filter */}
        <div style={{ flex: 1 }}>
          <div id='users_list' className='users_list'>
            {userList.map((user, idx) => (
              <UserCardView
                key={idx}
                user={user}
                handleUserCardViewClickHandler={handleUserCardViewClickHandler}
                onChallengeClick={handleChallengeClick}
                currentUsername={currentUser?.username || ''}
              />
            ))}
          </div>
          {(!userList.length || userList.length === 0) && (
            <div className='bold_title right_padding'>No Users Found</div>
          )}
        </div>
        {showLeaderboard && (
          /* Right column: Global leaderboard */
          <div style={{ width: '250px', marginRight: '30px' }}>
            <h3 className='leaderboard-title'>🏆 Leaderboard</h3>
            <div className='users_list'>
              {leaderboard.map((user, index) => (
                <div
                  key={user._id.toString()}
                  className='userCard'
                  onClick={() => navigate(`/user/${user.username}`)}
                  style={{ cursor: 'pointer', padding: '10px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                    <div>
                      <span style={{ fontSize: '1.2em', marginRight: '8px' }}>
                        {index === 0 && '🥇'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                        {index > 2 && `#${index + 1}`}
                      </span>
                      <span>{user.username}</span>
                    </div>
                    <div style={{ color: '#82c0ff', fontWeight: 'bold' }}>
                      {user.points || 0} pts
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersListPage;
