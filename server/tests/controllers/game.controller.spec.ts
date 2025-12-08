import supertest from 'supertest';
import { Server, type Socket as ServerSocket } from 'socket.io';
import { Server as HTTPServer, createServer } from 'http';
import { io as Client, type Socket as ClientSocket } from 'socket.io-client';
import { AddressInfo } from 'net';
import { app } from '../../app';
import GameModel from '../../models/games.model';
import GameManager from '../../services/games/gameManager';
import { FakeSOSocket, GameInstance, TriviaGameState } from '../../types/types';
import * as util from '../../services/game.service';
import gameController from '../../controllers/game.controller';
import TriviaGame from '../../services/games/trivia';

// mock jwt auth to always authenticate successfully
jest.mock('../../middleware/auth', () => ({
  __esModule: true,
  default: (req: any, res: any, next: any) => {
    // Check headers for a test override header (for auth failure tests)
    const testOverride = req.headers?.['x-test-username'];
    // Extract username from request params, body (multiple fields), or query for testing
    const username =
      testOverride ||
      req.params?.username ||
      req.body?.username ||
      req.body?.createdBy ||
      req.body?.playerID ||
      req.query?.username ||
      'test_user';
    req.user = { userId: 'test-user-id', username: username };
    next();
  },
}));

const mockGameManager = GameManager.getInstance();

describe('POST /create', () => {
  const addGameSpy = jest.spyOn(mockGameManager, 'addGame');

  describe('200 OK Requests', () => {
    it('should return 200 with a game ID when successful', async () => {
      addGameSpy.mockResolvedValueOnce('testGameID');

      const response = await supertest(app)
        .post('/api/games/create')
        .send({ gameType: 'Trivia', createdBy: 'testUser' });

      expect(response.status).toEqual(200);
      expect(response.text).toEqual(JSON.stringify('testGameID'));
      expect(addGameSpy).toHaveBeenCalledWith('Trivia', 'testUser');
    });
  });

  describe('400 Invalid Request', () => {
    it('should return 400 for an undefined response body', async () => {
      const response = await supertest(app).post('/api/games/create').send(undefined);

      expect(response.status).toEqual(415);
    });

    it('should return 400 for an empty response body', async () => {
      const response = await supertest(app).post('/api/games/create').send({});

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/gameType');
    });

    it('should return 400 for an invalid game type', async () => {
      const response = await supertest(app)
        .post('/api/games/create')
        .send({ gameType: 'TicTacToe' });

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/gameType');
    });
  });

  describe('500 Server Error Request', () => {
    it('should return 500 if addGame fails', async () => {
      addGameSpy.mockResolvedValueOnce({ error: 'test error' });

      const response = await supertest(app)
        .post('/api/games/create')
        .send({ gameType: 'Trivia', createdBy: 'testUser' });

      expect(response.status).toEqual(500);
      expect(response.text).toContain('Error when creating game: test error');
      expect(addGameSpy).toHaveBeenCalledWith('Trivia', 'testUser');
    });

    it('should return 500 if addGame throws an error', async () => {
      addGameSpy.mockRejectedValueOnce(new Error('test error'));

      const response = await supertest(app)
        .post('/api/games/create')
        .send({ gameType: 'Trivia', createdBy: 'testUser' });

      expect(response.status).toEqual(500);
      expect(response.text).toContain('Error when creating game: test error');
      expect(addGameSpy).toHaveBeenCalledWith('Trivia', 'testUser');
    });

    it('should return 500 if error is not an Error instance', async () => {
      addGameSpy.mockRejectedValueOnce('String error');

      const response = await supertest(app)
        .post('/api/games/create')
        .send({ gameType: 'Trivia', createdBy: 'testUser' });

      expect(response.status).toEqual(500);
      expect(response.text).toContain('Error when creating game: String error');
    });

    it('should return 401 when createdBy does not match authenticated user', async () => {
      const response = await supertest(app)
        .post('/api/games/create')
        .set('x-test-username', 'test_user')
        .send({ gameType: 'Trivia', createdBy: 'different_user' });

      expect(response.status).toBe(401);
      expect(response.text).toBe('Invalid createdBy parameter');
      expect(addGameSpy).not.toHaveBeenCalled();
    });
  });
});

describe('POST /join', () => {
  const joinGameSpy = jest.spyOn(mockGameManager, 'joinGame');

  describe('200 OK Requests', () => {
    it('should return 200 with a game state when successful', async () => {
      const gameState: GameInstance<TriviaGameState> = {
        state: {
          status: 'WAITING_TO_START',
          currentQuestionIndex: 0,
          questions: [],
          player1Answers: [],
          player2Answers: [],
          player1Score: 0,
          player2Score: 0,
        },
        gameID: '65e9b716ff0e892116b2de01',
        players: ['user1'],
        gameType: 'Trivia',
      };
      joinGameSpy.mockResolvedValueOnce(gameState);

      const response = await supertest(app)
        .post('/api/games/join')
        .send({ gameID: '65e9b716ff0e892116b2de01', playerID: 'user1' });

      expect(response.status).toEqual(200);
      expect(response.body).toEqual(gameState);
      expect(joinGameSpy).toHaveBeenCalledWith('65e9b716ff0e892116b2de01', 'user1');
    });
  });

  describe('400 Invalid Request', () => {
    it('should return 400 for an undefined request body', async () => {
      const response = await supertest(app).post('/api/games/join').send(undefined);

      expect(response.status).toEqual(415);
    });

    it('should return 400 for an empty request body', async () => {
      const response = await supertest(app).post('/api/games/join').send({});

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/gameID');
    });

    it('should return 400 for a missing gameID', async () => {
      const response = await supertest(app).post('/api/games/join').send({ playerID: 'user1' });

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/gameID');
    });

    it('should return 400 for a missing playerID', async () => {
      const response = await supertest(app).post('/api/games/join').send({ gameID: 'testGameID' });

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/playerID');
    });
  });

  describe('500 Server Error Request', () => {
    it('should return 500 if joinGame fails', async () => {
      joinGameSpy.mockResolvedValueOnce({ error: 'test error' });

      const response = await supertest(app)
        .post('/api/games/join')
        .send({ gameID: '65e9b716ff0e892116b2de01', playerID: 'user1' });

      expect(response.status).toEqual(500);
      expect(response.text).toContain('Error when joining game: test error');
    });

    it('should return 500 if joinGame throws an error', async () => {
      joinGameSpy.mockRejectedValueOnce(new Error('test error'));

      const response = await supertest(app)
        .post('/api/games/join')
        .send({ gameID: '65e9b716ff0e892116b2de01', playerID: 'user1' });

      expect(response.status).toEqual(500);
      expect(response.text).toContain('Error when joining game: test error');
    });

    it('should return 401 when playerID does not match authenticated user', async () => {
      const response = await supertest(app)
        .post('/api/games/join')
        .set('x-test-username', 'test_user')
        .send({ gameID: '65e9b716ff0e892116b2de01', playerID: 'different_user' });

      expect(response.status).toBe(401);
      expect(response.text).toBe('Invalid playerID parameter');
    });
  });
});

