import './index.css';
import { GameInstance, GameState } from '../../../../../types/types';
import useUserContext from '../../../../../hooks/useUserContext';

interface GameWithPlayerState extends GameState {
  player1?: string;
  player2?: string;
}

/**
 * Component to display a game card with details about a specific game instance.
 * @param game The game instance to display.
 * @param handleJoin Function to handle joining the game. Takes the game ID as an argument.
 * @param handleDelete Function to handle deleting the game. Takes the game ID as an argument.
 * @returns A React component rendering the game details and a join button if the game is waiting to start.
 */
const GameCard = ({
  game,
  handleJoin,
  handleDelete,
}: {
  game: GameInstance<GameState>;
  handleJoin: (gameID: string) => void;
  handleDelete: (gameID: string) => void;
}) => {
  const { user } = useUserContext();

  const state = game.state as GameWithPlayerState;
  const isCreator = game.createdBy === user.username;
  const isPlayer = game.players.includes(user.username);

  // Game is stale if IN_PROGRESS but no active players
  const isStale = game.state.status === 'IN_PROGRESS' && !state?.player1 && !state?.player2;

  // Show delete button if:
  // 1. Game is stale (anyone can delete stale games)
  // 2. OR user is creator (can delete their own games in any state)
  // 3. OR old game without createdBy but user is a player
  const canDelete = isStale || isCreator || (!game.createdBy && isPlayer);

  return (
    <div className='game-item'>
      <p>
        <strong>Game Type:</strong> {game.gameType} | <strong>Status:</strong> {game.state.status}
      </p>
      <ul className='game-players'>
        {game.players.length > 0 ? (
          game.players.map((player: string) => <li key={`${game.gameID}-${player}`}>{player}</li>)
        ) : (
          <li>No players</li>
        )}
      </ul>
      <div className='game-actions'>
        {game.state.status === 'WAITING_TO_START' && (
          <button className='btn-join-game' onClick={() => handleJoin(game.gameID)}>
            Join Game
          </button>
        )}
        {canDelete && (
          <button className='btn-delete-game' onClick={() => handleDelete(game.gameID)}>
            Delete Game
          </button>
        )}
      </div>
    </div>
  );
};

export default GameCard;
