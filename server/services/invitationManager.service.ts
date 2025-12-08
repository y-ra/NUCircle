import { QuizInvite } from '../types/types';
import { randomUUID } from 'crypto';

/**
 * Manages quiz invitations between users.
 * This singleton class tracks all pending quiz invitations and handles
 * the complete invitation lifecycle from creation to acceptance/decline.
 * Invitations are stored in memory and expire after 30 seconds (future feature).
 */
class QuizInvitationManager {
  private static _instance: QuizInvitationManager | undefined;
  private _pendingInvites: Map<string, QuizInvite>;

  private constructor() {
    this._pendingInvites = new Map();
  }

  /**
   * Singleton pattern to get the unique instance of InvitationManager.
   * @returns The instance of InvitationManager.
   */
  public static getInstance(): QuizInvitationManager {
    if (!QuizInvitationManager._instance) {
      QuizInvitationManager._instance = new QuizInvitationManager();
    }
    return QuizInvitationManager._instance;
  }

  /**
   * Creates a new quiz invitation between two users.
   *
   * @param challengerUsername Username of the user sending the invitation
   * @param challengerSocketId Socket ID of the challenger (for real-time notifications)
   * @param recipientUsername Username of the user receiving the invitation
   * @param recipientSocketId Socket ID of the recipient (for real-time notifications)
   * @returns The created invitation object with a unique ID and 'pending' status
   */
  public createInvitation(
    challengerUsername: string,
    challengerSocketId: string,
    recipientUsername: string,
    recipientSocketId: string,
  ): QuizInvite {
    const invite: QuizInvite = {
      id: randomUUID(),
      challengerUsername,
      challengerSocketId,
      recipientUsername,
      recipientSocketId,
      timestamp: new Date(),
      status: 'pending',
    };

    this._pendingInvites.set(invite.id, invite);
    return invite;
  }

  /**
   * Retrieves an invitation by its unique ID.
   *
   * @param inviteId The unique identifier of the invitation
   * @returns The invitation object or undefined if not found
   */
  public getInvitation(inviteId: string): QuizInvite | undefined {
    return this._pendingInvites.get(inviteId);
  }

  /**
   * Updates the status of an existing invitation.
   *
   * Used when an invitation is accepted, declined, or expires.
   *
   * @param inviteId The unique identifier of the invitation
   * @param status New status ('accepted', 'declined', or 'expired')
   */
  public updateInvitationStatus(
    inviteId: string,
    status: 'accepted' | 'declined' | 'expired',
  ): void {
    const invite = this._pendingInvites.get(inviteId);
    if (invite) {
      invite.status = status;
    }
  }

  /**
   * Removes an invitation from the pending invitations map.
   *
   * Called after an invitation is accepted, declined, or expired
   * to clean up memory.
   *
   * @param inviteId The unique identifier of the invitation to remove
   */
  public removeInvitation(inviteId: string): void {
    this._pendingInvites.delete(inviteId);
  }

  /**
   * Checks if a pending invitation already exists between two users.
   *
   * Prevents spam by ensuring a user can't send multiple invitations
   * to the same person before the first one is responded to.
   *
   * @param recipientUsername The username of the recipient
   * @param challengerUsername The username of the challenger
   * @returns True if a pending invitation already exists, false otherwise
   */
  public hasPendingInvitation(recipientUsername: string, challengerUsername: string): boolean {
    for (const invite of this._pendingInvites.values()) {
      if (
        invite.recipientUsername === recipientUsername &&
        invite.challengerUsername === challengerUsername &&
        invite.status === 'pending'
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Gets all pending invitations for a specific user.
   *
   * Used to show a list of all challenges a user has received
   * that they haven't responded to yet.
   *
   * @param username The username to check for pending invitations
   * @returns Array of all pending invitations sent to this user
   */
  public getPendingInvitationsForUser(username: string): QuizInvite[] {
    const invitations: QuizInvite[] = [];
    for (const invite of this._pendingInvites.values()) {
      if (invite.recipientUsername === username && invite.status === 'pending') {
        invitations.push(invite);
      }
    }
    return invitations;
  }

  /**
   * Resets the InvitationManager instance.
   *
   * Used primarily for testing to clear all invitations between tests.
   */
  public static resetInstance(): void {
    QuizInvitationManager._instance = undefined;
  }
}

export default QuizInvitationManager;
