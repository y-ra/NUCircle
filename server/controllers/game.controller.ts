import express, { Response } from 'express';
import {
  FakeSOSocket,
  CreateGameRequest,
  GameMovePayload,
  GameRequest,
  GetGamesRequest,
  GameState,
  TriviaGameState,
} from '../types/types';
import findGames from '../services/game.service';
import GameManager from '../services/games/gameManager';
import GameModel from '../models/games.model';
import TriviaGame from '../services/games/trivia';
import Game from '../services/games/game';

interface GameWithPlayerState extends GameState {
  player1?: string;
  player2?: string;
}

// Type guard to check if a game is a TriviaGame instance
function isTriviaGame(game: Game<GameState, unknown>): game is TriviaGame {
  return game.gameType === 'Trivia';
}

/**
 * Express controller for handling game-related requests, including creating, joining, leaving games, and fetching games.
 * @param socket The socket instance used for emitting game updates and errors.
 * @returns An Express router with endpoints for game actions.
 */
const gameController = (socket: FakeSOSocket) => {
  const router = express.Router();

  /**
   * TRIVIA FEATURE: Part 1 - Game Creation
   * When a user clicks "Create Trivia Quiz", this endpoint creates a new game instance.
   * The game starts in the WAITING_TO_START status with no players or questions yet.
   *
   * Creates a new game based on the provided game type and responds with the created game or an error message.
   * @param req The request object containing the game type and creator username.
   * @param res The response object to send the result.
   */
  const createGame = async (req: CreateGameRequest, res: Response) => {
    try {
      const { gameType, createdBy } = req.body;
      if (createdBy !== req.user!.username) {
        res.status(401).send('Invalid createdBy parameter');
        return;
      }

      const newGame = await GameManager.getInstance().addGame(gameType, createdBy);

      if (typeof newGame !== 'string') {
        throw new Error(newGame.error);
      }

      res.status(200).json(newGame);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).send(`Error when creating game: ${errorMessage}`);
    }
  };

  /**
   * TRIVIA FEATURE: Part 2 - Player Joining
   * When a user clicks "Join Game", this endpoint adds them to the game.
   * Updates the game state with player1 or player2 & adds them to the players array.
   * Emits a socket event to notify all players in the game room of the update.
   *
   * Joins a game with the specified game ID and player ID, and emits the updated game state.
   * @param req The request object containing the game ID and player ID.
   * @param res The response object to send the result.
   */
  const joinGame = async (req: GameRequest, res: Response) => {
    try {
      const { gameID, playerID } = req.body;
      if (playerID !== req.user!.username) {
        res.status(401).send('Invalid playerID parameter');
        return;
      }

      const game = await GameManager.getInstance().joinGame(gameID, playerID);

      if ('error' in game) {
        throw new Error(game.error);
      }

      socket.in(gameID).emit('gameUpdate', { gameInstance: game });
      res.status(200).json(game);
    } catch (error) {
      res.status(500).send(`Error when joining game: ${(error as Error).message}`);
    }
  };

  /**
   * Leaves the game with the specified game ID and player ID, and emits the updated game state.
   * @param req The request object containing the game ID and player ID.
   * @param res The response object to send the result.
   */
  const leaveGame = async (req: GameRequest, res: Response) => {
    try {
      const { gameID, playerID } = req.body;
      if (playerID !== req.user!.username) {
        res.status(401).send('Invalid playerID parameter');
        return;
      }

      const game = await GameManager.getInstance().leaveGame(gameID, playerID);

      if ('error' in game) {
        throw new Error(game.error);
      }

      socket.in(gameID).emit('gameUpdate', { gameInstance: game });
      res.status(200).json(game);
    } catch (error) {
      res.status(500).send(`Error when leaving game: ${(error as Error).message}`);
    }
  };

  /**
   * Fetches games based on optional game type and status query parameters, and responds with the list of games.
   * @param req The request object containing the query parameters for filtering games.
   * @param res The response object to send the result.
   */
  const getGames = async (req: GetGamesRequest, res: Response) => {
    try {
      const { gameType, status } = req.query;

      const games = await findGames(gameType, status);

      res.status(200).json(games);
    } catch (error) {
      res.status(500).send(`Error when getting games: ${(error as Error).message}`);
    }
  };

  /**
   * TRIVIA FEATURE: Part 3 - Starting the Game
   * When a user clicks "Start Game", this endpoint:
   * 1. Calls GameManager.startGame() which calls TriviaGame.startGame()
   * 2. Has TriviaGame fetch 10 random questions from the database
   * 3. Changes the game status from WAITING_TO_START to IN_PROGRESS
   * 4. Emits a socket event to notify all players that the game has begun
   *
   * Starts a game with the specified game ID.
   * @param req The request object containing the game ID.
   * @param res The response object to send the result.
   */
  const startGame = async (req: GameRequest, res: Response) => {
    try {
      const { gameID } = req.body;

      const game = await GameManager.getInstance().startGame(gameID);

      if ('error' in game) {
        throw new Error(game.error);
      }

      socket.in(gameID).emit('gameUpdate', { gameInstance: game });
      res.status(200).json(game);
    } catch (error) {
      res.status(500).send(`Error when starting game: ${(error as Error).message}`);
    }
  };

  /**
   * Deletes a game with the specified game ID; only the original creator can delete the game, except for stale games (IN_PROGRESS with no active players) which any user can delete.
   * @param req The request object containing the game ID and username.
   * @param res The response object to send the result.
   */
  const deleteGame = async (req: GameRequest, res: Response) => {
    try {
      const { gameID, username } = req.body;
      if (username !== req.user!.username) {
        res.status(401).send('Invalid username parameter');
        return;
      }

      // Check if game exists
      const gameData = await GameModel.findOne({ gameID });
      if (!gameData) {
        res.status(404).send('Game not found');
        return;
      }

      // Check if game is stale (IN_PROGRESS but no active players)
      const state = gameData.state as GameWithPlayerState;
      const isStale =
        gameData.state?.status === 'IN_PROGRESS' && !state?.player1 && !state?.player2;

      // Allow deletion if:
      // 1. Game is stale (anyone can delete)
      // 2. User is creator
      // 3. Old game without createdBy but user is a player
      const isPlayer = gameData.players && gameData.players.includes(username);
      const canDelete =
        isStale || gameData.createdBy === username || (!gameData.createdBy && isPlayer);

      if (!canDelete) {
        res.status(403).send('Only the game creator can delete this game');
        return;
      }

      // Remove from GameManager if it exists
      GameManager.getInstance().removeGame(gameID);

      // Also remove from database (this will work even if game wasn't in GameManager)
      await GameModel.findOneAndDelete({ gameID });

      res.status(200).json({ message: 'Game deleted successfully' });
    } catch (error) {
      res.status(500).send(`Error when deleting game: ${(error as Error).message}`);
    }
  };

  /**
   * TRIVIA FEATURE: Part 4 - Answering Questions
   * When a player submits an answer, this socket handler:
   * 1. Validates the answer (checks if the player in game, the question matches, & it's not already answered)
   * 2. Records the answer in the player1Answers or player2Answers array
   * 3. Checks if the answer is correct and updates their score
   * 4. If both players answered, moves to the next question
   * 5. If all 10 questions answered, ends the game and determines the winner
   * 6. Emits a gameUpdate event to all players in the game room
   *
   * Handles a game move by applying the move to the game state, emitting updates to all players, and saving the state.
   * @param gameMove The payload containing the game ID and move details.
   * @throws Error if applying the move or saving the game state fails.
   */
  const playMove = async (gameMove: GameMovePayload): Promise<void> => {
    const { gameID, move } = gameMove;

    try {
      const game = GameManager.getInstance().getGame(gameID);

      if (game === undefined) {
        throw new Error('Game requested does not exist');
      }

      // TIEBREAKER FEATURE: The applyMove method is now async to handle the tiebreaker question fetching
      await game.applyMove(move);
      socket.in(gameID).emit('gameUpdate', { gameInstance: game.toModel() });

      await game.saveGameState();

      // TIEBREAKER FEATURE: Sets up a 10-second timer for the tiebreaker if it just started
      if (isTriviaGame(game)) {
        if (game.shouldSetTiebreakerTimer()) {
          const triviaState = game.state as TriviaGameState;
          const startTime = triviaState.tiebreakerStartTime;
          if (startTime !== undefined) {
            const elapsed = Date.now() - startTime;
            const timeRemaining = Math.max(0, 10000 - elapsed);

            // Marks the timer as set to avoid multiple timers
            game.markTiebreakerTimerSet();

            // Sets the timer to check & emit update when it finishes
            setTimeout(async () => {
              const currentGame = GameManager.getInstance().getGame(gameID);
              if (currentGame && isTriviaGame(currentGame)) {
                if (currentGame.checkTiebreakerTimer()) {
                  await currentGame.saveGameState();
                  socket.in(gameID).emit('gameUpdate', { gameInstance: currentGame.toModel() });
                  if (currentGame.state.status === 'OVER') {
                    GameManager.getInstance().removeGame(gameID);
                  }
                }
              }
            }, timeRemaining);
          }
        }
      }

      if (game.state.status === 'OVER') {
        GameManager.getInstance().removeGame(gameID);
      }
    } catch (error) {
      socket.to(gameID).emit('gameError', {
        player: move.playerID,
        error: (error as Error).message,
      });
    }
  };

  socket.on('connection', conn => {
    conn.on('joinGame', (gameID: string) => {
      conn.join(gameID);
    });

    conn.on('leaveGame', (gameID: string) => {
      conn.leave(gameID);
    });

    conn.on('makeMove', playMove);
  });

  // Register routes
  router.post('/create', createGame);
  router.post('/join', joinGame);
  router.post('/start', startGame);
  router.post('/leave', leaveGame);
  router.post('/delete', deleteGame);
  router.get('/games', getGames);

  return router;
};

export default gameController;
