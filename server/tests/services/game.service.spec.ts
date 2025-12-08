import GameModel from '../../models/games.model';
import findGames from '../../services/game.service';
import { FindGameQuery, GameInstance, TriviaGameState } from '../../types/types';

const gameState1: GameInstance<TriviaGameState> = {
  state: {
    status: 'WAITING_TO_START',
    currentQuestionIndex: 0,
    questions: [],
    player1Answers: [],
    player2Answers: [],
    player1Score: 0,
    player2Score: 0,
  },
  gameID: 'testGameID1',
  players: ['user1'],
  gameType: 'Trivia',
};

const gameState2: GameInstance<TriviaGameState> = {
  state: {
    status: 'IN_PROGRESS',
    currentQuestionIndex: 0,
    questions: [],
    player1Answers: [],
    player2Answers: [],
    player1Score: 0,
    player2Score: 0,
  },
  gameID: 'testGameID2',
  players: ['user1', 'user2'],
  gameType: 'Trivia',
};

const gameState3: GameInstance<TriviaGameState> = {
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
  gameID: 'testGameID3',
  players: ['user1', 'user2'],
  gameType: 'Trivia',
};

describe('findGames', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should return all games when provided undefined arguments', async () => {
    jest.spyOn(GameModel, 'find').mockImplementation(() => {
      const query: any = {};
      query.lean = jest.fn().mockReturnValue(Promise.resolve([gameState1, gameState2, gameState3]));
      return query;
    });

    const games = await findGames(undefined, undefined);

    expect(games).toEqual([gameState3, gameState2, gameState1]);
  });

  it('should return games with the matching gameType', async () => {
    jest.spyOn(GameModel, 'find').mockImplementation((filter?: FindGameQuery) => {
      expect(filter).toEqual({ 'gameType': 'Trivia', 'state.status': undefined });
      const query: any = {};
      query.lean = jest.fn().mockReturnValue(Promise.resolve([gameState1, gameState2, gameState3]));
      return query;
    });
    const games = await findGames('Trivia', undefined);

    expect(games).toEqual([gameState3, gameState2, gameState1]);
  });

  it('should return games with the matching status', async () => {
    jest.spyOn(GameModel, 'find').mockImplementation((filter?: FindGameQuery) => {
      expect(filter).toEqual({ 'gameType': undefined, 'state.status': 'IN_PROGRESS' });
      const query: any = {};
      query.lean = jest.fn().mockReturnValue(Promise.resolve([gameState2]));
      return query;
    });

    const games = await findGames(undefined, 'IN_PROGRESS');

    expect(games).toEqual([gameState2]);
  });

  it('should return games with the matching gameType and status', async () => {
    jest.spyOn(GameModel, 'find').mockImplementation((filter?: FindGameQuery) => {
      expect(filter).toEqual({ 'gameType': 'Trivia', 'state.status': 'OVER' });
      const query: any = {};
      query.lean = jest.fn().mockReturnValue(Promise.resolve([gameState3]));
      return query;
    });

    const games = await findGames('Trivia', 'OVER');

    expect(games).toEqual([gameState3]);
  });

  it('should return an empty list for database error', async () => {
    jest.spyOn(GameModel, 'find').mockImplementation(() => {
      const query: any = {};
      query.lean = jest.fn().mockRejectedValue(new Error('Database error'));
      return query;
    });

    const games = await findGames(undefined, undefined);

    expect(games).toEqual([]);
  });

  it('should return an empty list for no games found', async () => {
    jest.spyOn(GameModel, 'find').mockImplementation(() => {
      const query: any = {};
      query.lean = jest.fn().mockResolvedValue(null);
      return query;
    });

    const games = await findGames(undefined, undefined);

    expect(games).toEqual([]);
  });
});
