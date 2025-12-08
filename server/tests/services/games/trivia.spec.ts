import GameModel from '../../../models/games.model';
import TriviaQuestionModel from '../../../models/triviaQuestion.model';
import TriviaGame from '../../../services/games/trivia';

jest.mock('../../../services/point.service', () => ({
  awardPointsToUser: jest.fn().mockResolvedValue(100),
}));

describe('TriviaGame tests', () => {
  let triviaGame: TriviaGame;

  beforeEach(() => {
    triviaGame = new TriviaGame('testUser');
  });

  describe('constructor', () => {
    it('creates a blank game', () => {
      expect(triviaGame.id).toBeDefined();
      expect(triviaGame.id).toEqual(expect.any(String));
      expect(triviaGame.state.status).toBe('WAITING_TO_START');
      expect(triviaGame.state.player1).toBeUndefined();
      expect(triviaGame.state.player2).toBeUndefined();
      expect(triviaGame.state.winners).toBeUndefined();
      expect(triviaGame.gameType).toEqual('Trivia');
    });
  });

  describe('toModel', () => {
    it('should return a representation of the initial game state', () => {
      const ActualModel = triviaGame.toModel();
      expect(ActualModel.state.status).toEqual('WAITING_TO_START');
      expect(ActualModel.state.currentQuestionIndex).toEqual(0);
      expect(ActualModel.state.questions).toEqual([]);
      expect(ActualModel.state.player1Answers).toEqual([]);
      expect(ActualModel.state.player2Answers).toEqual([]);
      expect(ActualModel.state.player1Score).toEqual(0);
      expect(ActualModel.state.player2Score).toEqual(0);
      expect(ActualModel.gameID).toEqual(triviaGame.id);
      expect(ActualModel.players).toEqual([]);
      expect(ActualModel.gameType).toEqual('Trivia');
      expect(ActualModel.createdBy).toEqual('testUser');
    });

    it('should return a representation of the current game state', async () => {
      jest.spyOn(TriviaQuestionModel, 'aggregate').mockResolvedValue([]);

      await triviaGame.join('player1');

      const gameState1 = triviaGame.toModel();
      expect(gameState1.state.status).toEqual('WAITING_TO_START');
      expect(gameState1.state.player1).toEqual('player1');
      expect(gameState1.players).toEqual(['player1']);

      await triviaGame.join('player2');
      await triviaGame.startGame();

      const gameState2 = triviaGame.toModel();
      expect(gameState2.state.status).toEqual('IN_PROGRESS');
      expect(gameState2.state.player1).toEqual('player1');
      expect(gameState2.state.player2).toEqual('player2');
      expect(gameState2.players).toEqual(['player1', 'player2']);

      triviaGame.leave('player1');

      const gameState3 = triviaGame.toModel();
      expect(gameState3.state.status).toEqual('OVER');
      expect(gameState3.state.player1).toBeUndefined();
      expect(gameState3.state.player2).toEqual('player2');
      expect(gameState3.state.winners).toEqual(['player2']);
      expect(gameState3.players).toEqual(['player2']);
    });
  });

  describe('join', () => {
    it('adds player1 to the game', async () => {
      expect(triviaGame.state.player1).toBeUndefined();

      await triviaGame.join('player1');

      expect(triviaGame.state.player1).toEqual('player1');
      expect(triviaGame.state.status).toEqual('WAITING_TO_START');
    });

    it('adds player2 to the game and sets the game status to IN_PROGRESS', async () => {
      await triviaGame.join('player1');
      expect(triviaGame.state.player1).toEqual('player1');
      expect(triviaGame.state.status).toEqual('WAITING_TO_START');

      await triviaGame.join('player2');
      expect(triviaGame.state.player1).toEqual('player1');
      expect(triviaGame.state.player2).toEqual('player2');
      expect(triviaGame.state.status).toEqual('WAITING_TO_START');
    });

    it('throws an error if trying to join an in progress game', async () => {
      await triviaGame.join('player1');
      await triviaGame.join('player2');
      await triviaGame.startGame();

      expect(triviaGame.state.player1).toEqual('player1');
      expect(triviaGame.state.player2).toEqual('player2');
      expect(triviaGame.state.status).toEqual('IN_PROGRESS');

      await expect(triviaGame.join('player3')).rejects.toThrow('Cannot join game: already started');
    });

    it('throws an error if trying to join a completed game', async () => {
      jest.spyOn(TriviaQuestionModel, 'aggregate').mockResolvedValue([]);
      await triviaGame.join('player1');
      await triviaGame.join('player2');
      await triviaGame.startGame();
      triviaGame.leave('player2');

      expect(triviaGame.state.player1).toEqual('player1');
      expect(triviaGame.state.player2).toBeUndefined();
      expect(triviaGame.state.status).toEqual('OVER');

      await expect(triviaGame.join('player3')).rejects.toThrow('Cannot join game: already started');
    });

    it('throws an error if trying to join a game the player is already in', async () => {
      await triviaGame.join('player1');
      expect(triviaGame.state.player1).toEqual('player1');
      expect(triviaGame.state.status).toEqual('WAITING_TO_START');

      await expect(triviaGame.join('player1')).rejects.toThrow(
        'Cannot join game: player already in game',
      );
    });
  });

  describe('leave', () => {
    it('should remove player 1 from a game waiting to start', async () => {
      await triviaGame.join('player1');
      expect(triviaGame.state.player1).toEqual('player1');
      expect(triviaGame.state.status).toEqual('WAITING_TO_START');

      triviaGame.leave('player1');
      expect(triviaGame.state.player1).toBeUndefined();
      expect(triviaGame.state.status).toEqual('WAITING_TO_START');
    });

    it('should remove player 1 from a game in progress and set it to over', async () => {
      await triviaGame.join('player1');
      await triviaGame.join('player2');
      await triviaGame.startGame();
      expect(triviaGame.state.player1).toEqual('player1');
      expect(triviaGame.state.player2).toEqual('player2');
      expect(triviaGame.state.status).toEqual('IN_PROGRESS');

      triviaGame.leave('player1');
      expect(triviaGame.state.player1).toBeUndefined();
      expect(triviaGame.state.status).toEqual('OVER');
      expect(triviaGame.state.winners).toEqual(['player2']);
    });

    it('should remove player 2 from a game in progress and set it to over', async () => {
      await triviaGame.join('player1');
      await triviaGame.join('player2');
      await triviaGame.startGame();
      expect(triviaGame.state.player1).toEqual('player1');
      expect(triviaGame.state.player2).toEqual('player2');
      expect(triviaGame.state.status).toEqual('IN_PROGRESS');

      triviaGame.leave('player2');
      expect(triviaGame.state.player2).toBeUndefined();
      expect(triviaGame.state.status).toEqual('OVER');
      expect(triviaGame.state.winners).toEqual(['player1']);
    });

    it('throws an error if trying to join a game the player is not in', () => {
      expect(() => triviaGame.leave('player1')).toThrow(
        'Cannot leave game: player player1 is not in the game.',
      );
    });
  });

  describe('saveGameState', () => {
    const findOneAndUpdateSpy = jest.spyOn(GameModel, 'findOneAndUpdate');

    it('should call findOneAndUpdate with the correct model arguments', async () => {
      const expectedState = triviaGame.toModel();
      findOneAndUpdateSpy.mockResolvedValue(expectedState);

      await triviaGame.saveGameState();

      expect(findOneAndUpdateSpy).toHaveBeenLastCalledWith(
        { gameID: expect.any(String) },
        expectedState,
        { upsert: true },
      );
    });

    it('should throw a database error', () => {
      findOneAndUpdateSpy.mockRejectedValueOnce(new Error('database error'));

      expect(triviaGame.saveGameState()).rejects.toThrow('database error');
    });
  });

  describe('startGame', () => {
    it('should throw error if game is not waiting to start', async () => {
      await triviaGame.join('player1');
      await triviaGame.join('player2');
      await triviaGame.startGame();

      await expect(triviaGame.startGame()).rejects.toThrow('Game is not waiting to start');
    });

    it('should throw error if only one player', async () => {
      await triviaGame.join('player1');

      await expect(triviaGame.startGame()).rejects.toThrow('Cannot start game: requires 2 players');
    });

    it('should throw error if no players', async () => {
      await expect(triviaGame.startGame()).rejects.toThrow('Cannot start game: requires 2 players');
    });

    it('should handle database error when fetching questions', async () => {
      await triviaGame.join('player1');
      await triviaGame.join('player2');
      jest.spyOn(TriviaQuestionModel, 'aggregate').mockRejectedValueOnce(new Error('DB error'));

      await expect(triviaGame.startGame()).rejects.toThrow('Failed to fetch trivia questions');
    });
  });

  describe('applyMove', () => {
    beforeEach(async () => {
      jest.spyOn(TriviaQuestionModel, 'aggregate').mockResolvedValue([
        {
          _id: { toString: () => 'q1' },
          question: 'Test Question',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 0,
        },
      ]);
      await triviaGame.join('player1');
      await triviaGame.join('player2');
      await triviaGame.startGame();
    });

    it('should throw error if game is not in progress', async () => {
      const newGame = new TriviaGame('creator');
      await expect(
        newGame.applyMove({
          playerID: 'player1',
          gameID: newGame.id,
          move: { questionId: 'q1', answerIndex: 0 },
        }),
      ).rejects.toThrow('Invalid move: game is not in progress');
    });

    it('should throw error if player is not in game', async () => {
      await expect(
        triviaGame.applyMove({
          playerID: 'player3',
          gameID: triviaGame.id,
          move: { questionId: triviaGame.state.questions[0].questionId, answerIndex: 0 },
        }),
      ).rejects.toThrow('Invalid move: player not in game');
    });

    it('should throw error if answer index is invalid (negative)', async () => {
      await expect(
        triviaGame.applyMove({
          playerID: 'player1',
          gameID: triviaGame.id,
          move: { questionId: triviaGame.state.questions[0].questionId, answerIndex: -1 },
        }),
      ).rejects.toThrow('Invalid move: answer index must be between 0 and 3');
    });

    it('should throw error if answer index is invalid (too high)', async () => {
      await expect(
        triviaGame.applyMove({
          playerID: 'player1',
          gameID: triviaGame.id,
          move: { questionId: triviaGame.state.questions[0].questionId, answerIndex: 4 },
        }),
      ).rejects.toThrow('Invalid move: answer index must be between 0 and 3');
    });

    it('should throw error if question ID does not match', async () => {
      await expect(
        triviaGame.applyMove({
          playerID: 'player1',
          gameID: triviaGame.id,
          move: { questionId: 'wrongId', answerIndex: 0 },
        }),
      ).rejects.toThrow('Invalid move: question ID does not match current question');
    });

    it('should throw error if player already answered', async () => {
      await triviaGame.applyMove({
        playerID: 'player1',
        gameID: triviaGame.id,
        move: { questionId: triviaGame.state.questions[0].questionId, answerIndex: 0 },
      });

      await expect(
        triviaGame.applyMove({
          playerID: 'player1',
          gameID: triviaGame.id,
          move: { questionId: triviaGame.state.questions[0].questionId, answerIndex: 1 },
        }),
      ).rejects.toThrow('Invalid move: player has already answered this question');
    });

    it('should record correct answer and update score', async () => {
      const correctAnswer = 0;
      await triviaGame.applyMove({
        playerID: 'player1',
        gameID: triviaGame.id,
        move: { questionId: triviaGame.state.questions[0].questionId, answerIndex: correctAnswer },
      });

      expect(triviaGame.state.player1Score).toBe(1);
      expect(triviaGame.state.player1Answers[0]).toBe(correctAnswer);
    });

    it('should record incorrect answer and not update score', async () => {
      await triviaGame.applyMove({
        playerID: 'player1',
        gameID: triviaGame.id,
        move: { questionId: triviaGame.state.questions[0].questionId, answerIndex: 1 },
      });

      expect(triviaGame.state.player1Score).toBe(0);
      expect(triviaGame.state.player1Answers[0]).toBe(1);
    });

    it('should advance to next question when both players answer', async () => {
      await triviaGame.applyMove({
        playerID: 'player1',
        gameID: triviaGame.id,
        move: { questionId: triviaGame.state.questions[0].questionId, answerIndex: 0 },
      });

      expect(triviaGame.state.currentQuestionIndex).toBe(0);

      await triviaGame.applyMove({
        playerID: 'player2',
        gameID: triviaGame.id,
        move: { questionId: triviaGame.state.questions[0].questionId, answerIndex: 0 },
      });

      expect(triviaGame.state.currentQuestionIndex).toBe(1);
    });

    it('should not advance if only one player answered', async () => {
      await triviaGame.applyMove({
        playerID: 'player1',
        gameID: triviaGame.id,
        move: { questionId: triviaGame.state.questions[0].questionId, answerIndex: 0 },
      });

      expect(triviaGame.state.currentQuestionIndex).toBe(0);
    });
  });

  describe('tiebreaker logic', () => {
    let tiebreakerGame: TriviaGame;

    beforeEach(async () => {
      tiebreakerGame = new TriviaGame('testUser');
      // Set up a game with 10 questions answered and tied scores
      // Mock aggregate to return 10 questions for startGame, then 1 question for tiebreaker
      const mockQuestions = Array.from({ length: 10 }, (_, i) => ({
        _id: { toString: () => `q${i}` },
        question: `Question ${i}`,
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 0,
      }));

      const mockTiebreakerQuestion = {
        _id: { toString: () => 'tiebreaker' },
        question: 'Tiebreaker Question',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 0,
      };

      // Mock aggregate: first call returns 10 questions, second call returns tiebreaker
      jest
        .spyOn(TriviaQuestionModel, 'aggregate')
        .mockResolvedValueOnce(mockQuestions)
        .mockResolvedValueOnce([mockTiebreakerQuestion]);

      await tiebreakerGame.join('player1');
      await tiebreakerGame.join('player2');
      await tiebreakerGame.startGame();

      // Verify questions were loaded
      expect(tiebreakerGame.state.questions.length).toBe(10);

      // Answer all 10 questions with tied scores
      for (let i = 0; i < 10; i = i + 1) {
        const currentQuestionIndex = tiebreakerGame.state.currentQuestionIndex;
        expect(currentQuestionIndex).toBeLessThan(tiebreakerGame.state.questions.length);
        const currentQuestion = tiebreakerGame.state.questions[currentQuestionIndex];
        expect(currentQuestion).toBeDefined();
        await tiebreakerGame.applyMove({
          playerID: 'player1',
          gameID: tiebreakerGame.id,
          move: { questionId: currentQuestion.questionId, answerIndex: 0 },
        });
        await tiebreakerGame.applyMove({
          playerID: 'player2',
          gameID: tiebreakerGame.id,
          move: { questionId: currentQuestion.questionId, answerIndex: 0 },
        });
      }
    });

    it('should start tiebreaker when scores are tied after 10 questions', async () => {
      expect(tiebreakerGame.state.isTiebreaker).toBe(true);
      expect(tiebreakerGame.state.questions.length).toBe(11);
      expect(tiebreakerGame.state.tiebreakerStartTime).toBeDefined();
    });

    it('should validate tiebreaker answer correctly', async () => {
      await expect(
        tiebreakerGame.applyMove({
          playerID: 'player1',
          gameID: tiebreakerGame.id,
          move: { questionId: 'wrongId', answerIndex: 0 },
        }),
      ).rejects.toThrow('Invalid move: question ID does not match tiebreaker question');
    });

    it('should throw error if player already answered tiebreaker', async () => {
      const tiebreakerQuestion = tiebreakerGame.state.questions[10];
      await tiebreakerGame.applyMove({
        playerID: 'player1',
        gameID: tiebreakerGame.id,
        move: { questionId: tiebreakerQuestion.questionId, answerIndex: 0 },
      });

      await expect(
        tiebreakerGame.applyMove({
          playerID: 'player1',
          gameID: tiebreakerGame.id,
          move: { questionId: tiebreakerQuestion.questionId, answerIndex: 1 },
        }),
      ).rejects.toThrow('Invalid move: player has already answered tiebreaker');
    });

    it('should award win to player1 if only player1 answers correctly', async () => {
      const tiebreakerQuestion = tiebreakerGame.state.questions[10];
      await tiebreakerGame.applyMove({
        playerID: 'player1',
        gameID: tiebreakerGame.id,
        move: { questionId: tiebreakerQuestion.questionId, answerIndex: 0 },
      });
      await tiebreakerGame.applyMove({
        playerID: 'player2',
        gameID: tiebreakerGame.id,
        move: { questionId: tiebreakerQuestion.questionId, answerIndex: 1 },
      });

      expect(tiebreakerGame.state.status).toBe('OVER');
      expect(tiebreakerGame.state.winners).toEqual(['player1']);
    });

    it('should award win to player2 if only player2 answers correctly', async () => {
      const tiebreakerQuestion = tiebreakerGame.state.questions[10];
      await tiebreakerGame.applyMove({
        playerID: 'player1',
        gameID: tiebreakerGame.id,
        move: { questionId: tiebreakerQuestion.questionId, answerIndex: 1 },
      });
      await tiebreakerGame.applyMove({
        playerID: 'player2',
        gameID: tiebreakerGame.id,
        move: { questionId: tiebreakerQuestion.questionId, answerIndex: 0 },
      });

      expect(tiebreakerGame.state.status).toBe('OVER');
      expect(tiebreakerGame.state.winners).toEqual(['player2']);
    });

    it('should end in tie if both players answer correctly', async () => {
      const tiebreakerQuestion = tiebreakerGame.state.questions[10];
      await tiebreakerGame.applyMove({
        playerID: 'player1',
        gameID: tiebreakerGame.id,
        move: { questionId: tiebreakerQuestion.questionId, answerIndex: 0 },
      });
      await tiebreakerGame.applyMove({
        playerID: 'player2',
        gameID: tiebreakerGame.id,
        move: { questionId: tiebreakerQuestion.questionId, answerIndex: 0 },
      });

      expect(tiebreakerGame.state.status).toBe('OVER');
      expect(tiebreakerGame.state.winners).toEqual(['player1', 'player2']);
    });

    it('should end in tie if both players answer incorrectly', async () => {
      const tiebreakerQuestion = tiebreakerGame.state.questions[10];
      await tiebreakerGame.applyMove({
        playerID: 'player1',
        gameID: tiebreakerGame.id,
        move: { questionId: tiebreakerQuestion.questionId, answerIndex: 1 },
      });
      await tiebreakerGame.applyMove({
        playerID: 'player2',
        gameID: tiebreakerGame.id,
        move: { questionId: tiebreakerQuestion.questionId, answerIndex: 2 },
      });

      expect(tiebreakerGame.state.status).toBe('OVER');
      expect(tiebreakerGame.state.winners).toEqual(['player1', 'player2']);
    });

    it('should check tiebreaker timer correctly', () => {
      expect(tiebreakerGame.shouldSetTiebreakerTimer()).toBe(true);
      tiebreakerGame.markTiebreakerTimerSet();
      expect(tiebreakerGame.shouldSetTiebreakerTimer()).toBe(false);
    });

    it('should return false for checkTiebreakerTimer if not tiebreaker', () => {
      const newGame = new TriviaGame('creator');
      expect(newGame.checkTiebreakerTimer()).toBe(false);
    });

    it('should return false for checkTiebreakerTimer if timer not expired', () => {
      expect(tiebreakerGame.checkTiebreakerTimer()).toBe(false);
    });

    it('should end game as tie if timer expires with no answers', async () => {
      // Manually set tiebreaker start time to past
      const state = tiebreakerGame.state as any;
      state.tiebreakerStartTime = Date.now() - 11000;

      const result = tiebreakerGame.checkTiebreakerTimer();
      expect(result).toBe(true);
      expect(tiebreakerGame.state.status).toBe('OVER');
      expect(tiebreakerGame.state.winners).toEqual(['player1', 'player2']);
    });
  });

  describe('game end scenarios', () => {
    let testGame: TriviaGame;

    beforeEach(async () => {
      testGame = new TriviaGame('testUser');
      jest.spyOn(TriviaQuestionModel, 'aggregate').mockResolvedValue(
        Array.from({ length: 10 }, (_, i) => ({
          _id: { toString: () => `q${i}` },
          question: `Question ${i}`,
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 0,
        })),
      );
      await testGame.join('player1');
      await testGame.join('player2');
      await testGame.startGame();
    });

    it('should end game with player1 as winner', async () => {
      // Player1 gets all correct, player2 gets none
      for (let i = 0; i < 10; i = i + 1) {
        const currentQuestionIndex = testGame.state.currentQuestionIndex;
        const currentQuestion = testGame.state.questions[currentQuestionIndex];
        await testGame.applyMove({
          playerID: 'player1',
          gameID: testGame.id,
          move: { questionId: currentQuestion.questionId, answerIndex: 0 },
        });
        await testGame.applyMove({
          playerID: 'player2',
          gameID: testGame.id,
          move: { questionId: currentQuestion.questionId, answerIndex: 1 },
        });
      }

      expect(testGame.state.status).toBe('OVER');
      expect(testGame.state.winners).toEqual(['player1']);
    });

    it('should end game with player2 as winner', async () => {
      // Player2 gets all correct, player1 gets none
      for (let i = 0; i < 10; i = i + 1) {
        const currentQuestionIndex = testGame.state.currentQuestionIndex;
        const currentQuestion = testGame.state.questions[currentQuestionIndex];
        await testGame.applyMove({
          playerID: 'player1',
          gameID: testGame.id,
          move: { questionId: currentQuestion.questionId, answerIndex: 1 },
        });
        await testGame.applyMove({
          playerID: 'player2',
          gameID: testGame.id,
          move: { questionId: currentQuestion.questionId, answerIndex: 0 },
        });
      }

      expect(testGame.state.status).toBe('OVER');
      expect(testGame.state.winners).toEqual(['player2']);
    });

    it('should end game in tie if scores equal after 10 questions', async () => {
      // Both get same score
      for (let i = 0; i < 10; i = i + 1) {
        const currentQuestionIndex = testGame.state.currentQuestionIndex;
        const currentQuestion = testGame.state.questions[currentQuestionIndex];
        await testGame.applyMove({
          playerID: 'player1',
          gameID: testGame.id,
          move: { questionId: currentQuestion.questionId, answerIndex: 0 },
        });
        await testGame.applyMove({
          playerID: 'player2',
          gameID: testGame.id,
          move: { questionId: currentQuestion.questionId, answerIndex: 0 },
        });
      }

      // Should trigger tiebreaker, not end game yet
      expect(testGame.state.isTiebreaker).toBe(true);
    });
  });

  describe('_leave edge cases', () => {
    it('should handle leaving when player2 is undefined', async () => {
      await triviaGame.join('player1');
      await triviaGame.join('player2');
      await triviaGame.startGame();

      triviaGame.leave('player2');

      expect(triviaGame.state.player2).toBeUndefined();
      expect(triviaGame.state.status).toBe('OVER');
      expect(triviaGame.state.winners).toEqual(['player1']);
    });

    it('should handle leaving when player1 is undefined', async () => {
      await triviaGame.join('player1');
      await triviaGame.join('player2');
      await triviaGame.startGame();

      triviaGame.leave('player1');

      expect(triviaGame.state.player1).toBeUndefined();
      expect(triviaGame.state.status).toBe('OVER');
      expect(triviaGame.state.winners).toEqual(['player2']);
    });
  });
});
