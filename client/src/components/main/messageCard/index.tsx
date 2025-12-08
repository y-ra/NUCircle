import { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './index.css';
import { DatabaseMessage } from '../../../types/types';
import { getMetaData } from '../../../tool';
import { toggleReaction } from '../../../services/messageService';

interface MessageCardProps {
  message: DatabaseMessage;
  currentUser: string;
}

/**
 * MessageCard component displays a single message with its sender and timestamp.
 *
 * @param message: The message object to display.
 */
const MessageCard = ({ message, currentUser }: MessageCardProps) => {
  const isMine = message.msgFrom === currentUser;

  const [reactions, setReactions] = useState(
    message.reactions || {
      love: { users: [], count: 0 },
      like: { users: [], count: 0 },
    },
  );

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (message.reactions) {
      setReactions(message.reactions);
    }
  }, [message.reactions]);

  const handleReaction = async (reactionType: 'love' | 'like') => {
    try {
      setReactions(prev => {
        const hasReacted = prev[reactionType].users.includes(currentUser);
        const updatedUsers = hasReacted
          ? prev[reactionType].users.filter(u => u !== currentUser)
          : [...prev[reactionType].users, currentUser];

        return {
          ...prev,
          [reactionType]: {
            users: updatedUsers,
            count: hasReacted
              ? Math.max(prev[reactionType].count - 1, 0)
              : prev[reactionType].count + 1,
          },
        };
      });

      await toggleReaction(message._id.toString(), reactionType, currentUser);
    } catch (err) {
      setError('Failed to toggle reaction');
    }
  };

  return (
    <div className={`message ${isMine ? 'message-mine' : 'message-other'}`}>
      <div className='message-header'>
        <div className='message-sender'>{message.msgFrom}</div>
        <div className='message-time'>{getMetaData(new Date(message.msgDateTime))}</div>
      </div>

      <div className='message-body'>
        <Markdown remarkPlugins={[remarkGfm]}>{message.msg}</Markdown>
      </div>
      <div className='message-footer'>
        <div className='message-reactions'>
          <button
            className={`reaction-btn ${reactions.like.users.includes(currentUser) ? 'active' : ''}`}
            onClick={() => handleReaction('like')}>
            <svg
              width='22'
              height='22'
              viewBox='0 0 24 24'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'>
              <path
                d='M14.9792 2.04485C14.0204 1.04045 12.4688 1.58045 12.062 2.75285C11.726 3.72005 11.2892 4.87925 10.8644 5.73245C9.59239 8.28365 8.85079 9.73445 6.80359 11.5513C6.5041 11.8047 6.16254 12.0037 5.79439 12.1393C4.43839 12.6745 3.16639 14.0785 3.49879 15.7453L3.92239 17.8633C4.03161 18.4097 4.29087 18.9149 4.67112 19.3223C5.05136 19.7297 5.53755 20.0231 6.07519 20.1697L12.7952 22.0021C13.5172 22.1987 14.2721 22.2431 15.0122 22.1326C15.7523 22.022 16.4613 21.7588 17.0942 21.3598C17.7272 20.9607 18.2703 20.4344 18.6892 19.8143C19.108 19.1942 19.3934 18.4939 19.5272 17.7577L20.3492 13.2445C20.4436 12.7256 20.4228 12.1923 20.2884 11.6824C20.154 11.1724 19.9091 10.6982 19.5712 10.2933C19.2333 9.88842 18.8105 9.56272 18.3328 9.33924C17.8551 9.11577 17.3342 8.99997 16.8068 9.00005H15.7472L15.7592 8.93765C15.8552 8.44685 15.9704 7.77365 16.0472 7.03805C16.1252 6.30605 16.1672 5.49605 16.106 4.74245C16.046 4.00325 15.8852 3.24365 15.5012 2.66645C15.3451 2.44489 15.1704 2.23694 14.9792 2.04485Z'
                fill='#feb641ff'
              />
            </svg>
            {reactions.like.count > 0 && reactions.like.count}
          </button>
          <button
            className={`reaction-btn ${reactions.love.users.includes(currentUser) ? 'active' : ''}`}
            onClick={() => handleReaction('love')}>
            <svg
              width='22'
              height='22'
              viewBox='0 0 24 24'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'>
              <path
                d='M2 9.13702C2 14 6.02 16.591 8.962 18.911C10 19.729 11 20.5 12 20.5C13 20.5 14 19.73 15.038 18.91C17.981 16.592 22 14 22 9.13802C22 4.27602 16.5 0.825015 12 5.50102C7.5 0.825015 2 4.27402 2 9.13702Z'
                fill='#FF4AB4'
              />
            </svg>
            {reactions.love.count > 0 && reactions.love.count}
          </button>
        </div>
        {error && <p className='error-text'>{error}</p>}
      </div>
    </div>
  );
};

export default MessageCard;
