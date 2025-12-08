import QuizInvitationManager from '../../services/invitationManager.service';

describe('QuizInvitationManager Service', () => {
  let manager: QuizInvitationManager;

  beforeEach(() => {
    QuizInvitationManager.resetInstance();
    manager = QuizInvitationManager.getInstance();
  });

  afterEach(() => {
    QuizInvitationManager.resetInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = QuizInvitationManager.getInstance();
      const instance2 = QuizInvitationManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = QuizInvitationManager.getInstance();
      QuizInvitationManager.resetInstance();
      const instance2 = QuizInvitationManager.getInstance();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('createInvitation', () => {
    it('should create a new invitation with all required fields', () => {
      const invite = manager.createInvitation('user1', 'socket1', 'user2', 'socket2');

      expect(invite).toBeDefined();
      expect(invite.id).toBeDefined();
      expect(invite.challengerUsername).toBe('user1');
      expect(invite.challengerSocketId).toBe('socket1');
      expect(invite.recipientUsername).toBe('user2');
      expect(invite.recipientSocketId).toBe('socket2');
      expect(invite.status).toBe('pending');
      expect(invite.timestamp).toBeInstanceOf(Date);
    });

    it('should generate unique IDs for multiple invitations', () => {
      const invite1 = manager.createInvitation('user1', 'socket1', 'user2', 'socket2');
      const invite2 = manager.createInvitation('user3', 'socket3', 'user4', 'socket4');

      expect(invite1.id).not.toBe(invite2.id);
    });
  });

  describe('getInvitation', () => {
    it('should retrieve an existing invitation by ID', () => {
      const invite = manager.createInvitation('user1', 'socket1', 'user2', 'socket2');
      const retrieved = manager.getInvitation(invite.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(invite.id);
      expect(retrieved?.challengerUsername).toBe('user1');
    });

    it('should return undefined for non-existent invitation', () => {
      const retrieved = manager.getInvitation('non-existent-id');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('updateInvitationStatus', () => {
    it('should update invitation status to accepted', () => {
      const invite = manager.createInvitation('user1', 'socket1', 'user2', 'socket2');
      manager.updateInvitationStatus(invite.id, 'accepted');

      const updated = manager.getInvitation(invite.id);
      expect(updated?.status).toBe('accepted');
    });

    it('should update invitation status to declined', () => {
      const invite = manager.createInvitation('user1', 'socket1', 'user2', 'socket2');
      manager.updateInvitationStatus(invite.id, 'declined');

      const updated = manager.getInvitation(invite.id);
      expect(updated?.status).toBe('declined');
    });

    it('should update invitation status to expired', () => {
      const invite = manager.createInvitation('user1', 'socket1', 'user2', 'socket2');
      manager.updateInvitationStatus(invite.id, 'expired');

      const updated = manager.getInvitation(invite.id);
      expect(updated?.status).toBe('expired');
    });

    it('should do nothing for non-existent invitation', () => {
      expect(() => {
        manager.updateInvitationStatus('non-existent-id', 'accepted');
      }).not.toThrow();
    });
  });

  describe('removeInvitation', () => {
    it('should remove an existing invitation', () => {
      const invite = manager.createInvitation('user1', 'socket1', 'user2', 'socket2');
      manager.removeInvitation(invite.id);

      const retrieved = manager.getInvitation(invite.id);
      expect(retrieved).toBeUndefined();
    });

    it('should not throw when removing non-existent invitation', () => {
      expect(() => {
        manager.removeInvitation('non-existent-id');
      }).not.toThrow();
    });
  });

  describe('hasPendingInvitation', () => {
    it('should return true when pending invitation exists', () => {
      manager.createInvitation('user1', 'socket1', 'user2', 'socket2');
      const hasPending = manager.hasPendingInvitation('user2', 'user1');
      expect(hasPending).toBe(true);
    });

    it('should return false when no invitation exists', () => {
      const hasPending = manager.hasPendingInvitation('user2', 'user1');
      expect(hasPending).toBe(false);
    });

    it('should return false when invitation is accepted', () => {
      const invite = manager.createInvitation('user1', 'socket1', 'user2', 'socket2');
      manager.updateInvitationStatus(invite.id, 'accepted');

      const hasPending = manager.hasPendingInvitation('user2', 'user1');
      expect(hasPending).toBe(false);
    });

    it('should return false when invitation is declined', () => {
      const invite = manager.createInvitation('user1', 'socket1', 'user2', 'socket2');
      manager.updateInvitationStatus(invite.id, 'declined');

      const hasPending = manager.hasPendingInvitation('user2', 'user1');
      expect(hasPending).toBe(false);
    });

    it('should return false for different user pairs', () => {
      manager.createInvitation('user1', 'socket1', 'user2', 'socket2');
      const hasPending = manager.hasPendingInvitation('user3', 'user1');
      expect(hasPending).toBe(false);
    });
  });

  describe('getPendingInvitationsForUser', () => {
    it('should return all pending invitations for a user', () => {
      manager.createInvitation('user1', 'socket1', 'user2', 'socket2');
      manager.createInvitation('user3', 'socket3', 'user2', 'socket2');

      const invitations = manager.getPendingInvitationsForUser('user2');
      expect(invitations).toHaveLength(2);
      expect(invitations[0].recipientUsername).toBe('user2');
      expect(invitations[1].recipientUsername).toBe('user2');
    });

    it('should return empty array when user has no pending invitations', () => {
      const invitations = manager.getPendingInvitationsForUser('user1');
      expect(invitations).toHaveLength(0);
    });

    it('should not return accepted invitations', () => {
      const invite1 = manager.createInvitation('user1', 'socket1', 'user2', 'socket2');
      manager.createInvitation('user3', 'socket3', 'user2', 'socket2');

      manager.updateInvitationStatus(invite1.id, 'accepted');

      const invitations = manager.getPendingInvitationsForUser('user2');
      expect(invitations).toHaveLength(1);
      expect(invitations[0].challengerUsername).toBe('user3');
    });

    it('should not return declined invitations', () => {
      const invite1 = manager.createInvitation('user1', 'socket1', 'user2', 'socket2');
      manager.updateInvitationStatus(invite1.id, 'declined');

      const invitations = manager.getPendingInvitationsForUser('user2');
      expect(invitations).toHaveLength(0);
    });

    it('should not return invitations for other users', () => {
      manager.createInvitation('user1', 'socket1', 'user2', 'socket2');
      manager.createInvitation('user1', 'socket1', 'user3', 'socket3');

      const invitations = manager.getPendingInvitationsForUser('user2');
      expect(invitations).toHaveLength(1);
      expect(invitations[0].recipientUsername).toBe('user2');
    });
  });

  describe('Complex scenarios', () => {
    it('should handle multiple users with multiple invitations', () => {
      manager.createInvitation('user1', 'socket1', 'user2', 'socket2');
      manager.createInvitation('user1', 'socket1', 'user3', 'socket3');
      manager.createInvitation('user4', 'socket4', 'user2', 'socket2');

      const user2Invites = manager.getPendingInvitationsForUser('user2');
      const user3Invites = manager.getPendingInvitationsForUser('user3');

      expect(user2Invites).toHaveLength(2);
      expect(user3Invites).toHaveLength(1);
    });

    it('should handle full invitation lifecycle', () => {
      const invite = manager.createInvitation('user1', 'socket1', 'user2', 'socket2');
      expect(manager.hasPendingInvitation('user2', 'user1')).toBe(true);

      manager.updateInvitationStatus(invite.id, 'accepted');
      expect(manager.hasPendingInvitation('user2', 'user1')).toBe(false);

      manager.removeInvitation(invite.id);
      expect(manager.getInvitation(invite.id)).toBeUndefined();
    });
  });
});
