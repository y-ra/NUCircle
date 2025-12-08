import GameModel from '../../models/games.model';
import {
  BaseMove,
  GameInstance,
  GameInstanceID,
  GameMove,
  GameState,
  GameType,
  TriviaGameState,
} from '../../types/types';
import Game from './game';
import TriviaGame from './trivia';

interface GameWithStartMethod {
  startGame(): void | Promise<void>;
}

interface GameWithPlayerState extends GameState {
  player1?: string;
  player2?: string;
}

/**
 * Manages the lifecycle of games, including creation, joining, and leaving games.
 *
 * This class is responsible for handling game instances and ensuring that the right game logic is
 * applied based on the game type. It provides methods for adding, removing, joining, and leaving
 * games, and it maintains a map of active game instances.
 */
class GameManager {
  private static _instance: GameManager | undefined;
  private _games: Map<string, Game<GameState, GameMove<unknown>>>;

  /**
   * Private constructor to initialize the games map.
   */
  private constructor() {
    this._games = new Map();
  }

  /**
   * Factory method to create a new game based on the provided game type.
   * @param gameType The type of the game to create.
   * @param createdBy The username of the user creating the game.
   * @returns A promise resolving to the created game instance.
   * @throws an error for an unsupported game type
   */
  private async _gameFactory(
    gameType: GameType,
    createdBy: string,
  ): Promise<Game<GameState, BaseMove>> {
    switch (gameType) {
      case 'Trivia': {
        const newGame = new TriviaGame(createdBy);

        await GameModel.create(newGame.toModel());
        return newGame;
      }
      default: {
        throw new Error('Invalid game type');
      }
    }
  }

  /**
   * Singleton pattern to get the unique instance of the GameManager.
   * @returns The instance of GameManager.
   */
  public static getInstance(): GameManager {
    if (!GameManager._instance) {
      GameManager._instance = new GameManager();
    }

    return GameManager._instance;
  }

  /**
   * TRIVIA FEATURE: GameManager - Game Creation
   * Central manager that creates game instances and stores them in memory.
   * Also saves to MongoDB database for persistence across server restarts.
   *
   * Creates and adds a new game to the manager games map.
   * @param gameType The type of the game to add.
   * @param createdBy The username of the user creating the game.
   * @returns The game ID or an error message.
   */
  public async addGame(
    gameType: GameType,
    createdBy: string,
  ): Promise<GameInstanceID | { error: string }> {
    try {
      const newGame = await this._gameFactory(gameType, createdBy);
      this._games.set(newGame.id, newGame);

      return newGame.id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { error: errorMessage };
    }
  }

  /**
   * Removes a game from the manager by its ID.
   * @param gameID The ID of the game to remove.
   * @returns Whether the game was successfully removed.
   */
  public removeGame(gameID: string): boolean {
    return this._games.delete(gameID);
  }

  /**
   * Loads a game from the database and restores it to a Game instance.
   * @param gameID The ID of the game to load.
   * @returns The restored game instance or undefined if not found.
   */
  private async _loadGameFromDatabase(
    gameID: GameInstanceID,
  ): Promise<Game<GameState, BaseMove> | undefined> {
    try {
      const gameData = await GameModel.findOne({ gameID }).lean();

      if (!gameData) {
        return undefined;
      }

      // Recreate the game instance based on game type
      let game: Game<GameState, BaseMove>;
      // just in case there are old games
      const createdBy = gameData.createdBy || 'unknown';
      const state = gameData.state as GameWithPlayerState;
      // Sync players array with actual player1/player2 state
      const activePlayers: string[] = [];
      if (state?.player1) activePlayers.push(state.player1);
      if (state?.player2) activePlayers.push(state.player2);

      if (gameData.gameType === 'Trivia') {
        const triviaGame = new TriviaGame(createdBy);
        // Override the ID and restore state
        Object.defineProperty(triviaGame, 'id', { value: gameID, writable: false });
        Object.defineProperty(triviaGame, '_state', {
          value: gameData.state as TriviaGameState,
          writable: true,
          configurable: true,
        });
        Object.defineProperty(triviaGame, '_players', {
          value: activePlayers,
          writable: true,
          configurable: true,
        });
        game = triviaGame;
      } else {
        return undefined;
      }

      // Add to in-memory map
      this._games.set(gameID, game);

      return game;
    } catch (error) {
      // silent error
      return undefined;
    }
  }

