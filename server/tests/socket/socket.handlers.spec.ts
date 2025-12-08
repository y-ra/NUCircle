import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { server } from '../../app';
import * as userService from '../../services/user.service';
import QuizInvitationManager from '../../services/invitationManager.service';
import GameManager from '../../services/games/gameManager';

jest.mock('../../services/user.service');
jest.mock('../../services/games/gameManager');

describe('Socket.IO Handlers - COS Features', () => {
  let clientSocket: ClientSocket;
  let serverAddress: string;

  beforeAll(done => {
    server.listen(() => {
      const address = server.address();
      const port = typeof address === 'string' ? address : address?.port || 8000;
      serverAddress = `http://localhost:${port}`;
      done();
    });
  });

  afterAll(done => {
    server.close(done);
  });

  beforeEach(done => {
    // Mock GameManager for disconnect cleanup
    (GameManager.getInstance as jest.Mock).mockReturnValue({
      getGamesByPlayer: jest.fn().mockResolvedValue([]),
      addGame: jest.fn().mockResolvedValue('game-123'),
      joinGame: jest.fn().mockResolvedValue(undefined),
      startGame: jest.fn().mockResolvedValue(undefined),
      endGameByDisconnect: jest.fn().mockResolvedValue(undefined),
      getGame: jest.fn().mockReturnValue({
        toModel: () => ({ gameID: 'game-123' }),
      }),
    });

    QuizInvitationManager.resetInstance();

    clientSocket = Client(serverAddress, {
      transports: ['websocket'],
      path: '/socket.io',
    });
    clientSocket.on('connect', done);
  });

  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
    jest.clearAllMocks();
  });

  describe('Online Status userConnect event', () => {
    it('should update user online status successfully', done => {
      const mockUser = {
        username: 'testuser',
        isOnline: true,
        socketId: clientSocket.id as string,
      };

      (userService.updateUserOnlineStatus as jest.Mock).mockResolvedValue(mockUser);

      const listener = Client(serverAddress, {
        transports: ['websocket'],
        path: '/socket.io',
      });

      listener.on('userStatusUpdate', data => {
        expect(data.username).toBe('testuser');
        expect(data.isOnline).toBe(true);
        listener.disconnect();
        done();
      });

      listener.on('connect', () => {
        clientSocket.emit('userConnect', 'testuser');
      });
    });

    it('should handle error when updating online status fails', done => {
      (userService.updateUserOnlineStatus as jest.Mock).mockResolvedValue({
        error: 'Database error',
      });

      clientSocket.on('error', data => {
        expect(data.message).toBe('Failed to update online status');
        done();
      });

      clientSocket.emit('userConnect', 'testuser');
    });
  });

  describe('Quiz Invitations, sendQuizInvite event', () => {
    it('should return error when challenger username not set', done => {
      clientSocket.on('error', data => {
        expect(data.message).toBe('Recipient not found');
        done();
      });

      clientSocket.emit('sendQuizInvite', 'recipient');
    });

    it('should return error when recipient not found', done => {
      (userService.updateUserOnlineStatus as jest.Mock).mockResolvedValue({
        username: 'challenger',
        isOnline: true,
      });

      (userService.getUserByUsername as jest.Mock).mockResolvedValue({
        error: 'User not found',
      });

      clientSocket.on('error', data => {
        expect(data.message).toBe('Recipient not found');
        done();
      });

      clientSocket.emit('userConnect', 'challenger');
      setTimeout(() => {
        clientSocket.emit('sendQuizInvite', 'nonexistent');
      }, 100);
    });

    it('should return error when recipient is offline', done => {
      (userService.updateUserOnlineStatus as jest.Mock).mockResolvedValue({
        username: 'challenger',
        isOnline: true,
      });

      (userService.getUserByUsername as jest.Mock).mockResolvedValue({
        username: 'recipient',
        isOnline: false,
        socketId: null,
      });

      clientSocket.on('error', data => {
        expect(data.message).toBe('Recipient is not online');
        done();
      });

      clientSocket.emit('userConnect', 'challenger');
      setTimeout(() => {
        clientSocket.emit('sendQuizInvite', 'recipient');
      }, 100);
    });

    it('should return error when invitation already exists', done => {
      (userService.updateUserOnlineStatus as jest.Mock).mockResolvedValue({
        username: 'challenger',
        isOnline: true,
      });

      (userService.getUserByUsername as jest.Mock).mockResolvedValue({
        username: 'recipient',
        isOnline: true,
        socketId: 'recipient-socket-id',
      });

      const manager = QuizInvitationManager.getInstance();
      manager.createInvitation('challenger', 'socket1', 'recipient', 'socket2');

      clientSocket.on('error', data => {
        expect(data.message).toBe('Invitation already sent');
        done();
      });

      clientSocket.emit('userConnect', 'challenger');
      setTimeout(() => {
        clientSocket.emit('sendQuizInvite', 'recipient');
      }, 100);
    });

    it('should send quiz invite successfully', done => {
      (userService.updateUserOnlineStatus as jest.Mock).mockResolvedValue({
        username: 'challenger',
        isOnline: true,
      });

      const recipientSocket = Client(serverAddress, {
        transports: ['websocket'],
        path: '/socket.io',
      });

      recipientSocket.on('connect', () => {
        (userService.getUserByUsername as jest.Mock).mockResolvedValue({
          username: 'recipient',
          isOnline: true,
          socketId: recipientSocket.id as string,
        });

        recipientSocket.on('quizInviteReceived', invite => {
          expect(invite.challengerUsername).toBe('challenger');
          expect(invite.recipientUsername).toBe('recipient');
          expect(invite.status).toBe('pending');
          recipientSocket.disconnect();
          done();
        });

        clientSocket.emit('userConnect', 'challenger');
        setTimeout(() => {
          clientSocket.emit('sendQuizInvite', 'recipient');
        }, 100);
      });
    });
  });

  describe('Quiz Invitations, respondToQuizInvite event', () => {
    it('should return error when invitation not found', done => {
      clientSocket.on('error', data => {
        expect(data.message).toBe('Invitation not found or expired');
        done();
      });

      clientSocket.emit('respondToQuizInvite', 'nonexistent-invite', true);
    });

    it('should handle accepted invitation and create game', done => {
      const manager = QuizInvitationManager.getInstance();
      const invite = manager.createInvitation(
        'challenger',
        clientSocket.id as string,
        'recipient',
        clientSocket.id as string,
      );

      clientSocket.once('quizInviteAccepted', data => {
        expect(data.gameId).toBe('game-123');
        expect(data.accepted).toBe(true);
        expect(data.challengerUsername).toBe('challenger');
        expect(data.recipientUsername).toBe('recipient');
        done();
      });

      clientSocket.emit('respondToQuizInvite', invite.id, true);
    });

    it('should handle declined invitation', done => {
      const manager = QuizInvitationManager.getInstance();
      const invite = manager.createInvitation(
        'challenger',
        clientSocket.id as string,
        'recipient',
        clientSocket.id as string,
      );

      clientSocket.once('quizInviteDeclined', data => {
        expect(data.accepted).toBe(false);
        expect(data.challengerUsername).toBe('challenger');
        expect(data.recipientUsername).toBe('recipient');
        done();
      });

      clientSocket.emit('respondToQuizInvite', invite.id, false);
    });

    it('should handle game creation failure', done => {
      (GameManager.getInstance as jest.Mock).mockReturnValue({
        addGame: jest.fn().mockResolvedValue({ error: 'Failed to create game' }),
        getGamesByPlayer: jest.fn().mockResolvedValue([]),
      });

      const manager = QuizInvitationManager.getInstance();
      const invite = manager.createInvitation(
        'challenger',
        clientSocket.id as string,
        'recipient',
        clientSocket.id as string,
      );

      clientSocket.on('error', data => {
        expect(data.message).toBe('Failed to create game');
        done();
      });

      clientSocket.emit('respondToQuizInvite', invite.id, true);
    });
  });

  describe('Game disconnect handling', () => {
    it('should handle disconnect with in-progress game', done => {
      const mockGameManager = {
        getGamesByPlayer: jest.fn().mockResolvedValue([
          {
            gameID: 'game-123',
            players: ['player1', 'player2'],
            state: { status: 'IN_PROGRESS' },
          },
        ]),
        endGameByDisconnect: jest.fn().mockResolvedValue(undefined),
        getGame: jest.fn().mockReturnValue({
          toModel: () => ({ gameID: 'game-123', status: 'FINISHED' }),
        }),
      };

      (GameManager.getInstance as jest.Mock).mockReturnValue(mockGameManager);

      (userService.updateUserOnlineStatus as jest.Mock)
        .mockResolvedValueOnce({ username: 'player1', isOnline: true })
        .mockResolvedValueOnce({ username: 'player1', isOnline: false });

      (userService.getUserByUsername as jest.Mock).mockResolvedValue({
        username: 'player2',
        isOnline: true,
        socketId: 'player2-socket',
      });

      const disconnectingClient = Client(serverAddress, {
        transports: ['websocket'],
        path: '/socket.io',
      });

      disconnectingClient.on('connect', () => {
        disconnectingClient.emit('userConnect', 'player1');

        setTimeout(() => {
          disconnectingClient.disconnect();
          setTimeout(() => {
            expect(mockGameManager.endGameByDisconnect).toHaveBeenCalledWith(
              'game-123',
              'player1',
              'player2',
            );
            done();
          }, 200);
        }, 100);
      });
    });

    it('should handle disconnect with waiting game', done => {
      const mockGameManager = {
        getGamesByPlayer: jest.fn().mockResolvedValue([
          {
            gameID: 'game-456',
            players: ['player1', 'player3'],
            state: { status: 'WAITING_TO_START' },
          },
        ]),
        endGameByDisconnect: jest.fn().mockResolvedValue(undefined),
        getGame: jest.fn().mockReturnValue({
          toModel: () => ({ gameID: 'game-456', status: 'CANCELLED' }),
        }),
      };

      (GameManager.getInstance as jest.Mock).mockReturnValue(mockGameManager);

      (userService.updateUserOnlineStatus as jest.Mock)
        .mockResolvedValueOnce({ username: 'player1', isOnline: true })
        .mockResolvedValueOnce({ username: 'player1', isOnline: false });

      (userService.getUserByUsername as jest.Mock).mockResolvedValue({
        username: 'player3',
        isOnline: true,
        socketId: 'player3-socket',
      });

      const disconnectingClient = Client(serverAddress, {
        transports: ['websocket'],
        path: '/socket.io',
      });

      disconnectingClient.on('connect', () => {
        disconnectingClient.emit('userConnect', 'player1');

        setTimeout(() => {
          disconnectingClient.disconnect();
          setTimeout(() => {
            expect(mockGameManager.endGameByDisconnect).toHaveBeenCalled();
            done();
          }, 200);
        }, 100);
      });
    });

    it('should handle disconnect when other player not found', done => {
      const mockGameManager = {
        getGamesByPlayer: jest.fn().mockResolvedValue([
          {
            gameID: 'game-789',
            players: ['player1', 'player4'],
            state: { status: 'IN_PROGRESS' },
          },
        ]),
        endGameByDisconnect: jest.fn().mockResolvedValue(undefined),
        getGame: jest.fn().mockReturnValue(null),
      };

      (GameManager.getInstance as jest.Mock).mockReturnValue(mockGameManager);

      (userService.updateUserOnlineStatus as jest.Mock)
        .mockResolvedValueOnce({ username: 'player1', isOnline: true })
        .mockResolvedValueOnce({ username: 'player1', isOnline: false });

      (userService.getUserByUsername as jest.Mock).mockResolvedValue({
        error: 'User not found',
      });

      const disconnectingClient = Client(serverAddress, {
        transports: ['websocket'],
        path: '/socket.io',
      });

      disconnectingClient.on('connect', () => {
        disconnectingClient.emit('userConnect', 'player1');

        setTimeout(() => {
          disconnectingClient.disconnect();
          setTimeout(done, 200);
        }, 100);
      });
    });

    it('should handle disconnect when game not found', done => {
      const mockGameManager = {
        getGamesByPlayer: jest.fn().mockResolvedValue([
          {
            gameID: 'game-999',
            players: ['player1', 'player5'],
            state: { status: 'IN_PROGRESS' },
          },
        ]),
        endGameByDisconnect: jest.fn().mockResolvedValue(undefined),
        getGame: jest.fn().mockReturnValue(null),
      };

      (GameManager.getInstance as jest.Mock).mockReturnValue(mockGameManager);

      (userService.updateUserOnlineStatus as jest.Mock)
        .mockResolvedValueOnce({ username: 'player1', isOnline: true })
        .mockResolvedValueOnce({ username: 'player1', isOnline: false });

      (userService.getUserByUsername as jest.Mock).mockResolvedValue({
        username: 'player5',
        isOnline: true,
        socketId: 'player5-socket',
      });

      const disconnectingClient = Client(serverAddress, {
        transports: ['websocket'],
        path: '/socket.io',
      });

      disconnectingClient.on('connect', () => {
        disconnectingClient.emit('userConnect', 'player1');

        setTimeout(() => {
          disconnectingClient.disconnect();
          setTimeout(done, 200);
        }, 100);
      });
    });
  });

  describe('US1: Online Status - disconnect event', () => {
    it('should update user status to offline on disconnect', done => {
      (userService.updateUserOnlineStatus as jest.Mock)
        .mockResolvedValueOnce({ username: 'testuser', isOnline: true })
        .mockResolvedValueOnce({ username: 'testuser', isOnline: false });

      const secondClient = Client(serverAddress, {
        transports: ['websocket'],
        path: '/socket.io',
      });

      clientSocket.on('userStatusUpdate', data => {
        if (!data.isOnline && data.username === 'testuser') {
          expect(data.username).toBe('testuser');
          expect(data.isOnline).toBe(false);
          done();
        }
      });

      secondClient.on('connect', () => {
        secondClient.emit('userConnect', 'testuser');
        setTimeout(() => {
          secondClient.disconnect();
        }, 100);
      });
    });

    it('should handle disconnect error gracefully', done => {
      (userService.updateUserOnlineStatus as jest.Mock)
        .mockResolvedValueOnce({ username: 'testuser', isOnline: true })
        .mockResolvedValueOnce({ error: 'Database error' });

      const secondClient = Client(serverAddress, {
        transports: ['websocket'],
        path: '/socket.io',
      });

      secondClient.on('connect', () => {
        secondClient.emit('userConnect', 'testuser');
        setTimeout(() => {
          secondClient.disconnect();
          setTimeout(done, 200);
        }, 100);
      });
    });
  });
});