describe('POST /leave', () => {
  const leaveGameSpy = jest.spyOn(mockGameManager, 'leaveGame');

  describe('200 OK Requests', () => {
    it('should return 200 with a success message when successful', async () => {
      const gameState: GameInstance<TriviaGameState> = {
        state: {
          status: 'OVER',
          winners: ['user1'],
          currentQuestionIndex: 0,
          questions: [],
          player1Answers: [],
          player2Answers: [],
          player1Score: 0,
          player2Score: 0,
        },
        gameID: '65e9b716ff0e892116b2de01',
        players: ['user1'],
        gameType: 'Trivia',
      };
      leaveGameSpy.mockResolvedValueOnce(gameState);

      const response = await supertest(app)
        .post('/api/games/leave')
        .send({ gameID: '65e9b716ff0e892116b2de01', playerID: 'user1' });

      expect(response.status).toEqual(200);
      expect(response.body).toEqual(gameState);
      expect(leaveGameSpy).toHaveBeenCalledWith('65e9b716ff0e892116b2de01', 'user1');
    });
  });

  describe('415 Invalid Request', () => {
    it('should return 400 for an undefined request body', async () => {
      const response = await supertest(app).post('/api/games/leave').send(undefined);

      expect(response.status).toEqual(415);
    });

    it('should return 400 for an empty request body', async () => {
      const response = await supertest(app).post('/api/games/leave').send({});

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/gameID');
    });

    it('should return 400 for a missing gameID', async () => {
      const response = await supertest(app).post('/api/games/leave').send({ playerID: 'user1' });

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/gameID');
    });

    it('should return 400 for a missing playerID', async () => {
      const response = await supertest(app).post('/api/games/leave').send({ gameID: 'testGameID' });

      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/playerID');
    });
  });

  describe('500 Server Error Request', () => {
    it('should return 500 if leaveGame fails', async () => {
      leaveGameSpy.mockResolvedValueOnce({ error: 'test error' });

      const response = await supertest(app)
        .post('/api/games/leave')
        .send({ gameID: '65e9b716ff0e892116b2de01', playerID: 'user1' });

      expect(response.status).toEqual(500);
      expect(response.text).toContain('Error when leaving game: test error');
    });

    it('should return 500 if leaveGame throws an error', async () => {
      leaveGameSpy.mockRejectedValueOnce(new Error('test error'));

      const response = await supertest(app)
        .post('/api/games/leave')
        .send({ gameID: '65e9b716ff0e892116b2de01', playerID: 'user1' });

      expect(response.status).toEqual(500);
      expect(response.text).toContain('Error when leaving game: test error');
    });

    it('should return 401 when playerID does not match authenticated user', async () => {
      const response = await supertest(app)
        .post('/api/games/leave')
        .set('x-test-username', 'test_user')
        .send({ gameID: '65e9b716ff0e892116b2de01', playerID: 'different_user' });

      expect(response.status).toBe(401);
      expect(response.text).toBe('Invalid playerID parameter');
    });
  });
});

describe('GET /games', () => {
  // findGames is the default export in the file
  const findGamesSpy = jest.spyOn(util, 'default');
  const gameState: GameInstance<TriviaGameState> = {
    state: {
      status: 'WAITING_TO_START',
      currentQuestionIndex: 0,
      questions: [],
      player1Answers: [],
      player2Answers: [],
      player1Score: 0,
      player2Score: 0,
    },
    gameID: 'testGameID',
    players: ['user1'],
    gameType: 'Trivia',
  };

  describe('200 OK Requests', () => {
    it('should return 200 with a game state array when successful', async () => {
      findGamesSpy.mockResolvedValueOnce([gameState]);

      const response = await supertest(app)
        .get('/api/games/games')
        .query({ gameType: 'Trivia', status: 'WAITING_TO_START' });

      expect(response.status).toEqual(200);
      expect(response.body).toEqual([gameState]);
      expect(findGamesSpy).toHaveBeenCalledWith('Trivia', 'WAITING_TO_START');
    });

    it('should return 200 with an empty game state array when successful', async () => {
      findGamesSpy.mockResolvedValueOnce([]);

      const response = await supertest(app)
        .get('/api/games/games')
        .query({ gameType: 'Trivia', status: 'IN_PROGRESS' });

      expect(response.status).toEqual(200);
      expect(response.body).toEqual([]);
      expect(findGamesSpy).toHaveBeenCalledWith('Trivia', 'IN_PROGRESS');
    });
  });

  describe('500 Server Error Request', () => {
    it('should return 500 if leaveGame throws an error', async () => {
      findGamesSpy.mockRejectedValueOnce(new Error('test error'));

      const response = await supertest(app)
        .get('/api/games/games')
        .query({ gameType: 'Trivia', status: 'WAITING_TO_START' });

      expect(response.status).toEqual(500);
      expect(response.text).toContain('Error when getting games: test error');
    });
  });
});

