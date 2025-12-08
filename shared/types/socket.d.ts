import { PopulatedDatabaseAnswer } from './answer';
import { PopulatedDatabaseChat } from './chat';
import { DatabaseMessage } from './message';
import { PopulatedDatabaseQuestion } from './question';
import { SafeDatabaseUser } from './user';
import { BaseMove, GameInstance, GameInstanceID, GameMove, GameState } from './game';
import { DatabaseCommunity } from './community';
import { PopulatedDatabaseCollection } from './collection';

/**
 * Payload for an answer update event.
 * - `qid`: The unique identifier of the question.
 * - `answer`: The updated answer.
 */
export interface AnswerUpdatePayload {
  qid: ObjectId;
  answer: PopulatedDatabaseAnswer;
}

/**
 * Payload for a game state update event.
 * - `gameInstance`: The updated instance of the game.
 */
export interface GameUpdatePayload {
  gameInstance: GameInstance<GameState>;
}

/**
 * Payload for a game operation error event.
 * - `player`: The player ID who caused the error.
 * - `error`: The error message.
 */
export interface GameErrorPayload {
  player: string;
  error: string;
}

/**
 * Payload for a vote update event.
 * - `qid`: The unique identifier of the question.
 * - `upVotes`: An array of usernames who upvoted the question.
 * - `downVotes`: An array of usernames who downvoted the question.
 */
export interface VoteUpdatePayload {
  qid: string;
  upVotes: string[];
  downVotes: string[];
}

/**
 * Payload for a chat update event.
 * - `chat`: The updated chat object.
 * - `type`: The type of update (`'created'`, `'newMessage'`, or `'newParticipant'`).
 */
export interface ChatUpdatePayload {
  chat: PopulatedDatabaseChat;
  type: 'created' | 'newMessage' | 'newParticipant';
}

/**
 * Payload for a comment update event.
 * - `result`: The updated question or answer.
 * - `type`: The type of the updated item (`'question'` or `'answer'`).
 */
export interface CommentUpdatePayload {
  result: PopulatedDatabaseQuestion | PopulatedDatabaseAnswer;
  type: 'question' | 'answer';
}

/**
 * Payload for a message update event.
 * - `msg`: The updated message.
 */
export interface MessageUpdatePayload {
  msg: DatabaseMessage;
}

/**
 * Payload for a user update event.
 * - `user`: The updated user object.
 * - `type`: The type of modification (`'created'`, `'deleted'`, or `'updated'`).
 */
export interface UserUpdatePayload {
  user: SafeDatabaseUser;
  type: 'created' | 'deleted' | 'updated';
}

/**
 * Payload for a work experience update event.
 * - `type`: The type of update (`'created'`, `'updated'`, or `'deleted'`).
 * - `workExperience`: The updated work experience object.
 */
export interface WorkExperienceUpdatePayload {
  workExperience: DatabaseWorkExperience;
  type: 'created' | 'updated' | 'deleted';
}

/**
 * Interface representing the payload for a game move operation, which contains:
 * - `gameID`: The ID of the game being played.
 * - `move`: The move being made in the game, defined by `GameMove`.
 */
export interface GameMovePayload {
  gameID: GameInstanceID;
  move: GameMove<BaseMove>;
}

/**
 * Interface representing the payload for a community update event.
 * - `type`: The type of update (`'created'`, `'updated'`, or `'deleted'`).
 * - `community`: The updated community object.
 */
export interface CommunityUpdatePayload {
  type: 'created' | 'updated' | 'deleted';
  community: DatabaseCommunity;
}

/**
 * Interface representing the payload for a collection update event.
 * - `type`: The type of update (`'created'`, `'updated'`, or `'deleted'`).
 * - `collection`: The updated collection object.
 */
export interface CollectionUpdatePayload {
  type: 'created' | 'updated' | 'deleted';
  collection: PopulatedDatabaseCollection;
}

/**
 * Interface representing the payload for a notification event.
 * - `type`: The type of notification (`'dm'`, `'answer'`, or `'communityNewMember'`).
 * - `message`: The notification message content.
 */
export interface NotificationPayload {
  type: 'dm' | 'answer' | 'communityNewMember';
  from: msgFrom;
  message: string;
}

/**
 * Interface representing a quiz invitation between two users.
 * - `id`: Unique identifier for this invitation (UUID)
 * - `challengerUsername`: Username of the user sending the invitation
 * - `challengerSocketId`: Socket ID of the challenger (for real-time communication)
 * - `recipientUsername`: Username of the user receiving the invitation
 * - `recipientSocketId`: Socket ID of the recipient (for real-time communication)
 * - `timestamp`: When the invitation was created (used for 30-second timeout)
 * - `status`: Current state of the invitation (`'pending'`, `'accepted'`, `'declined'`, `'expired'`).
 */
