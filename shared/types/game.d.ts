import { Request } from 'express';

/**
 * Type representing the possible game types as a literal.
 * This is derived from the GAME_TYPES constant.
 */
export type GameType = 'Trivia';

/**
 * Type representing the unique identifier for a game instance.
 */
export type GameInstanceID = string;

/**
 * Type representing the possible statuses of a game.
 * IN_PROGRESS: The game is ongoing.
 * WAITING_TO_START: The game is waiting for players to join or ready up.
 * OVER: The game has finished.
 */
export type GameStatus = 'IN_PROGRESS' | 'WAITING_TO_START' | 'OVER';

/**
 * Interface representing the state of a game, which includes:
 * status: The current status of the game.
 */
export interface GameState {
  status: GameStatus;
  tiebreakerStartTime?: number;
}

/**
 * Interface representing a game instance, which contains:
 * state: The current state of the game, defined by GameState.
 * gameID: The unique identifier for the game instance.
 * players: An array of player IDs participating in the game.
 * gameType: The type of game (e.g., 'Trivia').
 * createdBy: The username of the user who created the game.
 */
export interface GameInstance<T extends GameState> {
  state: T;
  gameID: GameInstanceID;
  players: string[];
  gameType: GameType;
  createdBy?: string;
}

/**
 * Interface extending GameState to represent a game state that has winners.
 * winners: An optional array of player IDs who have won the game.
 */
export interface WinnableGameState extends GameState {
  winners?: ReadonlyArray<string>;
}

/**
 * Interface representing a move in the game, which contains:
 * playerID: The ID of the player making the move.
 * gameID: The ID of the game where the move is being made.
 * move: The actual move made by the player, which can vary depending on the game type.
 */
export interface GameMove<MoveType> {
  playerID: string;
  gameID: GameInstanceID;
  move: MoveType;
}

/**
 * Base interface for moves. Other game-specific move types should extend this.
 */
export type BaseMove = object;

/**
 * Interface representing a trivia question in the game
 */
export interface TriviaQuestion {
  questionId: string;
  question: string;
  options: string[];
}

/**
 * Interface representing an answer to a trivia question
 */
export interface TriviaAnswer extends BaseMove {
  questionId: string;
  answerIndex: number;
}

/**
 * Interface representing the state of a Trivia game, which includes:
 * player1: The ID of the first player
 * player2: The ID of the second player
 * currentQuestionIndex: The current question being displayed
 * questions: The list of questions for this game session
 * player1Answers: Array of player 1's answer indices
 * player2Answers: Array of player 2's answer indices
 * player1Score: Player 1's current score
 * player2Score: Player 2's current score
 * isTiebreaker: Whether it's currently tiebreaker mode in the Trivia game
 * tiebreakerStartTime: The timestamp of when the tiebreaker question started
 * tiebreakerPlayer1Answer: Player 1's tiebreaker answer
 * tiebreakerPlayer2Answer: Player 2's tiebreaker answer
 */
export interface TriviaGameState extends WinnableGameState {
  player1?: string;
  player2?: string;
  currentQuestionIndex: number;
  questions: ReadonlyArray<TriviaQuestion>;
  player1Answers: ReadonlyArray<number>;
  player2Answers: ReadonlyArray<number>;
  player1Score: number;
  player2Score: number;
  isTiebreaker?: boolean;
  tiebreakerStartTime?: number;
  tiebreakerPlayer1Answer?: number;
  tiebreakerPlayer2Answer?: number;
}

/**
 * Interface extending the request body when creating a game, which contains:
 * gameType: The type of game to be created (e.g., 'Trivia').
 * createdBy: The username of the user creating the game.
 */
export interface CreateGameRequest extends Request {
  body: {
    gameType: GameType;
    createdBy: string;
  };
}

/**
 * Interface extending the request query parameters when retrieving games,
 * which contains:
 * gameType: The type of game.
 * status: The status of the game (e.g., 'IN_PROGRESS', 'WAITING_TO_START').
 */
export interface GetGamesRequest extends Request {
  query: {
    gameType: GameType;
    status: GameStatus;
  };
}

/**
 * Interface extending the request body when performing a game-related action,
 * which contains:
 * gameID: The ID of the game being interacted with.
 * playerID: The ID of the player performing the action (e.g., making a move).
 */
export interface GameRequest extends Request {
  body: {
    gameID: GameInstanceID;
    playerID?: string;
    username?: string;
  };
}

/**
 * Interface for querying games based on game type and status.
 * gameType: The type of game to query (e.g., 'Trivia').
 * state.status: The status of the game (e.g., 'IN_PROGRESS').
 */
export interface FindGameQuery {
  'gameType'?: GameType;
  'state.status'?: GameStatus;
}

/**
 * Type representing the list of game instances.
 * This is typically used in responses to return multiple games.
 */
export type GamesResponse = GameInstance<GameState>[];