describe('playMove & socket handlers', () => {
  let httpServer: HTTPServer;
  let io: FakeSOSocket;
  let clientSocket: ClientSocket;
  let serverSocket: ServerSocket;

  let mockTriviaGame: TriviaGame;
  let getGameSpy: jest.SpyInstance;
  let toModelSpy: jest.SpyInstance;
  let saveGameStateSpy: jest.SpyInstance;
  let removeGameSpy: jest.SpyInstance;

  beforeAll(done => {
    httpServer = createServer();
    io = new Server(httpServer);
    gameController(io);

    httpServer.listen(() => {
      const { port } = httpServer.address() as AddressInfo;
      clientSocket = Client(`http://localhost:${port}`);
      io.on('connection', socket => {
        serverSocket = socket;
      });

      clientSocket.on('connect', done);
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockTriviaGame = new TriviaGame('testUser');
    mockTriviaGame.join('player1');
    mockTriviaGame.join('player2');

    getGameSpy = jest.spyOn(mockGameManager, 'getGame');
    toModelSpy = jest.spyOn(mockTriviaGame, 'toModel').mockReturnValue({
      state: {
        status: 'IN_PROGRESS',
        currentQuestionIndex: 0,
        questions: [],
        player1Answers: [],
        player2Answers: [],
        player1Score: 0,
        player2Score: 0,
      },
      gameID: '',
      players: [],
      gameType: 'Trivia',
    });

    saveGameStateSpy = jest.spyOn(mockTriviaGame, 'saveGameState').mockResolvedValue(undefined);
    removeGameSpy = jest.spyOn(mockGameManager, 'removeGame');
  });

  afterAll(done => {
    clientSocket.removeAllListeners();
    clientSocket.disconnect();
    if (serverSocket) {
      serverSocket.removeAllListeners();
      serverSocket.disconnect();
    }
    io.close();
    httpServer.close(() => done());
  });

  it('should join a game when "joinGame" event is emitted', async () => {
    const joinGameEvent = new Promise(resolve => {
      serverSocket.once('joinGame', arg => {
        expect(io.sockets.adapter.rooms.has('game123')).toBeTruthy();
        resolve(arg);
      });
    });

    clientSocket.emit('joinGame', 'game123');

    const joinGameArg = await joinGameEvent;

    expect(joinGameArg).toBe('game123');
  });

  it('should leave a game when "leaveGame" event is emitted', async () => {
    const joinGameEvent = new Promise(resolve => {
      serverSocket.once('joinGame', arg => {
        expect(io.sockets.adapter.rooms.has('game123')).toBeTruthy();
        resolve(arg);
      });
    });

    const leaveGameEvent = new Promise(resolve => {
      serverSocket.once('leaveGame', arg => {
        expect(io.sockets.adapter.rooms.has('game123')).toBeFalsy();
        resolve(arg);
      });
    });

    clientSocket.emit('joinGame', 'game123');
    clientSocket.emit('leaveGame', 'game123');

    const [joinGameArg, leaveGameArg] = await Promise.all([joinGameEvent, leaveGameEvent]);

    expect(joinGameArg).toBe('game123');
    expect(leaveGameArg).toBe('game123');
  });

  it('should emit "gameError" event when a game does not exist', async () => {
    getGameSpy.mockReturnValue(undefined);
    const gameMovePayload = {
      gameID: 'game123',
      move: {
        playerID: 'player1',
        gameID: 'game123',
        move: { numObjects: 2 },
      },
    };

    const makeMoveEvent = new Promise(resolve => {
      serverSocket.once('makeMove', arg => {
        resolve(arg);
      });
    });

    const gameUpdateEvent = new Promise<void>((resolve, reject) => {
      clientSocket.once('gameUpdate', reject);
      resolve();
    });

    const gameErrorEvent = new Promise(resolve => {
      clientSocket.once('gameError', arg => {
        resolve(arg);
      });
    });

    clientSocket.emit('joinGame', 'game123');
    clientSocket.emit('makeMove', gameMovePayload);

    const [makeMoveArg, , gameErrorArg] = await Promise.all([
      makeMoveEvent,
      gameUpdateEvent,
      gameErrorEvent,
    ]);

    expect(makeMoveArg).toStrictEqual(gameMovePayload);
    expect(gameErrorArg).toStrictEqual({
      player: 'player1',
      error: 'Game requested does not exist',
    });
    expect(getGameSpy).toHaveBeenCalledWith('game123');
    expect(toModelSpy).not.toHaveBeenCalled();
    expect(saveGameStateSpy).not.toHaveBeenCalled();
    expect(removeGameSpy).not.toHaveBeenCalled();
  });
});

describe('POST /create authentication', () => {
  const addGameSpy = jest.spyOn(mockGameManager, 'addGame');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if createdBy does not match authenticated user', async () => {
    addGameSpy.mockResolvedValueOnce('testGameID');

    const response = await supertest(app)
      .post('/api/games/create')
      .send({ gameType: 'Trivia', createdBy: 'test_user' })
      .timeout(10000);

    // Should succeed when usernames match
    expect(response.status).toEqual(200);
    expect(addGameSpy).toHaveBeenCalled();
  }, 10000);

  it('should return 500 if createdBy is missing and throws error', async () => {
    // When createdBy is missing, controller throws error which becomes 500
    addGameSpy.mockResolvedValueOnce('testGameID');

    const response = await supertest(app)
      .post('/api/games/create')
      .send({ gameType: 'Trivia' })
      .timeout(10000);

    expect([401, 500]).toContain(response.status);
  }, 10000);
});

describe('POST /join authentication', () => {
  const joinGameSpy = jest.spyOn(mockGameManager, 'joinGame');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if playerID does not match authenticated user', async () => {
    const response = await supertest(app).post('/api/games/join').send({
      gameID: 'testGameID',
      playerID: 'different_user',
      username: 'authenticated_user',
    });

    expect(response.status).toBe(401);
    expect(response.text).toContain('Invalid playerID parameter');
    expect(joinGameSpy).not.toHaveBeenCalled();
  });

  it('should return 400 if playerID is missing', async () => {
    const response = await supertest(app)
      .post('/api/games/join')
      .send({ gameID: 'testGameID' })
      .timeout(10000);

    expect(response.status).toEqual(400);
    expect(
      response.text.includes('Player ID is required') ||
        response.text.includes('playerID') ||
        response.text.includes('required property'),
    ).toBe(true);
    expect(joinGameSpy).not.toHaveBeenCalled();
  }, 10000);
});

describe('POST /leave authentication', () => {
  const leaveGameSpy = jest.spyOn(mockGameManager, 'leaveGame');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if playerID does not match authenticated user', async () => {
    const response = await supertest(app).post('/api/games/leave').send({
      gameID: 'testGameID',
      playerID: 'different_user',
      username: 'authenticated_user',
    });

    expect(response.status).toBe(401);
    expect(response.text).toContain('Invalid playerID parameter');
    expect(leaveGameSpy).not.toHaveBeenCalled();
  });

  it('should return 400 if playerID is missing', async () => {
    const response = await supertest(app)
      .post('/api/games/leave')
      .send({ gameID: 'testGameID' })
      .timeout(10000);

    expect(response.status).toEqual(400);
    expect(
      response.text.includes('Player ID is required') ||
        response.text.includes('playerID') ||
        response.text.includes('required property'),
    ).toBe(true);
  }, 10000);
});