  /**
   * Joins an existing game.
   * @param gameID The ID of the game to join.
   * @param playerID The ID of the player joining the game.
   * @returns The game instance or an error message.
   */
  public async joinGame(
    gameID: GameInstanceID,
    playerID: string,
  ): Promise<GameInstance<GameState> | { error: string }> {
    try {
      let gameToJoin = this.getGame(gameID);

      // If game not in memory, try loading from database
      if (gameToJoin === undefined) {
        gameToJoin = await this._loadGameFromDatabase(gameID);
      }

      if (gameToJoin === undefined) {
        throw new Error('Game requested does not exist.');
      }

      // Check if player is already in the game - if so, just return current state
      const state = gameToJoin.state as GameWithPlayerState;
      if (state?.player1 === playerID || state?.player2 === playerID) {
        return gameToJoin.toModel();
      }

      await gameToJoin.join(playerID);
      await gameToJoin.saveGameState();

      return gameToJoin.toModel();
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  /**
   * TRIVIA FEATURE: GameManager - Starting Game
   * Calls the game-specific startGame() method which:
   * - For Trivia: fetches 10 random questions from the database
   * - Changes the status from WAITING_TO_START to IN_PROGRESS
   *
   * Starts a game.
   * @param gameID The ID of the game to start.
   * @returns The updated game instance or an error message.
   */
  public async startGame(
    gameID: GameInstanceID,
  ): Promise<GameInstance<GameState> | { error: string }> {
    try {
      let gameToStart = this.getGame(gameID);

      // If game not in memory, try loading from database
      if (gameToStart === undefined) {
        gameToStart = await this._loadGameFromDatabase(gameID);
      }

      if (gameToStart === undefined) {
        throw new Error('Game requested does not exist.');
      }

      // Type guard to check if the game has a startGame method
      if (
        'startGame' in gameToStart &&
        typeof (gameToStart as GameWithStartMethod).startGame === 'function'
      ) {
        const startResult = (gameToStart as GameWithStartMethod).startGame();
        // Handle both sync and async startGame methods
        if (startResult instanceof Promise) {
          await startResult;
        }
      } else {
        throw new Error('Game type does not support starting');
      }

      await gameToStart.saveGameState();

      return gameToStart.toModel();
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  /**
   * Allows a player to leave a game.
   * @param gameID The ID of the game to leave.
   * @param playerID The ID of the player leaving the game.
   * @returns The updated game state or an error message.
   */
  public async leaveGame(
    gameID: GameInstanceID,
    playerID: string,
  ): Promise<GameInstance<GameState> | { error: string }> {
    try {
      let gameToLeave = this.getGame(gameID);

      // If game not in memory, try loading from database
      if (gameToLeave === undefined) {
        gameToLeave = await this._loadGameFromDatabase(gameID);
      }

      if (gameToLeave === undefined) {
        throw new Error('Game requested does not exist.');
      }

      gameToLeave.leave(playerID);
      await gameToLeave.saveGameState();

      const leftGameState = gameToLeave.toModel();

      if (gameToLeave.state.status === 'OVER') {
        this.removeGame(gameID);
      }

      return leftGameState;
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  /**
   * Gets a game instance by its ID.
   * @param gameID The ID of the game.
   * @returns The game instance or undefined if not found.
   */
  public getGame(gameID: GameInstanceID): Game<GameState, BaseMove> | undefined {
    return this._games.get(gameID);
  }

  /**
   * Retrieves all active game instances.
   * @returns An array of all active game instances.
   */
  public getActiveGameInstances(): Game<GameState, BaseMove>[] {
    return Array.from(this._games.values());
  }

  /**
   * Resets the GameManager instance, clearing all active games.
   */
  public static resetInstance(): void {
    GameManager._instance = undefined;
  }

  /**
   * Gets all games a player is currently in.
   * @param playerID The username of the player.
   * @returns An array of game instances the player is in.
   */
  public async getGamesByPlayer(playerID: string): Promise<GameInstance<GameState>[]> {
    const activeGames = this.getActiveGameInstances();
    const playerGames: GameInstance<GameState>[] = [];

    for (const game of activeGames) {
      const state = game.state as GameWithPlayerState;
      if (state?.player1 === playerID || state?.player2 === playerID) {
        playerGames.push(game.toModel());
      }
    }

    // Also check database for games not in memory
    try {
      const dbGames = await GameModel.find({
        '$or': [{ 'state.player1': playerID }, { 'state.player2': playerID }],
        'state.status': { $in: ['WAITING_TO_START', 'IN_PROGRESS'] },
      }).lean();

      for (const dbGame of dbGames) {
        // Only add if not already in activeGames
        if (!playerGames.some(g => g.gameID === dbGame.gameID)) {
          playerGames.push(dbGame as GameInstance<GameState>);
        }
      }
    } catch (error) {
      // Silent error - return what we have from memory
    }

    return playerGames;
  }

  /**
   * Ends a game due to player disconnect, awarding win to remaining player.
   * @param gameID The ID of the game.
   * @param disconnectedPlayer The player who disconnected.
   * @param winnerPlayer The player who wins by default.
   */
  public async endGameByDisconnect(
    gameID: GameInstanceID,
    disconnectedPlayer: string,
    winnerPlayer: string,
  ): Promise<void> {
    try {
      let game = this.getGame(gameID);

      if (!game) {
        game = await this._loadGameFromDatabase(gameID);
      }

      if (!game) {
        return;
      }

      // Update game state to OVER with winner
      const state = game.state as GameWithPlayerState & { winner?: string };
      state.status = 'OVER';
      state.winner = winnerPlayer;

      await game.saveGameState();
      this.removeGame(gameID);
    } catch (error) {
      // Silent error
    }
  }
}

export default GameManager;
