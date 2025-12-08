import { JSX } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layout';
import Login from './auth/login';
import { SafeDatabaseUser } from '../types/types';
import UserContext from '../contexts/UserContext';
import useLoginContext from '../hooks/useLoginContext';
import QuestionPage from './main/questionPage';
import TagPage from './main/tagPage';
import NewQuestionPage from './main/newQuestion';
import NewAnswerPage from './main/newAnswer';
import AnswerPage from './main/answerPage';
import MessagingPage from './main/messagingPage';
import DirectMessage from './main/directMessage';
import Signup from './auth/signup';
import UsersListPage from './main/usersListPage';
import ProfileSettings from './profileSettings';
import AllGamesPage from './main/games/allGamesPage';
import GamePage from './main/games/gamePage';
import AllCommunitiesPage from './main/communities/allCommunitiesPage';
import NewCommunityPage from './main/communities/newCommunityPage';
import CommunityPage from './main/communities/communityPage';
import AllCollectionsPage from './main/collections/allCollectionsPage';
import CollectionPage from './main/collections/collectionPage';
import NewCollectionPage from './main/collections/newCollectionPage';
import { useSocket, getSocket } from '../hooks/useSocket';
import CommunityMessages from './main/communityMessagesPage';
import useQuizInvite from '../hooks/useQuizInvite';
import QuizInvitationPopUp from './quizInvitationPopUp';
// import NotificationListener from './Notifications/NotificationListener';
// import Notifications from './Notifications';

/**
 * Component that handles quiz invitations for logged-in users.
 * Must be inside UserContext to access socket.
 */
const QuizInvitationHandler = () => {
  const { pendingInvitation, handlePendingAccept, handlePendingDecline } = useQuizInvite();

  return (
    <QuizInvitationPopUp
      invite={pendingInvitation}
      onAccept={handlePendingAccept}
      onDecline={handlePendingDecline}
    />
  );
};

const ProtectedRoute = ({
  user,
  children,
}: {
  user: SafeDatabaseUser | null;
  children: JSX.Element;
}) => {
  const socket = getSocket();

  if (!user || !socket) {
    return <Navigate to='/' />;
  }

  return (
    <UserContext.Provider value={{ user, socket }}>
      <QuizInvitationHandler />
      {children}
    </UserContext.Provider>
  );
};

const FakeStackOverflow = () => {
  const { user } = useLoginContext();

  useSocket(user?.username || null);

  return (
    <Routes>
      <Route path='/' element={user ? <Navigate to='/home' /> : <Login />} />
      <Route path='/signup' element={user ? <Navigate to='/home' /> : <Signup />} />

      <Route
        element={
          <ProtectedRoute user={user}>
            <Layout />
          </ProtectedRoute>
        }>
        <Route path='/home' element={<QuestionPage />} />
        <Route path='tags' element={<TagPage />} />
        <Route path='/messaging' element={<MessagingPage />} />
        <Route path='/messaging/direct-message' element={<DirectMessage />} />
        <Route path='/messaging/community-messages/:communityID' element={<CommunityMessages />} />
        <Route path='/question/:qid' element={<AnswerPage />} />
        <Route path='/new/question' element={<NewQuestionPage />} />
        <Route path='/new/answer/:qid' element={<NewAnswerPage />} />
        <Route path='/users' element={<UsersListPage />} />
        <Route path='/user/:username' element={<ProfileSettings />} />
        <Route path='/new/collection' element={<NewCollectionPage />} />
        <Route path='/collections/:username' element={<AllCollectionsPage />} />
        <Route path='/collections/:username/:collectionId' element={<CollectionPage />} />
        <Route path='/games' element={<AllGamesPage />} />
        <Route path='/games/:gameID' element={<GamePage />} />
        <Route path='/communities' element={<AllCommunitiesPage />} />
        <Route path='/new/community' element={<NewCommunityPage />} />
        <Route path='/communities/:communityID' element={<CommunityPage />} />
      </Route>
    </Routes>
  );
};

export default FakeStackOverflow;
