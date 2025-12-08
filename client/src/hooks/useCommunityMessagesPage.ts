import { useEffect, useState } from 'react';
import { DatabaseCommunity, DatabaseMessage, MessageUpdatePayload, Message } from '../types/types';
import useUserContext from './useUserContext';
import { getUserCommunities } from '../services/communityService';
import { addCommunityMessage, getCommunityMessages } from '../services/communityMessagesService';

/**
 * Custom hook for the Community Messages Page.
 *
 * @returns communities - The list of communities the user is part of.
 * @returns selectedCommunity - The currently selected community.
 * @returns setSelectedCommunity - Function to change the selected community.
 */
const useCommunityMessagesPage = (initialCommunityID?: string) => {
  const { user, socket } = useUserContext();
  const [communities, setCommunities] = useState<DatabaseCommunity[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<DatabaseCommunity | null>(null);
  const [messages, setMessages] = useState<DatabaseMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  // fetch communities the user is part of
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        if (!user) return;
        const userCommunities: DatabaseCommunity[] = await getUserCommunities(user.username);
        setCommunities(userCommunities);
        if (initialCommunityID) {
          const found = userCommunities.find(c => c._id.toString() === initialCommunityID);
          setSelectedCommunity(found || null);
        } else {
          setSelectedCommunity(userCommunities[0] || null);
        }
      } catch (err) {
        setError('Failed to fetch communities');
      }
    };
    fetchCommunities();
  }, [user, initialCommunityID]);

  // fetch messages when selected community changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedCommunity) return;
      try {
        const msgs: DatabaseMessage[] = await getCommunityMessages(
          selectedCommunity._id.toString(),
        );
        setMessages(msgs); // Replace with actual fetched messages
      } catch (err) {
        setError('Failed to fetch messages');
      }
    };
    fetchMessages();
  }, [selectedCommunity]);

  useEffect(() => {
    if (!socket) return;

    // handle new message
    const handleMessageUpdate = (data: MessageUpdatePayload) => {
      setMessages(prev => [...prev, data.msg]);
    };

    // handle reaction updates
    const handleReactionUpdated = ({
      messageId,
      reactions,
    }: {
      messageId: string;
      reactions: DatabaseMessage['reactions'];
    }) => {
      // eslint-disable-next-line no-console
      console.log('[DEBUG] Reaction update received:', { messageId, reactions });
      setMessages(prev =>
        prev.map(msg => (msg._id.toString() === messageId ? { ...msg, reactions } : msg)),
      );
    };

    socket.on('messageUpdate', handleMessageUpdate);
    socket.on('reactionUpdated', handleReactionUpdated);

    return () => {
      socket.off('messageUpdate', handleMessageUpdate);
      socket.off('reactionUpdated', handleReactionUpdated);
    };
  }, [socket, selectedCommunity]);

  // handle sending a new message
  const handleSendMessage = async () => {
    if (!selectedCommunity) {
      setError('No community selected');
      return;
    }
    if (newMessage === '') {
      setError('Message cannot be empty');
      return;
    }

    setError('');

    const msgToSend: Message = {
      msg: newMessage,
      msgFrom: user.username,
      msgDateTime: new Date(),
      type: 'community',
    };

    try {
      await addCommunityMessage(selectedCommunity._id.toString(), msgToSend);
      setNewMessage('');
    } catch (err) {
      setError('Failed to send message');
    }
  };

  return {
    communities,
    selectedCommunity,
    setSelectedCommunity,
    messages,
    newMessage,
    setNewMessage,
    handleSendMessage,
    error,
  };
};

export default useCommunityMessagesPage;
