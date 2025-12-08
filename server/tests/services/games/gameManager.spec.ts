import GameModel from '../../../models/games.model';
import TriviaQuestionModel from '../../../models/triviaQuestion.model';
import GameManager from '../../../services/games/gameManager';
import TriviaGame from '../../../services/games/trivia';
import { GameType } from '../../../types/types';

jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'testGameID'), // Mock the return value
}));

describe('GameManager', () => {
  afterEach(() => {
    GameManager.resetInstance(); // Call the reset method
    jest.clearAllMocks(); // Clear all mocks after each test
  });

  describe('constructor', () => {
    it('should create a singleton instance of GameManager', () => {
      const gameManager = GameManager.getInstance();

      // Object references should be the same
      expect(GameManager.getInstance()).toBe(gameManager);
    });
  });

  describe('resetInstance', () => {
    it('should reset the singleton instance of GameManager', () => {
      const gameManager1 = GameManager.getInstance();

      GameManager.resetInstance();

      const gameManager2 = GameManager.getInstance();

      expect(gameManager1).not.toBe(gameManager2);
    });
  });

  describe('addGame', () => {
    const mapSetSpy = jest.spyOn(Map.prototype, 'set');

    it('should return the gameID for a successfully created game', async () => {
      jest
        .spyOn(GameModel, 'create')
        .mockResolvedValue(
          new TriviaGame('testUser').toModel() as unknown as ReturnType<typeof GameModel.create>,
        );

      const gameManager = GameManager.getInstance();
      const gameID = await gameManager.addGame('Trivia', 'testUser');

      expect(gameID).toEqual('testGameID');
      expect(mapSetSpy).toHaveBeenCalledWith(gameID, expect.any(TriviaGame));
    });

    it('should return an error for an invalid game type', async () => {
      const gameManager = GameManager.getInstance();
      // casting string for error testing purposes
      const error = await gameManager.addGame('fakeGame' as GameType, 'testUser');

      expect(mapSetSpy).not.toHaveBeenCalled();
      expect(error).toHaveProperty('error');
      expect(error).toEqual({ error: 'Invalid game type' });
    });

    it('should return an error for a database error', async () => {
      jest.spyOn(GameModel, 'create').mockRejectedValueOnce(() => new Error('database error'));

      const gameManager = GameManager.getInstance();
      // casting string for error testing purposes
      const error = await gameManager.addGame('Trivia', 'testUser');

      expect(mapSetSpy).not.toHaveBeenCalled();
      expect(error).toHaveProperty('error');
    });

    it('should handle non-Error exceptions in addGame', async () => {
      jest.spyOn(GameModel, 'create').mockRejectedValueOnce('String error');

      const gameManager = GameManager.getInstance();
      const error = await gameManager.addGame('Trivia', 'testUser');

      expect(error).toHaveProperty('error');
      expect((error as { error: string }).error).toBe('String error');
    });
  });

  describe('removeGame', () => {
    const mapDeleteSpy = jest.spyOn(Map.prototype, 'delete');

    it('should remove the game with the provided gameID', async () => {
      jest
        .spyOn(GameModel, 'create')
        .mockResolvedValue(
          new TriviaGame('testUser').toModel() as unknown as ReturnType<typeof GameModel.create>,
        );

      // assemble
      const gameManager = GameManager.getInstance();
      const gameID = await gameManager.addGame('Trivia', 'testUser');
      expect(gameManager.getActiveGameInstances().length).toEqual(1);

      if (typeof gameID === 'string') {
        // act
        const removed = gameManager.removeGame(gameID);

        // assess
        expect(removed).toBeTruthy();
        expect(gameManager.getActiveGameInstances().length).toEqual(0);
        expect(mapDeleteSpy).toHaveBeenCalledWith(gameID);
      }
    });

    it('should return false if there is no game with the provided gameID', async () => {
      // assemble
      const gameManager = GameManager.getInstance();
      const gameID = 'fakeGameID';

      // act
      const removed = gameManager.removeGame(gameID);

      // assess
      expect(removed).toBeFalsy();
      expect(mapDeleteSpy).toHaveBeenCalledWith(gameID);
    });
  });

  describe('getGame', () => {
    let gameManager: GameManager;
    const mapGetSpy = jest.spyOn(Map.prototype, 'get');

    beforeEach(() => {
      gameManager = GameManager.getInstance();
    });

    it('should return the game if it exists', async () => {
      // assemble
      jest
        .spyOn(GameModel, 'create')
        .mockResolvedValue(
          new TriviaGame('testUser').toModel() as unknown as ReturnType<typeof GameModel.create>,
        );

      const gameID = await gameManager.addGame('Trivia', 'testUser');

      if (typeof gameID === 'string') {
        // act
        const game = gameManager.getGame(gameID);

        expect(game).toBeInstanceOf(TriviaGame);
        expect(mapGetSpy).toHaveBeenCalledWith(gameID);
      }
    });

    it('should return undefined if the game request does not exist', () => {
      const gameID = 'fakeGameID';
      const game = gameManager.getGame(gameID);

      expect(game).toBeUndefined();
      expect(mapGetSpy).toHaveBeenCalledWith(gameID);
    });
  });

  describe('getActiveGameInstances', () => {
    it('should be empty on initialization', () => {
      const games = GameManager.getInstance().getActiveGameInstances();
      expect(games.length).toEqual(0);
    });

    it('should return active games', async () => {
      jest
        .spyOn(GameModel, 'create')
        .mockResolvedValue(
          new TriviaGame('testUser').toModel() as unknown as ReturnType<typeof GameModel.create>,
        );
      // assemble
      const gameManager = GameManager.getInstance();
      await gameManager.addGame('Trivia', 'testUser');

      // act
      const games = gameManager.getActiveGameInstances();
      expect(games.length).toEqual(1);
      expect(games[0]).toBeInstanceOf(TriviaGame);
    });
  });

  describe('joinGame', () => {
    let gameManager: GameManager;

    beforeEach(() => {
      gameManager = GameManager.getInstance();
      jest.clearAllMocks();
    });

    it('should join a game that exists in memory', async () => {
      jest
        .spyOn(GameModel, 'create')
        .mockResolvedValue(
          new TriviaGame('creator').toModel() as unknown as ReturnType<typeof GameModel.create>,
        );
      jest.spyOn(TriviaGame.prototype, 'saveGameState').mockResolvedValue(undefined);

      const gameID = await gameManager.addGame('Trivia', 'creator');
      if (typeof gameID === 'string') {
        const result = await gameManager.joinGame(gameID, 'player1');

        expect('error' in result).toBe(false);
        if (!('error' in result)) {
          expect(result.state.status).toBe('WAITING_TO_START');
        }
      }
    }, 10000);

    it('should load game from database if not in memory', async () => {
      const gameID = 'testGameID';
      const mockGameData = {
        gameID,
        gameType: 'Trivia' as const,
        createdBy: 'creator',
        state: {
          status: 'WAITING_TO_START' as const,
          currentQuestionIndex: 0,
          questions: [],
          player1Answers: [],
          player2Answers: [],
          player1Score: 0,
          player2Score: 0,
        },
        players: [],
      };

      // Mock findOne to return a Query object with lean() method
      jest.spyOn(GameModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValueOnce(mockGameData),
      } as any);
      jest.spyOn(TriviaGame.prototype, 'saveGameState').mockResolvedValue(undefined);

      const result = await gameManager.joinGame(gameID, 'player1');

      expect('error' in result).toBe(false);
      expect(GameModel.findOne).toHaveBeenCalledWith({ gameID });
    });

    it('should return error if game does not exist', async () => {
      jest.spyOn(GameModel, 'findOne').mockResolvedValue(null);

      const result = await gameManager.joinGame('nonexistent', 'player1');

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Game requested does not exist.');
      }
    });

    it('should return current state if player already in game', async () => {
      jest
        .spyOn(GameModel, 'create')
        .mockResolvedValue(
          new TriviaGame('creator').toModel() as unknown as ReturnType<typeof GameModel.create>,
        );
      jest.spyOn(TriviaGame.prototype, 'saveGameState').mockResolvedValue(undefined);

      const gameID = await gameManager.addGame('Trivia', 'creator');
      if (typeof gameID === 'string') {
        await gameManager.joinGame(gameID, 'player1');
        const result = await gameManager.joinGame(gameID, 'player1');

        expect('error' in result).toBe(false);
      }
    });

    it('should handle errors gracefully', async () => {
      // Mock findOne to return a Query that rejects when lean() is called
      jest.spyOn(GameModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockRejectedValueOnce(new Error('Database error')),
      } as any);

      const result = await gameManager.joinGame('testID', 'player1');

      expect('error' in result).toBe(true);
    });
  });

  describe('startGame', () => {
    let gameManager: GameManager;

    beforeEach(() => {
      gameManager = GameManager.getInstance();
      jest.clearAllMocks();
    });

    it('should start a game that exists in memory', async () => {
      jest
        .spyOn(GameModel, 'create')
        .mockResolvedValue(
          new TriviaGame('creator').toModel() as unknown as ReturnType<typeof GameModel.create>,
        );
      jest.spyOn(TriviaQuestionModel, 'aggregate').mockResolvedValue([]);

      const gameID = await gameManager.addGame('Trivia', 'creator');
      if (typeof gameID === 'string') {
        await gameManager.joinGame(gameID, 'player1');
        await gameManager.joinGame(gameID, 'player2');

        const result = await gameManager.startGame(gameID);

        expect('error' in result).toBe(false);
        if (!('error' in result)) {
          expect(result.state.status).toBe('IN_PROGRESS');
        }
      }
    });

    it('should load game from database if not in memory', async () => {
      const gameID = 'testGameID';
      const mockGameData = {
        gameID,
        gameType: 'Trivia' as const,
        createdBy: 'creator',
        state: {
          status: 'WAITING_TO_START' as const,
          currentQuestionIndex: 0,
          questions: [],
          player1Answers: [],
          player2Answers: [],
          player1Score: 0,
          player2Score: 0,
          player1: 'player1',
          player2: 'player2',
        },
        players: ['player1', 'player2'],
      };

      // Mock findOne to return a Query object with lean() method
      jest.spyOn(GameModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValueOnce(mockGameData),
      } as any);
      jest.spyOn(TriviaQuestionModel, 'aggregate').mockResolvedValue([]);
      jest.spyOn(TriviaGame.prototype, 'saveGameState').mockResolvedValue(undefined);

      const result = await gameManager.startGame(gameID);

      expect('error' in result).toBe(false);
    });

    it('should return error if game does not exist', async () => {
      jest.spyOn(GameModel, 'findOne').mockResolvedValue(null);

      const result = await gameManager.startGame('nonexistent');

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Game requested does not exist.');
      }
    });

    it('should handle errors gracefully', async () => {
      // Mock findOne to return a Query that rejects when lean() is called
      jest.spyOn(GameModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockRejectedValueOnce(new Error('Database error')),
      } as any);

      const result = await gameManager.startGame('testID');

      expect('error' in result).toBe(true);
    });

    it('should handle sync startGame method', async () => {
      jest
        .spyOn(GameModel, 'create')
        .mockResolvedValue(
          new TriviaGame('creator').toModel() as unknown as ReturnType<typeof GameModel.create>,
        );
      jest.spyOn(TriviaQuestionModel, 'aggregate').mockResolvedValue([]);

      const gameID = await gameManager.addGame('Trivia', 'creator');
      if (typeof gameID === 'string') {
        await gameManager.joinGame(gameID, 'player1');
        await gameManager.joinGame(gameID, 'player2');

        // Mock startGame to return void (sync)
        const game = gameManager.getGame(gameID);
        if (game) {
          const originalStartGame = (game as any).startGame;
          jest.spyOn(game as any, 'startGame').mockImplementation(() => {
            // Sync implementation
            originalStartGame.call(game);
          });

          const result = await gameManager.startGame(gameID);
          expect('error' in result).toBe(false);
        }
      }
    });

    it('should return error if game does not support starting', async () => {
      const gameID = 'testGameID';
      const mockGameData = {
        gameID,
        gameType: 'Trivia' as const,
        createdBy: 'creator',
        state: {
          status: 'WAITING_TO_START' as const,
          currentQuestionIndex: 0,
          questions: [],
          player1Answers: [],
          player2Answers: [],
          player1Score: 0,
          player2Score: 0,
          player1: 'player1',
          player2: 'player2',
        },
        players: ['player1', 'player2'],
      };

      jest.spyOn(GameModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValueOnce(mockGameData),
      } as any);

      // Create a mock game without startGame method
      const mockGame = {
        id: gameID,
        state: mockGameData.state,
        toModel: () => mockGameData,
        saveGameState: jest.fn().mockResolvedValue(undefined),
      };

      // Override getGame to return mock game without startGame
      const getGameSpy = jest.spyOn(gameManager, 'getGame').mockReturnValue(mockGame as any);

      const result = await gameManager.startGame(gameID);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Game type does not support starting');
      }

      getGameSpy.mockRestore();
    });
  });

  describe('leaveGame', () => {
    let gameManager: GameManager;

    beforeEach(() => {
      gameManager = GameManager.getInstance();
      jest.clearAllMocks();
    });

    it('should remove game from memory when status is OVER', async () => {
      jest
        .spyOn(GameModel, 'create')
        .mockResolvedValue(
          new TriviaGame('creator').toModel() as unknown as ReturnType<typeof GameModel.create>,
        );
      jest.spyOn(TriviaGame.prototype, 'saveGameState').mockResolvedValue(undefined);
      jest.spyOn(TriviaQuestionModel, 'aggregate').mockResolvedValue([]);

      const gameID = await gameManager.addGame('Trivia', 'creator');
      if (typeof gameID === 'string') {
        await gameManager.joinGame(gameID, 'player1');
        await gameManager.joinGame(gameID, 'player2');
        await gameManager.startGame(gameID);

        const result = await gameManager.leaveGame(gameID, 'player1');

        expect('error' in result).toBe(false);
        expect(gameManager.getGame(gameID)).toBeUndefined();
      }
    });

    it('should not remove game from memory when status is not OVER', async () => {
      jest
        .spyOn(GameModel, 'create')
        .mockResolvedValue(
          new TriviaGame('creator').toModel() as unknown as ReturnType<typeof GameModel.create>,
        );
      jest.spyOn(TriviaGame.prototype, 'saveGameState').mockResolvedValue(undefined);

      const gameID = await gameManager.addGame('Trivia', 'creator');
      if (typeof gameID === 'string') {
        await gameManager.joinGame(gameID, 'player1');

        const result = await gameManager.leaveGame(gameID, 'player1');

        expect('error' in result).toBe(false);
        expect(gameManager.getGame(gameID)).toBeDefined();
      }
    });

    it('should load game from database if not in memory', async () => {
      const gameID = 'testGameID';
      const mockGameData = {
        gameID,
        gameType: 'Trivia' as const,
        createdBy: 'creator',
        state: {
          status: 'WAITING_TO_START' as const,
          currentQuestionIndex: 0,
          questions: [],
          player1Answers: [],
          player2Answers: [],
          player1Score: 0,
          player2Score: 0,
          player1: 'player1',
        },
        players: ['player1'],
      };

      // Mock findOne to return a Query object with lean() method
      jest.spyOn(GameModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValueOnce(mockGameData),
      } as any);
      jest.spyOn(TriviaGame.prototype, 'saveGameState').mockResolvedValue(undefined);

      const result = await gameManager.leaveGame(gameID, 'player1');

      expect('error' in result).toBe(false);
    });

    it('should return error if game does not exist', async () => {
      jest.spyOn(GameModel, 'findOne').mockResolvedValue(null);

      const result = await gameManager.leaveGame('nonexistent', 'player1');

      expect('error' in result).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      // Mock findOne to return a Query that rejects when lean() is called
      jest.spyOn(GameModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockRejectedValueOnce(new Error('Database error')),
      } as any);

      const result = await gameManager.leaveGame('testID', 'player1');

      expect('error' in result).toBe(true);
    });
  });

  describe('getGamesByPlayer', () => {
    let gameManager: GameManager;

    beforeEach(() => {
      gameManager = GameManager.getInstance();
      jest.clearAllMocks();
    });

    it('should return games from memory', async () => {
      jest
        .spyOn(GameModel, 'create')
        .mockResolvedValue(
          new TriviaGame('creator').toModel() as unknown as ReturnType<typeof GameModel.create>,
        );
      jest.spyOn(TriviaGame.prototype, 'saveGameState').mockResolvedValue(undefined);
      // Mock find for database query in getGamesByPlayer
      jest.spyOn(GameModel, 'find').mockReturnValue({
        lean: jest.fn().mockResolvedValueOnce([]),
      } as any);

      const gameID = await gameManager.addGame('Trivia', 'creator');
      if (typeof gameID === 'string') {
        await gameManager.joinGame(gameID, 'player1');

        const games = await gameManager.getGamesByPlayer('player1');

        expect(games.length).toBe(1);
        expect(games[0].gameID).toBe(gameID);
      }
    });

    it('should return games from database', async () => {
      const mockGameData = {
        gameID: 'dbGameID',
        gameType: 'Trivia' as const,
        createdBy: 'creator',
        state: {
          status: 'WAITING_TO_START' as const,
          currentQuestionIndex: 0,
          questions: [],
          player1Answers: [],
          player2Answers: [],
          player1Score: 0,
          player2Score: 0,
          player1: 'player1',
        },
        players: ['player1'],
      };

      // Mock find to return a Query object with lean() method
      jest.spyOn(GameModel, 'find').mockReturnValue({
        lean: jest.fn().mockResolvedValueOnce([mockGameData]),
      } as any);

      const games = await gameManager.getGamesByPlayer('player1');

      expect(games.length).toBe(1);
      expect(games[0].gameID).toBe('dbGameID');
    });

    it('should not duplicate games already in memory', async () => {
      jest
        .spyOn(GameModel, 'create')
        .mockResolvedValue(
          new TriviaGame('creator').toModel() as unknown as ReturnType<typeof GameModel.create>,
        );

      const gameID = await gameManager.addGame('Trivia', 'creator');
      if (typeof gameID === 'string') {
        await gameManager.joinGame(gameID, 'player1');

        const mockGameData = {
          gameID,
          gameType: 'Trivia' as const,
          createdBy: 'creator',
          state: {
            status: 'WAITING_TO_START' as const,
            currentQuestionIndex: 0,
            questions: [],
            player1Answers: [],
            player2Answers: [],
            player1Score: 0,
            player2Score: 0,
            player1: 'player1',
          },
          players: ['player1'],
        };

        // Mock find to return a Query object with lean() method
        jest.spyOn(GameModel, 'find').mockReturnValue({
          lean: jest.fn().mockResolvedValueOnce([mockGameData]),
        } as any);

        const games = await gameManager.getGamesByPlayer('player1');

        expect(games.length).toBe(1);
      }
    }, 10000);

    it('should handle database errors gracefully', async () => {
      // Mock find to return a Query that rejects when lean() is called
      jest.spyOn(GameModel, 'find').mockReturnValue({
        lean: jest.fn().mockRejectedValueOnce(new Error('Database error')),
      } as any);

      const games = await gameManager.getGamesByPlayer('player1');

      expect(games).toEqual([]);
    });
  });

  describe('endGameByDisconnect', () => {
    let gameManager: GameManager;

    beforeEach(() => {
      gameManager = GameManager.getInstance();
      jest.clearAllMocks();
      jest.restoreAllMocks();
    });

    it('should end game when game exists in memory', async () => {
      jest
        .spyOn(GameModel, 'create')
        .mockResolvedValue(
          new TriviaGame('creator').toModel() as unknown as ReturnType<typeof GameModel.create>,
        );
      // Mock saveGameState
      jest.spyOn(TriviaGame.prototype, 'saveGameState').mockResolvedValue(undefined);

      const gameID = await gameManager.addGame('Trivia', 'creator');
      if (typeof gameID === 'string') {
        await gameManager.joinGame(gameID, 'player1');
        await gameManager.joinGame(gameID, 'player2');

        await gameManager.endGameByDisconnect(gameID, 'player1', 'player2');

        const game = gameManager.getGame(gameID);
        expect(game).toBeUndefined();
      }
    }, 10000);

    it('should load game from database if not in memory', async () => {
      const gameID = 'testGameID';
      const mockGameData = {
        gameID,
        gameType: 'Trivia' as const,
        createdBy: 'creator',
        state: {
          status: 'IN_PROGRESS' as const,
          currentQuestionIndex: 0,
          questions: [],
          player1Answers: [],
          player2Answers: [],
          player1Score: 0,
          player2Score: 0,
          player1: 'player1',
          player2: 'player2',
        },
        players: ['player1', 'player2'],
      };

      jest.spyOn(GameModel, 'findOne').mockResolvedValue(mockGameData as any);

      await gameManager.endGameByDisconnect(gameID, 'player1', 'player2');

      expect(GameModel.findOne).toHaveBeenCalledWith({ gameID });
    });

    it('should handle game not found gracefully', async () => {
      jest.spyOn(GameModel, 'findOne').mockResolvedValue(null);

      await expect(
        gameManager.endGameByDisconnect('nonexistent', 'player1', 'player2'),
      ).resolves.not.toThrow();
    });

    it('should handle errors gracefully', async () => {
      // Mock findOne to reject - endGameByDisconnect catches errors silently
      // _loadGameFromDatabase calls findOne().lean(), so we need to mock the chain
      const findOneMock = jest.spyOn(GameModel, 'findOne');
      findOneMock.mockReturnValueOnce({
        lean: jest.fn().mockRejectedValueOnce(new Error('Database error')),
      } as any);

      // endGameByDisconnect has try-catch that silently handles errors, so it should not throw
      await gameManager.endGameByDisconnect('testID', 'player1', 'player2');

      // If we get here without throwing, the error was handled silently
      expect(true).toBe(true);
    });
  });

  describe('_loadGameFromDatabase error handling', () => {
    it('should return undefined for unsupported game type', async () => {
      const gameID = 'testGameID';
      const mockGameData = {
        gameID,
        gameType: 'InvalidType' as any,
        createdBy: 'creator',
        state: {
          status: 'WAITING_TO_START' as const,
        },
        players: [],
      };

      jest.spyOn(GameModel, 'findOne').mockResolvedValue(mockGameData as any);

      const gameManager = GameManager.getInstance();
      const result = await gameManager.joinGame(gameID, 'player1');

      expect('error' in result).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      // Mock findOne to return a Query that rejects when lean() is called
      jest.spyOn(GameModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockRejectedValueOnce(new Error('Database error')),
      } as any);

      const gameManager = GameManager.getInstance();
      const result = await gameManager.joinGame('testID', 'player1');

      expect('error' in result).toBe(true);
    });

    it('should handle exceptions in _loadGameFromDatabase catch block', async () => {
      // Mock findOne to throw an error directly (not through lean())
      jest.spyOn(GameModel, 'findOne').mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const gameManager = GameManager.getInstance();
      const result = await gameManager.joinGame('testID', 'player1');

      // _loadGameFromDatabase catch block returns undefined silently
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Game requested does not exist.');
      }
    });

    it('should handle old games without createdBy', async () => {
      const gameID = 'testGameID';
      const mockGameData = {
        gameID,
        gameType: 'Trivia' as const,
        state: {
          status: 'WAITING_TO_START' as const,
          currentQuestionIndex: 0,
          questions: [],
          player1Answers: [],
          player2Answers: [],
          player1Score: 0,
          player2Score: 0,
        },
        players: [],
      };

      // Mock findOne to return a Query object with lean() method
      jest.spyOn(GameModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValueOnce(mockGameData),
      } as any);
      // Mock saveGameState
      jest.spyOn(TriviaGame.prototype, 'saveGameState').mockResolvedValue(undefined);

      const gameManager = GameManager.getInstance();
      const result = await gameManager.joinGame(gameID, 'player1');

      expect('error' in result).toBe(false);
    });
  });
});