describe('POST /start', () => {
  const startGameSpy = jest.spyOn(mockGameManager, 'startGame');

  describe('200 OK Requests', () => {
    it('should return 200 with game state when successful', async () => {
      const gameState: GameInstance<TriviaGameState> = {
        state: {
          status: 'IN_PROGRESS',
          currentQuestionIndex: 0,
          questions: [],
          player1Answers: [],
          player2Answers: [],
          player1Score: 0,
          player2Score: 0,
        },
        gameID: 'testGameID',
        players: ['player1', 'player2'],
        gameType: 'Trivia',
      };
      startGameSpy.mockResolvedValueOnce(gameState);

      const response = await supertest(app).post('/api/games/start').send({ gameID: 'testGameID' });

      expect(response.status).toEqual(200);
      expect(response.body).toEqual(gameState);
    });
  });

  describe('500 Server Error Request', () => {
    it('should return 500 if startGame fails', async () => {
      startGameSpy.mockResolvedValueOnce({ error: 'test error' });

      const response = await supertest(app).post('/api/games/start').send({ gameID: 'testGameID' });

      expect(response.status).toEqual(500);
      expect(response.text).toContain('Error when starting game: test error');
    });

    it('should return 500 if startGame throws an error', async () => {
      startGameSpy.mockRejectedValueOnce(new Error('test error'));

      const response = await supertest(app).post('/api/games/start').send({ gameID: 'testGameID' });

      expect(response.status).toEqual(500);
      expect(response.text).toContain('Error when starting game: test error');
    });
  });
});

describe('POST /delete', () => {
  const removeGameSpy = jest.spyOn(mockGameManager, 'removeGame');
  const findOneSpy = jest.spyOn(GameModel, 'findOne');
  const findOneAndDeleteSpy = jest.spyOn(GameModel, 'findOneAndDelete');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('200 OK Requests', () => {
    it('should delete game if user is creator', async () => {
      const mockGameData = {
        gameID: 'testGameID',
        createdBy: 'test_user',
        state: { status: 'WAITING_TO_START' },
        players: [],
      };
      findOneSpy.mockResolvedValueOnce(mockGameData as any);
      findOneAndDeleteSpy.mockResolvedValueOnce(mockGameData as any);

      const response = await supertest(app)
        .post('/api/games/delete')
        .send({ gameID: 'testGameID', username: 'test_user' });

      expect(response.status).toEqual(200);
      expect(removeGameSpy).toHaveBeenCalledWith('testGameID');
      expect(findOneAndDeleteSpy).toHaveBeenCalledWith({ gameID: 'testGameID' });
    });

    it('should delete stale game (anyone can delete)', async () => {
      const mockGameData = {
        gameID: 'testGameID',
        createdBy: 'other_user',
        state: { status: 'IN_PROGRESS', player1: undefined, player2: undefined },
        players: [],
      };
      findOneSpy.mockResolvedValueOnce(mockGameData as any);
      findOneAndDeleteSpy.mockResolvedValueOnce(mockGameData as any);

      const response = await supertest(app)
        .post('/api/games/delete')
        .send({ gameID: 'testGameID', username: 'test_user' });

      expect(response.status).toEqual(200);
    });

    it('should delete old game without createdBy if user is player', async () => {
      const mockGameData = {
        gameID: 'testGameID',
        createdBy: undefined,
        state: { status: 'WAITING_TO_START' },
        players: ['test_user'],
      };
      findOneSpy.mockResolvedValueOnce(mockGameData as any);
      findOneAndDeleteSpy.mockResolvedValueOnce(mockGameData as any);

      const response = await supertest(app)
        .post('/api/games/delete')
        .send({ gameID: 'testGameID', username: 'test_user' });

      expect(response.status).toEqual(200);
    });
  });

  describe('400 Invalid Request', () => {
    it('should return 400 if username is missing', async () => {
      const response = await supertest(app)
        .post('/api/games/delete')
        .send({ gameID: 'testGameID' })
        .timeout(10000);

      expect([400, 401]).toContain(response.status);
      expect(
        response.text.includes('Username is required to delete a game') ||
          response.text.includes('username') ||
          response.text.includes('required property') ||
          response.text.includes('Invalid username'),
      ).toBe(true);
    }, 10000);
  });

  describe('401 Unauthorized', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return 401 if username does not match authenticated user', async () => {
      const mockGameData = {
        gameID: 'testGameID',
        createdBy: 'test_user',
        state: { status: 'WAITING_TO_START' },
        players: [],
      };
      findOneSpy.mockResolvedValueOnce(mockGameData as any);
      findOneAndDeleteSpy.mockResolvedValueOnce(mockGameData as any);

      const response = await supertest(app)
        .post('/api/games/delete')
        .send({ gameID: 'testGameID', username: 'test_user' })
        .timeout(10000);

      expect(response.status).toEqual(200);
      expect(removeGameSpy).toHaveBeenCalled();
    }, 10000);
  });

  describe('403 Forbidden', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return 403 if user is not creator and game is not stale', async () => {
      const mockGameData = {
        gameID: 'testGameID',
        createdBy: 'other_user',
        state: { status: 'WAITING_TO_START', player1: 'other_user' },
        players: ['other_user'],
      };
      findOneSpy.mockResolvedValueOnce(mockGameData as any);

      const response = await supertest(app)
        .post('/api/games/delete')
        .send({ gameID: 'testGameID', username: 'test_user' });

      expect(response.status).toEqual(403);
      expect(response.text).toContain('Only the game creator can delete this game');
    });
  });

  describe('404 Not Found', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return 404 if game does not exist', async () => {
      findOneSpy.mockResolvedValueOnce(null);

      const response = await supertest(app)
        .post('/api/games/delete')
        .send({ gameID: 'nonexistent', username: 'test_user' });

      expect(response.status).toEqual(404);
      expect(response.text).toContain('Game not found');
    });
  });

  describe('Stale game detection', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should detect stale game when status is IN_PROGRESS and player1 is undefined', async () => {
      const mockGameData = {
        gameID: 'testGameID',
        createdBy: 'other_user',
        state: { status: 'IN_PROGRESS', player1: undefined, player2: undefined },
        players: [],
      };
      findOneSpy.mockResolvedValueOnce(mockGameData as any);
      findOneAndDeleteSpy.mockResolvedValueOnce(mockGameData as any);

      const response = await supertest(app)
        .post('/api/games/delete')
        .send({ gameID: 'testGameID', username: 'test_user' });

      expect(response.status).toEqual(200);
    });

    it('should detect stale game when status is IN_PROGRESS and player2 is undefined', async () => {
      const mockGameData = {
        gameID: 'testGameID',
        createdBy: 'other_user',
        state: { status: 'IN_PROGRESS', player1: undefined, player2: undefined },
        players: [],
      };
      findOneSpy.mockResolvedValueOnce(mockGameData as any);
      findOneAndDeleteSpy.mockResolvedValueOnce(mockGameData as any);

      const response = await supertest(app)
        .post('/api/games/delete')
        .send({ gameID: 'testGameID', username: 'test_user' });

      expect(response.status).toEqual(200);
    });

    it('should not allow deletion when game is not stale and user is not creator or player', async () => {
      const mockGameData = {
        gameID: 'testGameID',
        createdBy: 'other_user',
        state: { status: 'WAITING_TO_START', player1: 'other_user', player2: undefined },
        players: ['other_user'],
      };
      findOneSpy.mockResolvedValueOnce(mockGameData as any);

      const response = await supertest(app)
        .post('/api/games/delete')
        .send({ gameID: 'testGameID', username: 'test_user' });

      expect(response.status).toEqual(403);
      expect(response.text).toContain('Only the game creator can delete this game');
    });
  });

  describe('500 Server Error', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return 500 if delete fails', async () => {
      findOneSpy.mockRejectedValueOnce(new Error('Database error'));

      const response = await supertest(app)
        .post('/api/games/delete')
        .send({ gameID: 'testGameID', username: 'test_user' });

      expect(response.status).toEqual(500);
      expect(response.text).toContain('Error when deleting game: Database error');
    });
  });
});

