import { useState, useEffect } from 'react';
import './index.css';
import { NavLink, useLocation } from 'react-router-dom';
import useUserContext from '../../../hooks/useUserContext';
import { getUserCommunities } from '../../../services/communityService';
import { DatabaseCommunity } from '../../../types/types';

/**
 * The SideBarNav component has a sidebar navigation menu for all the main pages.
 * It highlights the currently selected item based on the active page and
 * triggers corresponding functions when the menu items are clicked.
 */
const SideBarNav = () => {
  const { user } = useUserContext();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const location = useLocation();

  const isActiveOption = (path: string) =>
    location.pathname === path ? 'message-option-selected ' : '';

  const toggleMessaging = (e: React.MouseEvent) => {
    e.preventDefault(); // prevent immediate route change
    setIsOpen(prev => !prev);
  };

  const [firstCommunityId, setFirstCommunityId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommunities = async () => {
      if (!user) return;
      try {
        const communities: DatabaseCommunity[] = await getUserCommunities(user.username);
        if (communities.length > 0) {
          setFirstCommunityId(communities[0]._id.toString());
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch communities for sidebar navigation');
      }
    };
    fetchCommunities();
  }, [user]);

  return (
    <div id='sideBarNav' className='sideBarNav'>
      <NavLink
        to='/home'
        id='menu_questions'
        className={({ isActive }) => `menu_button ${isActive ? 'menu_selected' : ''}`}>
        Questions
      </NavLink>
      <NavLink
        to='/tags'
        id='menu_tag'
        className={({ isActive }) => `menu_button ${isActive ? 'menu_selected' : ''}`}>
        Tags
      </NavLink>
      <div className='messaging-wrapper'>
        <div className={`menu_button`} onClick={toggleMessaging}>
          Messaging
        </div>

        {isOpen && (
          <div className='messaging-collapse'>
            <NavLink
              to='/messaging/direct-message'
              className={`message-option ${isActiveOption('/messaging/direct-message')}`}>
              Direct Messages
            </NavLink>

            <NavLink
              to={
                firstCommunityId
                  ? `/messaging/community-messages/${firstCommunityId}`
                  : '/messaging/community-messages'
              }
              className={`message-option ${
                location.pathname.startsWith('/messaging/community-messages')
                  ? 'message-option-selected '
                  : ''
              }`}>
              Community Messages
            </NavLink>

            <NavLink to='/messaging' className={`message-option ${isActiveOption('/messaging')}`}>
              Global Messages
            </NavLink>
          </div>
        )}
      </div>
      <NavLink
        to='/users'
        id='menu_users'
        className={({ isActive }) => `menu_button ${isActive ? 'menu_selected' : ''}`}>
        Users
      </NavLink>
      <NavLink
        to='/games'
        id='menu_games'
        className={({ isActive }) => `menu_button ${isActive ? 'menu_selected' : ''}`}>
        Games
      </NavLink>
      <NavLink
        to='/communities'
        id='menu_communities'
        className={({ isActive }) => `menu_button ${isActive ? 'menu_selected' : ''}`}>
        Communities
      </NavLink>
      <NavLink
        to={`/collections/${user.username}`}
        id='menu_collections'
        className={({ isActive }) => `menu_button ${isActive ? 'menu_selected' : ''}`}>
        My Collections
      </NavLink>
    </div>
  );
};

export default SideBarNav;
