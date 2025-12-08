import { DatabaseCommunity } from '@fake-stack-overflow/shared';
import useCommunityPage from '../../../../hooks/useCommunityPage';
// import CommunityMessages from '../../communityMessagesPage';
import QuestionView from '../../questionPage/question';
import CommunityMembershipButton from '../communityMembershipButton';
import './index.css';
import { NavLink } from 'react-router-dom';

/**
 * This component displays the details of a specific community, including its name, description,
 * members, and questions.
 */
const CommunityPage = () => {
  const {
    community,
    communityQuestions,
    user,
    handleDeleteCommunity,
    membersOnlineStatus,
    isPartOfCommunity,
  } = useCommunityPage();
  if (!community) {
    return <div className='loading'>Loading...</div>;
  }

  const getLongestStreakUser = (community: DatabaseCommunity): React.ReactNode => {
    if (!community.visitStreaks || community.visitStreaks.length === 0) {
      return <span>No streaks yet</span>;
    }

    const topStreaker = community.visitStreaks.reduce((max, current) =>
      current.longestStreak > max.longestStreak ? current : max,
    );

    const days = topStreaker.longestStreak === 1 ? 'day' : 'days';

    return (
      <>
        <strong>{topStreaker.username}</strong> holds the record with{' '}
        <strong>{topStreaker.longestStreak}</strong> {days}
      </>
    );
  };
  const onlineCount = community.participants.filter(
    username => membersOnlineStatus[username]?.isOnline === true,
  ).length;

  return (
    <div className='community-page-layout'>
      <main className='questions-section'>
        <h3 className='section-heading'>Questions</h3>
        {communityQuestions.map(q => (
          <QuestionView question={q} key={q._id.toString()} />
        ))}
      </main>

      <div className='community-sidebar'>
        <h2 className='community-title'>{community.name}</h2>
        <div className='community-chat-container'>
          {isPartOfCommunity && (
            <NavLink
              to={`/messaging/community-messages/${community._id}`}
              className='community-chat-btn'>
              <svg
                width='22'
                height='21'
                viewBox='0 0 26 25'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'>
                <path
                  d='M2.14062 22.9166V4.16665C2.14062 3.59373 2.35025 3.10328 2.76951 2.69529C3.18877 2.28731 3.69277 2.08331 4.28152 2.08331H21.4087C21.9974 2.08331 22.5014 2.28731 22.9207 2.69529C23.3399 3.10328 23.5496 3.59373 23.5496 4.16665V16.6666C23.5496 17.2396 23.3399 17.73 22.9207 18.138C22.5014 18.546 21.9974 18.75 21.4087 18.75H6.42241L2.14062 22.9166ZM5.51253 16.6666H21.4087V4.16665H4.28152V17.8385L5.51253 16.6666Z'
                  fill='#fff'
                />
              </svg>
              Chat
            </NavLink>
          )}
        </div>
        <p className='community-description'>{community.description}</p>

        <h4>Daily Streak</h4>
        <p>
          Community visited{' '}
          {(() => {
            // If user leaves community and rejoins within the same day, their streak is maintained
            const streak = community.participants.includes(user.username)
              ? community.visitStreaks?.find(v => v.username === user.username)?.currentStreak || 0
              : 0;
            return `${streak} ${streak === 1 ? 'day' : 'days'}`;
          })()}{' '}
          in a row
        </p>
        <h4>Longest Streak</h4>
        <p>{getLongestStreakUser(community)}</p>
        <CommunityMembershipButton community={community} />

        <div className='community-members'>
          <h3 className='section-heading'>Members ({onlineCount} online)</h3>
          <ul className='members-list'>
            {community?.participants.map(username => {
              const memberStatus = membersOnlineStatus[username];
              return (
                <li key={username} className='member-item'>
                  {memberStatus?.isOnline && <span className='online-indicator'></span>}
                  {username}
                </li>
              );
            })}
          </ul>
        </div>
        {community.admin === user.username && (
          <button className='delete-community-btn' onClick={handleDeleteCommunity}>
            Delete Community
          </button>
        )}
      </div>
    </div>
  );
};

export default CommunityPage;
