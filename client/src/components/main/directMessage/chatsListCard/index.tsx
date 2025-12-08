import './index.css';
import { ObjectId } from 'mongodb';
import { PopulatedDatabaseChat } from '../../../../types/types';

/**
 * ChatsListCard component displays information about a chat and allows the user to select it.
 *
 * @param chat: The chat object containing details like participants and chat ID.
 * @param handleChatSelect: A function to handle the selection of a chat, receiving the chat's ID as an argument.
 */
const ChatsListCard = ({
  chat,
  handleChatSelect,
  participant,
  isActive,
}: {
  chat: PopulatedDatabaseChat;
  handleChatSelect: (chatID: ObjectId | undefined) => void;
  participant: string;
  isActive: boolean;
}) => (
  <div
    onClick={() => handleChatSelect(chat._id)}
    className={`chats-list-card ${isActive ? 'active-chat' : ''}`}>
    <p>
      <div className='chat-info'>
        <svg
          width='32'
          height='28'
          viewBox='0 0 32 28'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'>
          <path
            d='M15.6182 13C14.391 13 13.3405 12.6083 12.4666 11.825C11.5927 11.0417 11.1558 10.1 11.1558 9C11.1558 7.9 11.5927 6.95833 12.4666 6.175C13.3405 5.39167 14.391 5 15.6182 5C16.8454 5 17.8959 5.39167 18.7698 6.175C19.6437 6.95833 20.0806 7.9 20.0806 9C20.0806 10.1 19.6437 11.0417 18.7698 11.825C17.8959 12.6083 16.8454 13 15.6182 13ZM6.69336 21V18.2C6.69336 17.6333 6.85605 17.1125 7.18144 16.6375C7.50682 16.1625 7.93912 15.8 8.47833 15.55C9.63112 15.0333 10.8025 14.6458 11.9925 14.3875C13.1825 14.1292 14.391 14 15.6182 14C16.8454 14 18.054 14.1292 19.2439 14.3875C20.4339 14.6458 21.6053 15.0333 22.7581 15.55C23.2973 15.8 23.7296 16.1625 24.055 16.6375C24.3804 17.1125 24.5431 17.6333 24.5431 18.2V21H6.69336ZM8.92457 19H22.3119V18.2C22.3119 18.0167 22.2607 17.85 22.1585 17.7C22.0562 17.55 21.9214 17.4333 21.7541 17.35C20.75 16.9 19.7367 16.5625 18.714 16.3375C17.6914 16.1125 16.6594 16 15.6182 16C14.577 16 13.545 16.1125 12.5224 16.3375C11.4998 16.5625 10.4864 16.9 9.48238 17.35C9.31504 17.4333 9.18023 17.55 9.07797 17.7C8.97571 17.85 8.92457 18.0167 8.92457 18.2V19ZM15.6182 11C16.2318 11 16.7571 10.8042 17.194 10.4125C17.631 10.0208 17.8494 9.55 17.8494 9C17.8494 8.45 17.631 7.97917 17.194 7.5875C16.7571 7.19583 16.2318 7 15.6182 7C15.0046 7 14.4794 7.19583 14.0424 7.5875C13.6055 7.97917 13.387 8.45 13.387 9C13.387 9.55 13.6055 10.0208 14.0424 10.4125C14.4794 10.8042 15.0046 11 15.6182 11Z'
            fill='#37404D'
          />
          <path
            d='M15.6182 1C23.7974 1 30.2373 6.92037 30.2373 14C30.2373 21.0796 23.7974 27 15.6182 27C7.43905 26.9998 1 21.0795 1 14C1 6.92047 7.43905 1.00016 15.6182 1Z'
            stroke='#37404D'
            stroke-width='2'
          />
        </svg>
        <span className='chat-participant'>Chat with: {participant}</span>
      </div>
      <div></div>
    </p>
  </div>
);

export default ChatsListCard;