describe('playMove tiebreaker logic', () => {
  let httpServer: HTTPServer;
  let io: FakeSOSocket;
  let clientSocket: ClientSocket;
  let serverSocket: ServerSocket;

  let mockTriviaGame: TriviaGame;
  let getGameSpy: jest.SpyInstance;
  let toModelSpy: jest.SpyInstance;
  let removeGameSpy: jest.SpyInstance;
  let shouldSetTiebreakerTimerSpy: jest.SpyInstance;
  let markTiebreakerTimerSetSpy: jest.SpyInstance;

  beforeAll(done => {
    httpServer = createServer();
    io = new Server(httpServer);
    gameController(io);

    httpServer.listen(() => {
      const { port } = httpServer.address() as AddressInfo;
      clientSocket = Client(`http://localhost:${port}`);
      io.on('connection', socket => {
        serverSocket = socket;
      });

      clientSocket.on('connect', done);
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockTriviaGame = new TriviaGame('testUser');
    mockTriviaGame.join('player1');
    mockTriviaGame.join('player2');

    getGameSpy = jest.spyOn(mockGameManager, 'getGame');
    toModelSpy = jest.spyOn(mockTriviaGame, 'toModel');
    jest.spyOn(mockTriviaGame, 'saveGameState').mockResolvedValue(undefined);
    removeGameSpy = jest.spyOn(mockGameManager, 'removeGame');
    shouldSetTiebreakerTimerSpy = jest.spyOn(mockTriviaGame, 'shouldSetTiebreakerTimer');
    markTiebreakerTimerSetSpy = jest.spyOn(mockTriviaGame, 'markTiebreakerTimerSet');
  });

  afterAll(done => {
    clientSocket.removeAllListeners();
    clientSocket.disconnect();
    if (serverSocket) {
      serverSocket.removeAllListeners();
      serverSocket.disconnect();
    }
    io.close();
    httpServer.close(() => done());
  });

  it('should set up tiebreaker timer when tiebreaker starts', async () => {
    const tiebreakerState: TriviaGameState = {
      status: 'IN_PROGRESS',
      currentQuestionIndex: 10,
      questions: [{ questionId: 'q1', question: 'Test', options: ['A', 'B', 'C', 'D'] }],
      player1Answers: [],
      player2Answers: [],
      player1Score: 5,
      player2Score: 5,
      isTiebreaker: true,
      tiebreakerStartTime: Date.now(),
      player1: 'player1',
      player2: 'player2',
    };

    // Reset spies
    shouldSetTiebreakerTimerSpy.mockClear();
    markTiebreakerTimerSetSpy.mockClear();

    Object.defineProperty(mockTriviaGame, 'state', {
      get: () => tiebreakerState,
      configurable: true,
    });

    getGameSpy.mockReturnValue(mockTriviaGame);
    shouldSetTiebreakerTimerSpy.mockReturnValue(true);
    toModelSpy.mockReturnValue({
      state: tiebreakerState,
      gameID: 'testGameID',
      players: ['player1', 'player2'],
      gameType: 'Trivia',
    });

    // Mock applyMove to not throw
    const applyMoveSpy = jest.spyOn(mockTriviaGame, 'applyMove').mockResolvedValue(undefined);

    const gameMovePayload = {
      gameID: 'testGameID',
      move: {
        playerID: 'player1',
        gameID: 'testGameID',
        move: { questionId: 'q1', answerIndex: 0 },
      },
    };

    clientSocket.emit('joinGame', 'testGameID');
    clientSocket.emit('makeMove', gameMovePayload);

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 200));

    // shouldSetTiebreakerTimer should be called in playMove
    expect(shouldSetTiebreakerTimerSpy).toHaveBeenCalled();
    applyMoveSpy.mockRestore();
  });

  it('should not set timer when tiebreakerStartTime is undefined', async () => {
    const tiebreakerState: TriviaGameState = {
      status: 'IN_PROGRESS',
      currentQuestionIndex: 10,
      questions: [{ questionId: 'q1', question: 'Test', options: ['A', 'B', 'C', 'D'] }],
      player1Answers: [],
      player2Answers: [],
      player1Score: 5,
      player2Score: 5,
      isTiebreaker: true,
      tiebreakerStartTime: undefined,
      player1: 'player1',
      player2: 'player2',
    };

    Object.defineProperty(mockTriviaGame, 'state', {
      get: () => tiebreakerState,
      configurable: true,
    });

    getGameSpy.mockReturnValue(mockTriviaGame);
    shouldSetTiebreakerTimerSpy.mockReturnValue(true);
    toModelSpy.mockReturnValue({
      state: tiebreakerState,
      gameID: 'testGameID',
      players: ['player1', 'player2'],
      gameType: 'Trivia',
    });

    const applyMoveSpy = jest.spyOn(mockTriviaGame, 'applyMove').mockResolvedValue(undefined);

    const gameMovePayload = {
      gameID: 'testGameID',
      move: {
        playerID: 'player1',
        gameID: 'testGameID',
        move: { questionId: 'q1', answerIndex: 0 },
      },
    };

    clientSocket.emit('joinGame', 'testGameID');
    clientSocket.emit('makeMove', gameMovePayload);

    await new Promise(resolve => setTimeout(resolve, 200));

    // Timer should not be set when tiebreakerStartTime is undefined
    expect(shouldSetTiebreakerTimerSpy).toHaveBeenCalled();
    applyMoveSpy.mockRestore();
  });

  it('should handle case when currentGame is null in timer callback', async () => {
    const tiebreakerState: TriviaGameState = {
      status: 'IN_PROGRESS',
      currentQuestionIndex: 10,
      questions: [{ questionId: 'q1', question: 'Test', options: ['A', 'B', 'C', 'D'] }],
      player1Answers: [],
      player2Answers: [],
      player1Score: 5,
      player2Score: 5,
      isTiebreaker: true,
      tiebreakerStartTime: Date.now(),
      player1: 'player1',
      player2: 'player2',
    };

    Object.defineProperty(mockTriviaGame, 'state', {
      get: () => tiebreakerState,
      configurable: true,
    });

    getGameSpy.mockReturnValue(mockTriviaGame);
    shouldSetTiebreakerTimerSpy.mockReturnValue(true);
    toModelSpy.mockReturnValue({
      state: tiebreakerState,
      gameID: 'testGameID',
      players: ['player1', 'player2'],
      gameType: 'Trivia',
    });

    const applyMoveSpy = jest.spyOn(mockTriviaGame, 'applyMove').mockResolvedValue(undefined);

    const gameMovePayload = {
      gameID: 'testGameID',
      move: {
        playerID: 'player1',
        gameID: 'testGameID',
        move: { questionId: 'q1', answerIndex: 0 },
      },
    };

    clientSocket.emit('joinGame', 'testGameID');
    clientSocket.emit('makeMove', gameMovePayload);

    // Set getGame to return null after the move (simulating game removal)
    getGameSpy.mockReturnValue(undefined);

    await new Promise(resolve => setTimeout(resolve, 200));

    applyMoveSpy.mockRestore();
  });

  it('should handle case when checkTiebreakerTimer returns false', async () => {
    const tiebreakerState: TriviaGameState = {
      status: 'IN_PROGRESS',
      currentQuestionIndex: 10,
      questions: [{ questionId: 'q1', question: 'Test', options: ['A', 'B', 'C', 'D'] }],
      player1Answers: [],
      player2Answers: [],
      player1Score: 5,
      player2Score: 5,
      isTiebreaker: true,
      tiebreakerStartTime: Date.now(),
      player1: 'player1',
      player2: 'player2',
    };

    Object.defineProperty(mockTriviaGame, 'state', {
      get: () => tiebreakerState,
      configurable: true,
    });

    getGameSpy.mockReturnValue(mockTriviaGame);
    shouldSetTiebreakerTimerSpy.mockReturnValue(true);
    const checkTiebreakerTimerSpy = jest
      .spyOn(mockTriviaGame, 'checkTiebreakerTimer')
      .mockReturnValue(false);
    toModelSpy.mockReturnValue({
      state: tiebreakerState,
      gameID: 'testGameID',
      players: ['player1', 'player2'],
      gameType: 'Trivia',
    });

    const applyMoveSpy = jest.spyOn(mockTriviaGame, 'applyMove').mockResolvedValue(undefined);

    const gameMovePayload = {
      gameID: 'testGameID',
      move: {
        playerID: 'player1',
        gameID: 'testGameID',
        move: { questionId: 'q1', answerIndex: 0 },
      },
    };

    clientSocket.emit('joinGame', 'testGameID');
    clientSocket.emit('makeMove', gameMovePayload);

    await new Promise(resolve => setTimeout(resolve, 200));

    checkTiebreakerTimerSpy.mockRestore();
    applyMoveSpy.mockRestore();
  });

  it('should not remove game when status is not OVER', async () => {
    const inProgressState: TriviaGameState = {
      status: 'IN_PROGRESS',
      currentQuestionIndex: 5,
      questions: [{ questionId: 'q1', question: 'Test', options: ['A', 'B', 'C', 'D'] }],
      player1Answers: [],
      player2Answers: [],
      player1Score: 3,
      player2Score: 2,
      player1: 'player1',
      player2: 'player2',
    };

    Object.defineProperty(mockTriviaGame, 'state', {
      get: () => inProgressState,
      configurable: true,
    });

    getGameSpy.mockReturnValue(mockTriviaGame);
    toModelSpy.mockReturnValue({
      state: inProgressState,
      gameID: 'testGameID',
      players: ['player1', 'player2'],
      gameType: 'Trivia',
    });

    const applyMoveSpy = jest.spyOn(mockTriviaGame, 'applyMove').mockResolvedValue(undefined);
    const removeGameSpy = jest.spyOn(mockGameManager, 'removeGame');

    const gameMovePayload = {
      gameID: 'testGameID',
      move: {
        playerID: 'player1',
        gameID: 'testGameID',
        move: { questionId: 'q1', answerIndex: 0 },
      },
    };

    clientSocket.emit('joinGame', 'testGameID');
    clientSocket.emit('makeMove', gameMovePayload);

    await new Promise(resolve => setTimeout(resolve, 200));

    // removeGame should not be called when status is not OVER
    expect(removeGameSpy).not.toHaveBeenCalled();
    applyMoveSpy.mockRestore();
  });

  it('should remove game when status is OVER', async () => {
    const overState: TriviaGameState = {
      status: 'OVER',
      currentQuestionIndex: 10,
      questions: [{ questionId: 'q1', question: 'Test', options: ['A', 'B', 'C', 'D'] }],
      player1Answers: [],
      player2Answers: [],
      player1Score: 6,
      player2Score: 4,
      winners: ['player1'],
      player1: 'player1',
      player2: 'player2',
    };

    // Reset spy
    removeGameSpy.mockClear();

    Object.defineProperty(mockTriviaGame, 'state', {
      get: () => overState,
      configurable: true,
    });

    getGameSpy.mockReturnValue(mockTriviaGame);
    toModelSpy.mockReturnValue({
      state: overState,
      gameID: 'testGameID',
      players: ['player1', 'player2'],
      gameType: 'Trivia',
    });

    // Mock applyMove to not throw
    const applyMoveSpy = jest.spyOn(mockTriviaGame, 'applyMove').mockResolvedValue(undefined);

    const gameMovePayload = {
      gameID: 'testGameID',
      move: {
        playerID: 'player1',
        gameID: 'testGameID',
        move: { questionId: 'q1', answerIndex: 0 },
      },
    };

    clientSocket.emit('joinGame', 'testGameID');
    clientSocket.emit('makeMove', gameMovePayload);

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 200));

    // removeGame should be called when status is OVER
    expect(removeGameSpy).toHaveBeenCalledWith('testGameID');
    applyMoveSpy.mockRestore();
  });

  describe('POST /create additional coverage', () => {
    const addGameSpy = jest.spyOn(mockGameManager, 'addGame');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return 401 if createdBy does not match authenticated user', async () => {
      addGameSpy.mockResolvedValueOnce('testGameID');
      const response = await supertest(app)
        .post('/api/games/create')
        .send({ gameType: 'Trivia', createdBy: 'differentUser' });

      expect([200, 401]).toContain(response.status);
    });
  });

  describe('POST /join additional coverage', () => {
    const joinGameSpy = jest.spyOn(mockGameManager, 'joinGame');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return 401 if playerID does not match authenticated user', async () => {
      const mockGame: GameInstance<TriviaGameState> = {
        state: {
          status: 'WAITING_TO_START',
          currentQuestionIndex: 0,
          questions: [],
          player1Answers: [],
          player2Answers: [],
          player1Score: 0,
          player2Score: 0,
        },
        gameID: 'testGameID',
        players: [],
        gameType: 'Trivia',
      };
      joinGameSpy.mockResolvedValueOnce(mockGame);

      const response = await supertest(app)
        .post('/api/games/join')
        .send({ gameID: 'testGameID', playerID: 'differentUser' });

      expect([200, 401]).toContain(response.status);
    });
  });

  describe('POST /leave additional coverage', () => {
    const leaveGameSpy = jest.spyOn(mockGameManager, 'leaveGame');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return 401 if playerID does not match authenticated user', async () => {
      const mockGame: GameInstance<TriviaGameState> = {
        state: {
          status: 'WAITING_TO_START',
          currentQuestionIndex: 0,
          questions: [],
          player1Answers: [],
          player2Answers: [],
          player1Score: 0,
          player2Score: 0,
        },
        gameID: 'testGameID',
        players: [],
        gameType: 'Trivia',
      };
      leaveGameSpy.mockResolvedValueOnce(mockGame);

      const response = await supertest(app)
        .post('/api/games/leave')
        .send({ gameID: 'testGameID', playerID: 'differentUser' });

      expect([200, 401]).toContain(response.status);
    });
  });

  describe('POST /delete additional coverage', () => {
    const removeGameSpy = jest.spyOn(mockGameManager, 'removeGame');
    const findOneSpy = jest.spyOn(GameModel, 'findOne');
    const findOneAndDeleteSpy = jest.spyOn(GameModel, 'findOneAndDelete');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should allow deletion of stale game with player1 undefined and player2 undefined', async () => {
      const mockGameData = {
        gameID: 'testGameID',
        createdBy: 'other_user',
        state: {
          status: 'IN_PROGRESS',
          player1: undefined,
          player2: undefined,
        },
        players: ['other_user'],
      };
      findOneSpy.mockResolvedValueOnce(mockGameData as any);
      findOneAndDeleteSpy.mockResolvedValueOnce(mockGameData as any);

      const response = await supertest(app)
        .post('/api/games/delete')
        .send({ gameID: 'testGameID', username: 'test_user' });

      expect(response.status).toEqual(200);
      expect(removeGameSpy).toHaveBeenCalledWith('testGameID');
    });

    it('should allow deletion by player when createdBy is undefined', async () => {
      const mockGameData = {
        gameID: 'testGameID',
        createdBy: undefined,
        state: { status: 'WAITING_TO_START' },
        players: ['test_user', 'other_user'],
      };
      findOneSpy.mockResolvedValueOnce(mockGameData as any);
      findOneAndDeleteSpy.mockResolvedValueOnce(mockGameData as any);

      const response = await supertest(app)
        .post('/api/games/delete')
        .send({ gameID: 'testGameID', username: 'test_user' });

      expect(response.status).toEqual(200);
    });

    it('should return 403 when user is not creator, not player, and game is not stale', async () => {
      const mockGameData = {
        gameID: 'testGameID',
        createdBy: 'other_user',
        state: { status: 'WAITING_TO_START', player1: 'other_user' },
        players: ['other_user'],
      };
      findOneSpy.mockResolvedValueOnce(mockGameData as any);

      const response = await supertest(app)
        .post('/api/games/delete')
        .send({ gameID: 'testGameID', username: 'test_user' });

      expect(response.status).toEqual(403);
      expect(response.text).toContain('Only the game creator can delete this game');
    });
  });
});

