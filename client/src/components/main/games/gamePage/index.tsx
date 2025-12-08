import './index.css';
import TriviaGamePage from '../triviaGamePage';
import useGamePage from '../../../../hooks/useGamePage';
import { GameInstance, GameState, TriviaGameState } from '../../../../types/types';

interface GameWithPlayerState extends GameState {
  player1?: string;
  player2?: string;
}

/**
 * TRIVIA FEATURE: Client - Main Game Page Component
 * This component renders the game page UI; it:
 * - Shows the game status, players list, and the "Start Game" button
 * - Renders the TriviaGamePage component when the gameType is 'Trivia'
 * - Handles the game controls (starting, leaving, etc.)
 *
 * Component to display the game page for a specific game type, including controls and game state
 * @returns A React component including:
 * - A header with the game title and current game status
 * - A Leave Game button to exit the current game
 * - The game component specific to the game type (like `TriviaGamePage` for "Trivia")
 * - An error message if an error occurs during the game
 */
const GamePage = () => {
  const { gameInstance, error, handleStartGame, handleLeaveGame } = useGamePage();

  /**
   * Renders the appropriate game component based on the game type
   * @param gameType The type of the game to render (e.g., "Trivia")
   * @returns A React component corresponding to the specified game type, or a message for unknown types
   */
  const renderGameComponent = (gameType: string) => {
    if (!gameInstance) return null;

    switch (gameType) {
      case 'Trivia':
        return <TriviaGamePage gameInstance={gameInstance as GameInstance<TriviaGameState>} />;
      default:
        return <div>Unknown game type</div>;
    }
  };

  const getGameTitle = () => {
    if (!gameInstance) return 'Game';
    return gameInstance.gameType === 'Trivia' ? 'Trivia Quiz' : 'Game';
  };

  return (
    <div className='page-container'>
      <div className='game-page'>
        <header className='game-header'>
          <h1>{getGameTitle()}</h1>
          <p className='game-status'>
            Status: {gameInstance ? gameInstance.state.status : 'Not started'}
          </p>
        </header>

        {gameInstance && (
          <div className='game-players-list'>
            <h3>Players in Game:</h3>
            <ul>
              {gameInstance.players.length > 0 ? (
                gameInstance.players.map((player: string) => <li key={player}>{player}</li>)
              ) : (
                <li>No players yet</li>
              )}
            </ul>
          </div>
        )}

        <div className='game-controls'>
          {/* Game Info, lowkey can be helpful for debugging :P */}
          {gameInstance && (
            <div
              style={{
                marginBottom: '10px',
                padding: '10px',
                background: '#f0f0f0',
                borderRadius: '5px',
              }}>
              <p>
                <strong>Game Info:</strong>
              </p>
              <p>Game Status: {gameInstance.state.status}</p>
              <p>Game Type: {gameInstance.gameType}</p>
              <p>Player Count: {gameInstance.players.length}</p>
              <p>Players: {JSON.stringify(gameInstance.players)}</p>
              <p>Player 1: {(gameInstance.state as GameWithPlayerState).player1 || 'undefined'}</p>
              <p>Player 2: {(gameInstance.state as GameWithPlayerState).player2 || 'undefined'}</p>
            </div>
          )}

          {gameInstance && gameInstance.state.status === 'WAITING_TO_START' && (
            <button className='btn-start-game' onClick={handleStartGame}>
              Start Game
            </button>
          )}

          <button className='btn-leave-game' onClick={handleLeaveGame}>
            Leave Game
          </button>
        </div>

        {gameInstance && renderGameComponent(gameInstance.gameType)}

        {error && !error.toLowerCase().includes('request failed with status code') && (
          <div className='game-error'>{error}</div>
        )}
      </div>
    </div>
  );
};

export default GamePage;