export interface QuizInvite {
  id: string;
  challengerUsername: string;
  challengerSocketId: string;
  recipientUsername: string;
  recipientSocketId: string;
  timestamp: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

/**
 * Interface representing the result after responding to a quiz invitation.
 * - `inviteId`: ID of the original invitation
 * - `challengerUsername`: Username of the user who sent the invitation
 * - `recipientUsername`: Username of the user who received the invitation
 * - `accepted`: Whether the invitation was accepted (true) or declined (false)
 * - `gameId`: (Optional) The game ID if accepted - both users navigate to this game
 */
export interface QuizInviteResult {
  inviteId: string;
  challengerUsername: string;
  recipientUsername: string;
  accepted: boolean;
  gameId?: string;
}

/**
 * Interface representing the events the client can emit to the server.
 * - `makeMove`: Client can emit a move in the game.
 * - `joinGame`: Client can join a game.
 * - `leaveGame`: Client can leave a game.
 * - `joinChat`: Client can join a chat.
 * - `leaveChat`: Client can leave a chat.
 * - `userConnect`: Client has connected to server.
 * - `sendQuizInvite`: Client has sent a quiz invite.
 * - `respondToQuizInvite`: Client has responded to quiz invite.
 */
export interface ClientToServerEvents {
  makeMove: (move: GameMovePayload) => void;
  joinGame: (gameID: string) => void;
  leaveGame: (gameID: string) => void;
  joinChat: (chatID: string) => void;
  leaveChat: (chatID: string | undefined) => void;
  userConnect: (username: string) => void;
  userDisconnect: () => void;
  sendQuizInvite: (recipientUsername: string) => void;
  respondToQuizInvite: (inviteId: string, accepted: boolean) => void;
}

/**
 * Interface representing the events the server can emit to the client.
 * - `questionUpdate`: Server sends updated question.
 * - `answerUpdate`: Server sends updated answer.
 * - `viewsUpdate`: Server sends updated views count for a question.
 * - `voteUpdate`: Server sends updated votes for a question.
 * - `commentUpdate`: Server sends updated comment for a question or answer.
 * - `messageUpdate`: Server sends updated message.
 * - `userUpdate`: Server sends updated user status.
 * - `workExperienceUpdate`: Server sends updated work experience.
 * - `gameUpdate`: Server sends updated game state.
 * - `gameError`: Server sends error message related to game operation.
 * - `chatUpdate`: Server sends updated chat.
 * - `communityUpdate`: Server sends updated community.
 * - `collectionUpdate`: Server sends updated collection.
 * - `userStatusUpdate`: Server sends updated user status.
 * - `quizInviteReceived`: Server sends updated quiz invitation status.
 * - `quizInviteAccepted`: Server sends updated quiz invitation status.
 * - `quizInviteDeclined`: Server sends updated quiz invitation status.
 * - `reactionUpdated`: Server sends updated chat reaction.
 * - `opponentDisconnected`: Server sends updated opponent status.
 */
export interface ServerToClientEvents {
  questionUpdate: (question: PopulatedDatabaseQuestion) => void;
  answerUpdate: (result: AnswerUpdatePayload) => void;
  viewsUpdate: (question: PopulatedDatabaseQuestion) => void;
  voteUpdate: (vote: VoteUpdatePayload) => void;
  commentUpdate: (comment: CommentUpdatePayload) => void;
  messageUpdate: (message: MessageUpdatePayload) => void;
  userUpdate: (user: UserUpdatePayload) => void;
  workExperienceUpdate: (work: WorkExperienceUpdatePayload) => void;
  gameUpdate: (game: GameUpdatePayload) => void;
  gameError: (error: GameErrorPayload) => void;
  chatUpdate: (chat: ChatUpdatePayload) => void;
  communityUpdate: (community: CommunityUpdatePayload) => void;
  collectionUpdate: (community: CollectionUpdatePayload) => void;
  userStatusUpdate: (payload: { username: string; isOnline: boolean; lastSeen?: Date }) => void;
  quizInviteReceived: (invite: QuizInvite) => void;
  quizInviteAccepted: (result: QuizInviteResult) => void;
  quizInviteDeclined: (result: QuizInviteResult) => void;
  reactionUpdated: (payload: {
    messageId: string;
    reactions: {
      love: { users: string[]; count: number };
      like: { users: string[]; count: number };
    };
  }) => void;
  notification: (payload: NotificationPayload) => void;
  opponentDisconnected: (payload: {
    gameId: string;
    disconnectedPlayer: string;
    winner: string;
    message: string;
  }) => void;
  error: (payload: { message: string }) => void;
}