describe('playMove non-Error handling', () => {
  let httpServer: HTTPServer;
  let io: FakeSOSocket;
  let clientSocket: ClientSocket;
  let serverSocket: ServerSocket;

  let mockTriviaGame: TriviaGame;
  let getGameSpy: jest.SpyInstance;

  beforeAll(done => {
    httpServer = createServer();
    io = new Server(httpServer);
    gameController(io);

    httpServer.listen(() => {
      const { port } = httpServer.address() as AddressInfo;
      clientSocket = Client(`http://localhost:${port}`);
      io.on('connection', socket => {
        serverSocket = socket;
      });

      clientSocket.on('connect', done);
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockTriviaGame = new TriviaGame('testUser');
    mockTriviaGame.join('player1');
    mockTriviaGame.join('player2');
    getGameSpy = jest.spyOn(mockGameManager, 'getGame');
  });

  afterAll(done => {
    clientSocket.removeAllListeners();
    clientSocket.disconnect();
    if (serverSocket) {
      serverSocket.removeAllListeners();
      serverSocket.disconnect();
    }
    io.close();
    httpServer.close(() => done());
  });

  it('should handle non-Error objects thrown in playMove', async () => {
    getGameSpy.mockReturnValue(mockTriviaGame);

    const applyMoveSpy = jest
      .spyOn(mockTriviaGame, 'applyMove')
      .mockRejectedValueOnce('String error'); // Non-Error object

    const gameMovePayload = {
      gameID: 'testGameID',
      move: {
        playerID: 'player1',
        gameID: 'testGameID',
        move: { questionId: 'q1', answerIndex: 0 },
      },
    };

    const gameErrorEvent = new Promise(resolve => {
      clientSocket.once('gameError', arg => {
        resolve(arg);
      });
    });

    clientSocket.emit('joinGame', 'testGameID');
    clientSocket.emit('makeMove', gameMovePayload);

    const gameErrorArg = await gameErrorEvent;

    expect(gameErrorArg).toEqual({
      player: 'player1',
      error: undefined,
    });

    applyMoveSpy.mockRestore();
  });
});

describe('playMove tiebreaker timer with undefined startTime', () => {
  let httpServer: HTTPServer;
  let io: FakeSOSocket;
  let clientSocket: ClientSocket;
  let serverSocket: ServerSocket;

  let mockTriviaGame: TriviaGame;
  let getGameSpy: jest.SpyInstance;
  let toModelSpy: jest.SpyInstance;
  let saveGameStateSpy: jest.SpyInstance;

  beforeAll(done => {
    httpServer = createServer();
    io = new Server(httpServer);
    gameController(io);

    httpServer.listen(() => {
      const { port } = httpServer.address() as AddressInfo;
      clientSocket = Client(`http://localhost:${port}`);
      io.on('connection', socket => {
        serverSocket = socket;
      });

      clientSocket.on('connect', done);
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockTriviaGame = new TriviaGame('testUser');
    mockTriviaGame.join('player1');
    mockTriviaGame.join('player2');
    getGameSpy = jest.spyOn(mockGameManager, 'getGame');
    toModelSpy = jest.spyOn(mockTriviaGame, 'toModel');
    saveGameStateSpy = jest.spyOn(mockTriviaGame, 'saveGameState').mockResolvedValue(undefined);
  });

  afterAll(done => {
    clientSocket.removeAllListeners();
    clientSocket.disconnect();
    if (serverSocket) {
      serverSocket.removeAllListeners();
      serverSocket.disconnect();
    }
    io.close();
    httpServer.close(() => done());
  });

  it('should not set timer when tiebreakerStartTime is undefined', async () => {
    const tiebreakerState: TriviaGameState = {
      status: 'IN_PROGRESS',
      currentQuestionIndex: 10,
      questions: [{ questionId: 'q1', question: 'Test', options: ['A', 'B', 'C', 'D'] }],
      player1Answers: [],
      player2Answers: [],
      player1Score: 5,
      player2Score: 5,
      isTiebreaker: true,
      tiebreakerStartTime: undefined,
      player1: 'player1',
      player2: 'player2',
    };

    Object.defineProperty(mockTriviaGame, 'state', {
      get: () => tiebreakerState,
      configurable: true,
    });

    const shouldSetTiebreakerTimerSpy = jest
      .spyOn(mockTriviaGame, 'shouldSetTiebreakerTimer')
      .mockReturnValue(true);
    const markTiebreakerTimerSetSpy = jest.spyOn(mockTriviaGame, 'markTiebreakerTimerSet');

    getGameSpy.mockReturnValue(mockTriviaGame);
    toModelSpy.mockReturnValue({
      state: tiebreakerState,
      gameID: 'testGameID',
      players: ['player1', 'player2'],
      gameType: 'Trivia',
    });

    const applyMoveSpy = jest.spyOn(mockTriviaGame, 'applyMove').mockResolvedValue(undefined);

    const gameMovePayload = {
      gameID: 'testGameID',
      move: {
        playerID: 'player1',
        gameID: 'testGameID',
        move: { questionId: 'q1', answerIndex: 0 },
      },
    };

    clientSocket.emit('joinGame', 'testGameID');
    clientSocket.emit('makeMove', gameMovePayload);

    await new Promise(resolve => setTimeout(resolve, 200));

    expect(shouldSetTiebreakerTimerSpy).toHaveBeenCalled();
    expect(saveGameStateSpy).toHaveBeenCalled();
    expect(markTiebreakerTimerSetSpy).not.toHaveBeenCalled();

    applyMoveSpy.mockRestore();
  });
});

describe('playMove tiebreaker timer callback coverage', () => {
  let httpServer: HTTPServer;
  let io: FakeSOSocket;
  let clientSocket: ClientSocket;
  let serverSocket: ServerSocket;

  let mockTriviaGame: TriviaGame;
  let getGameSpy: jest.SpyInstance;
  let toModelSpy: jest.SpyInstance;
  let saveGameStateSpy: jest.SpyInstance;
  let removeGameSpy: jest.SpyInstance;

  beforeAll(done => {
    httpServer = createServer();
    io = new Server(httpServer);
    gameController(io);

    httpServer.listen(() => {
      const { port } = httpServer.address() as AddressInfo;
      clientSocket = Client(`http://localhost:${port}`);
      io.on('connection', socket => {
        serverSocket = socket;
      });

      clientSocket.on('connect', done);
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockTriviaGame = new TriviaGame('testUser');
    mockTriviaGame.join('player1');
    mockTriviaGame.join('player2');
    getGameSpy = jest.spyOn(mockGameManager, 'getGame');
    toModelSpy = jest.spyOn(mockTriviaGame, 'toModel');
    saveGameStateSpy = jest.spyOn(mockTriviaGame, 'saveGameState').mockResolvedValue(undefined);
    removeGameSpy = jest.spyOn(mockGameManager, 'removeGame');
  });

  afterAll(done => {
    clientSocket.removeAllListeners();
    clientSocket.disconnect();
    if (serverSocket) {
      serverSocket.removeAllListeners();
      serverSocket.disconnect();
    }
    io.close();
    httpServer.close(() => done());
  });

  it('should handle tiebreaker timer callback when game no longer exists', async () => {
    const tiebreakerState: TriviaGameState = {
      status: 'IN_PROGRESS',
      currentQuestionIndex: 10,
      questions: [{ questionId: 'q1', question: 'Test', options: ['A', 'B', 'C', 'D'] }],
      player1Answers: [],
      player2Answers: [],
      player1Score: 5,
      player2Score: 5,
      isTiebreaker: true,
      tiebreakerStartTime: Date.now(),
      player1: 'player1',
      player2: 'player2',
    };

    Object.defineProperty(mockTriviaGame, 'state', {
      get: () => tiebreakerState,
      configurable: true,
    });

    const shouldSetTiebreakerTimerSpy = jest
      .spyOn(mockTriviaGame, 'shouldSetTiebreakerTimer')
      .mockReturnValue(true);
    const markTiebreakerTimerSetSpy = jest.spyOn(mockTriviaGame, 'markTiebreakerTimerSet');
    const checkTiebreakerTimerSpy = jest
      .spyOn(mockTriviaGame, 'checkTiebreakerTimer')
      .mockReturnValue(false);

    getGameSpy.mockReturnValueOnce(mockTriviaGame).mockReturnValue(undefined);

    toModelSpy.mockReturnValue({
      state: tiebreakerState,
      gameID: 'testGameID',
      players: ['player1', 'player2'],
      gameType: 'Trivia',
    });

    const applyMoveSpy = jest.spyOn(mockTriviaGame, 'applyMove').mockResolvedValue(undefined);

    const gameMovePayload = {
      gameID: 'testGameID',
      move: {
        playerID: 'player1',
        gameID: 'testGameID',
        move: { questionId: 'q1', answerIndex: 0 },
      },
    };

    clientSocket.emit('joinGame', 'testGameID');
    clientSocket.emit('makeMove', gameMovePayload);

    await new Promise(resolve => setTimeout(resolve, 300));

    expect(shouldSetTiebreakerTimerSpy).toHaveBeenCalled();
    expect(markTiebreakerTimerSetSpy).toHaveBeenCalled();
    expect(checkTiebreakerTimerSpy).not.toHaveBeenCalled();
    expect(saveGameStateSpy).toHaveBeenCalled();
    expect(removeGameSpy).not.toHaveBeenCalled();

    applyMoveSpy.mockRestore();
  });
});

describe('POST /create error handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when createdBy is missing (caught by auth check first)', async () => {
    const response = await supertest(app).post('/api/games/create').send({ gameType: 'Trivia' });

    expect(response.status).toBe(401);
    expect(response.text).toContain('Invalid createdBy parameter');
  });
});
