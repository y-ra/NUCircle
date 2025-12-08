import { DatabaseCommunity } from '../../../../types/types';
import useCommunityMembershipButton from '../../../../hooks/useCommunityMembershipButton';
import './index.css';

/**
 * CommunityMembershipButton component allows users to join or leave a community.
 * It displays a button that toggles between "Join" and "Leave" based on the user's membership status.
 */
const CommunityMembershipButton = ({ community }: { community: DatabaseCommunity }) => {
  const { username, handleCommunityMembership, error } = useCommunityMembershipButton();
  const isMember = community.participants.includes(username);

  return (
    <>
      <button
        className={`btn-action-community ${isMember ? 'btn-leave' : 'btn-join'}`}
        onClick={() => handleCommunityMembership(community._id)}>
        {isMember ? 'Leave' : 'Join'}
      </button>
      {error && <p className='community-error'>{error}</p>}
    </>
  );
};

export default CommunityMembershipButton;
