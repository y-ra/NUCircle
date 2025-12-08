import './index.css';
import useCommunityMessagesPage from '../../../hooks/useCommunityMessagesPage';
import MessageCard from '../messageCard';
import useUserContext from '../../../hooks/useUserContext';
import { useParams } from 'react-router-dom';

/**
 * Represents the CommunityMessagesPage component which displays the community chat room.
 * and provides functionality to send and receive messages.
 */
const CommunityMessages = () => {
  const { communityID } = useParams();
  // return <div>Community Messages Page - Under Construction</div>;
  const {
    communities,
    selectedCommunity,
    setSelectedCommunity,
    messages,
    newMessage,
    setNewMessage,
    handleSendMessage,
    error,
  } = useCommunityMessagesPage(communityID);
  const { user } = useUserContext();
  return (
    <div className='community-messages-page'>
      <h2 className='community-chat-header'>
        {selectedCommunity ? `My Community Chat: ${selectedCommunity.name}` : 'Select a Community'}
      </h2>
      <div className='community-selector'>
        {communities.map(community => (
          <button
            key={community._id.toString()}
            onClick={() => setSelectedCommunity(community)}
            className={
              selectedCommunity?._id === community._id ? 'community-btn active' : 'community-btn'
            }>
            {community.name}
          </button>
        ))}
      </div>

      <div className='messages-container'>
        {messages.map(message => (
          <MessageCard key={String(message._id)} message={message} currentUser={user.username} />
        ))}
      </div>
      <div className='community-message-input'>
        <input
          className='community-message-textbox'
          placeholder='Type your message here'
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
        />
        <div className='community-message-actions'>
          <button type='button' className='send-button' onClick={handleSendMessage}>
            Send
          </button>
          {error && <span className='error-message'>{error}</span>}
        </div>
      </div>
    </div>
  );
};

export default CommunityMessages;
