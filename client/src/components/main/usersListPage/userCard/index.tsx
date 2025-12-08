import './index.css';
import { EnrichedUser } from '../../../../services/userService';

interface UserProps {
  user: EnrichedUser;
  handleUserCardViewClickHandler: (user: EnrichedUser) => void;
  onChallengeClick: (username: string) => void;
  currentUsername: string;
}

const UserCardView = (props: UserProps) => {
  const { user, handleUserCardViewClickHandler, onChallengeClick, currentUsername } = props;

  const workCompanies = new Set(user.workExperiences?.map(w => w.company.toLowerCase()) || []);

  // Filter out communities that match work experience companies
  const uniqueCommunities =
    user.communities?.filter(c => !workCompanies.has(c.name.toLowerCase())) || [];

  return (
    <div className='user_card' onClick={() => handleUserCardViewClickHandler(user)}>
      <div className='user_card_left'>
        <div className='user_card_name'>
          {user.firstName} {user.lastName}
        </div>
        <div className='userUsername'>
          {user.isOnline && <span className='online-indicator'></span>}
          {user.username}
        </div>

        {(user.workExperiences?.length > 0 ||
          user.major ||
          user.graduationYear ||
          user.communities?.length > 0) && (
          <div className='user-tags'>
            {user.workExperiences &&
              user.workExperiences.slice(0, 2).map((work, idx) => (
                <span key={idx} className='tag tag-work'>
                  {work.company}
                </span>
              ))}

            {user.major && <span className='tag tag-major'>{user.major}</span>}

            {user.graduationYear && <span className='tag tag-year'>{user.graduationYear}</span>}

            {uniqueCommunities.slice(0, 1).map((community, idx) => (
              <span key={idx} className='tag tag-community'>
                {community.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className='user_card_right'>
        <div className='user_card_joined'>joined {new Date(user.dateJoined).toUTCString()}</div>

        {user.isOnline && user.username !== currentUsername && (
          <button
            className='challenge-button'
            onClick={e => {
              e.stopPropagation();
              onChallengeClick(user.username);
            }}>
            Challenge to Quiz
          </button>
        )}

        <svg
          width='20'
          height='32'
          viewBox='0 0 20 32'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'>
          <path
            d='M12.2667 16L6.60261e-05 3.73333L3.7334 0L19.7334 16L3.7334 32L6.60261e-05 28.2667L12.2667 16Z'
            fill='#FF6B6B'
          />
        </svg>
      </div>
    </div>
  );
};

export default UserCardView;
