import { GameInstance, GameState, GameStatus, GameType } from '../types/types';
import api from './config';
import axios from 'axios';

interface ValidationError {
  path?: string;
  message?: string;
  error?: string;
}

const GAMES_API_URL = `/api/games`;

/**
 * TRIVIA FEATURE: Client - API Service Functions
 * These functions make HTTP requests to server endpoints:
 * - createGame: POST /api/games/create - creates new game & returns gameID
 * - joinGame: POST /api/games/join - adds player to game
 * - startGame: POST /api/games/start - starts game & fetches questions
 * - leaveGame: POST /api/games/leave - removes player from game
 *
 * Function to create a new game of the specified type.
 * @param gameType The type of game to create.
 * @returns A promise resolving to the game ID of the created game.
 * @throws Error if there is an issue while creating the game.
 */
const createGame = async (gameType: GameType, createdBy: string): Promise<string> => {
  try {
    const res = await api.post(`${GAMES_API_URL}/create`, {
      gameType,
      createdBy,
    });

    if (res.status !== 200) {
      throw new Error('Error while creating a new game');
    }

    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      // Server sends the error as plain text or a JSON object
      let errorMessage = 'Error while creating a new game';
      const responseData = error.response.data;

      if (typeof responseData === 'string') {
        errorMessage = responseData;
      } else if (responseData && typeof responseData === 'object') {
        // Handle validation errors with the proper error messages
        if (responseData.errors && Array.isArray(responseData.errors)) {
          const validationErrors = responseData.errors
            .map(
              (err: ValidationError) =>
                `${err.path || ''}: ${err.message || err.error || 'Validation failed'}`,
            )
            .join(', ');
          errorMessage = `Validation Error: ${validationErrors}`;
        } else {
          errorMessage = responseData.message || responseData.error || errorMessage;
        }
      }
      throw new Error(errorMessage);
    }
    throw error;
  }
};

/**
 * Function to fetch a list of games based on optional filters for game type and status.
 * @param gameType (Optional) The type of games to filter by.
 * @param status (Optional) The status of games to filter by.
 * @returns A promise resolving to a list of game instances.
 * @throws Error if there is an issue while fetching the games.
 */
const getGames = async (
  gameType: GameType | undefined,
  status: GameStatus | undefined,
): Promise<GameInstance<GameState>[]> => {
  const params = new URLSearchParams();

  if (gameType) {
    params.append('gameType', gameType);
  }

  if (status) {
    params.append('status', status);
  }

  const res = await api.get(`${GAMES_API_URL}/games`, {
    params,
  });

  if (res.status !== 200) {
    throw new Error('Error while getting games');
  }

  return res.data;
};

/**
 * Function to join an existing game.
 * @param gameID The ID of the game to join.
 * @param playerID The ID of the player joining the game.
 * @returns A promise resolving to the updated game instance.
 * @throws Error if there is an issue while joining the game.
 */
const joinGame = async (gameID: string, playerID: string): Promise<GameInstance<GameState>> => {
  try {
    const res = await api.post(`${GAMES_API_URL}/join`, {
      gameID,
      playerID,
    });

    if (res.status !== 200) {
      throw new Error('Error while joining a game');
    }

    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const errorMessage =
        typeof error.response.data === 'string'
          ? error.response.data
          : error.response.data?.message ||
            error.response.data?.error ||
            'Error while joining a game';
      throw new Error(errorMessage);
    }
    throw error;
  }
};

/**
 * Function to leave a game.
 * @param gameID The ID of the game to leave.
 * @param playerID The ID of the player leaving the game.
 * @returns A promise resolving to the updated game instance.
 * @throws Error if there is an issue while leaving the game.
 */
const leaveGame = async (gameID: string, playerID: string): Promise<GameInstance<GameState>> => {
  try {
    const res = await api.post(`${GAMES_API_URL}/leave`, {
      gameID,
      playerID,
    });

    if (res.status !== 200) {
      throw new Error('Error while leaving a game');
    }

    return res.data;
  } catch (error) {
    // Silent leave errors
    if (axios.isAxiosError(error)) {
      // Return a dummy game instance for make return type happy GAHH
      return {} as GameInstance<GameState>;
    }
    throw error;
  }
};

/**
 * Function to start a game.
 * @param gameID The ID of the game to start.
 * @returns A promise resolving to the updated game instance.
 * @throws Error if there is an issue while starting the game.
 */
const startGame = async (gameID: string): Promise<GameInstance<GameState>> => {
  try {
    const res = await api.post(`${GAMES_API_URL}/start`, {
      gameID,
    });

    if (res.status !== 200) {
      throw new Error('Error while starting a game');
    }

    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const errorMessage =
        typeof error.response.data === 'string'
          ? error.response.data
          : error.response.data?.message ||
            error.response.data?.error ||
            'Error while starting a game';
      throw new Error(errorMessage);
    }
    throw error;
  }
};

/**
 * Function to delete a game.
 * @param gameID The ID of the game to delete.
 * @param username The username of the user attempting to delete the game.
 * @returns A promise resolving when the game is deleted.
 * @throws Error if there is an issue while deleting the game.
 */
const deleteGame = async (gameID: string, username: string): Promise<void> => {
  const res = await api.post(`${GAMES_API_URL}/delete`, {
    gameID,
    username,
  });

  if (res.status !== 200) {
    throw new Error('Error while deleting a game');
  }
};

export { createGame, getGames, joinGame, startGame, leaveGame, deleteGame };
