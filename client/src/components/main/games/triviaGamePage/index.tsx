import './index.css';
import { useState, useEffect } from 'react';
import { GameInstance, TriviaGameState } from '../../../../types/types';
import useTriviaGamePage from '../../../../hooks/useTriviaGamePage';

/**
 * TRIVIA FEATURE: Client - Trivia Game UI Component
 * This component renders the trivia game interface, which:
 * - Shows the player scores and current question progress
 * - Displays the current question with 4 multiple choice options
 * - Renders the "Submit Answer" button, which should be disabled if the question was already answered
 * - Shows a "Waiting for other player" message when the other player has answered
 * - Displays a game over screen with the ultimate winner when all 10 questions have been answered
 *
 * Component to display the Trivia game page
 * @param gameInstance The current instance of the Trivia game that has player details, questions, and scores
 * @returns A React component that contains:
 * - Current game status and player information
 * - Current question with multiple choice options
 * - Score tracking for both players
 * - Announcement with winner when game is over
 */
const TriviaGamePage = ({ gameInstance }: { gameInstance: GameInstance<TriviaGameState> }) => {
  const { user, selectedAnswer, handleAnswerSelect, handleSubmitAnswer, hasAnswered } =
    useTriviaGamePage(gameInstance);

  // TIEBREAKER FEATURE: Tracks the timer for the tiebreaker question
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const isTiebreaker = gameInstance.state.isTiebreaker || false;

  // TIEBREAKER FEATURE: Calculates the time remaining for the tiebreaker timer
  useEffect(() => {
    if (isTiebreaker && gameInstance.state.tiebreakerStartTime) {
      const updateTimer = () => {
        const elapsed = Date.now() - gameInstance.state.tiebreakerStartTime!;
        const remaining = Math.max(0, 10000 - elapsed);
        setTimeRemaining(remaining);

        if (remaining <= 0) {
          setTimeRemaining(0);
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 100);

      return () => clearInterval(interval);
    } else {
      setTimeRemaining(null);
    }
  }, [isTiebreaker, gameInstance.state.tiebreakerStartTime]);

  // Gets the current question
  // For the tiebreaker, it uses the last question in the array
  const currentQuestion = isTiebreaker
    ? gameInstance.state.questions[gameInstance.state.questions.length - 1]
    : gameInstance.state.currentQuestionIndex < gameInstance.state.questions.length
      ? gameInstance.state.questions[gameInstance.state.currentQuestionIndex]
      : null;

  const isPlayer1 = user.username === gameInstance.state.player1;

  // TIEBREAKER FEATURE: Checks if the player has answered the tiebreaker question
  const hasAnsweredTiebreaker = isTiebreaker
    ? isPlayer1
      ? gameInstance.state.tiebreakerPlayer1Answer !== undefined
      : gameInstance.state.tiebreakerPlayer2Answer !== undefined
    : false;

  const otherPlayerAnswered = isTiebreaker
    ? isPlayer1
      ? gameInstance.state.tiebreakerPlayer2Answer !== undefined
      : gameInstance.state.tiebreakerPlayer1Answer !== undefined
    : isPlayer1
      ? gameInstance.state.player2Answers.length > gameInstance.state.currentQuestionIndex
      : gameInstance.state.player1Answers.length > gameInstance.state.currentQuestionIndex;

  return (
    <div className='trivia-game-container'>
      <div className='trivia-game-header'>
        <h2>Trivia Quiz Battle</h2>
        <div className='trivia-progress'>
          {isTiebreaker ? (
            <span>Tiebreaker Question</span>
          ) : (
            <span>Question {Math.min(gameInstance.state.currentQuestionIndex + 1, 10)} of 10</span>
          )}
        </div>
      </div>

      <div className='trivia-players-section'>
        <div className='trivia-player-card'>
          <h3>Player 1</h3>
          <p className='player-name'>{gameInstance.state.player1 || 'Waiting...'}</p>
          <p className='player-score'>Score: {gameInstance.state.player1Score}</p>
        </div>
        <div className='trivia-vs'>VS</div>
        <div className='trivia-player-card'>
          <h3>Player 2</h3>
          <p className='player-name'>{gameInstance.state.player2 || 'Waiting...'}</p>
          <p className='player-score'>Score: {gameInstance.state.player2Score}</p>
        </div>
      </div>

      {gameInstance.state.status === 'WAITING_TO_START' && (
        <div className='trivia-waiting-section'>
          <h3>Waiting for players...</h3>
          <p>
            {gameInstance.state.player1 && gameInstance.state.player2
              ? 'Both players have joined! Game will start shortly...'
              : `Waiting for ${gameInstance.state.player1 ? 'Player 2' : 'Player 1'} to join...`}
          </p>
        </div>
      )}

      {gameInstance.state.status === 'IN_PROGRESS' && currentQuestion && (
        <div className='trivia-question-section'>
          {/* TIEBREAKER FEATURE: Shows the tiebreaker header & timer */}
          {isTiebreaker && (
            <div className='trivia-tiebreaker-header'>
              <h3 style={{ color: '#ff6b6b', marginBottom: '10px' }}>🏆 TIEBREAKER QUESTION 🏆</h3>
              {timeRemaining !== null && timeRemaining > 0 && (
                <div
                  className='trivia-timer'
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: timeRemaining <= 3000 ? '#ff6b6b' : '#4ecdc4',
                    marginBottom: '15px',
                  }}>
                  Time: {Math.ceil(timeRemaining / 1000)}s
                </div>
              )}
              {timeRemaining === 0 && (
                <div
                  className='trivia-timer-expired'
                  style={{
                    fontSize: '18px',
                    color: '#ff6b6b',
                    marginBottom: '15px',
                  }}>
                  ⏱️ Time's up!
                </div>
              )}
            </div>
          )}

          <div className='trivia-question'>
            <h3>{currentQuestion.question}</h3>
          </div>

          <div className='trivia-options'>
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                className={`trivia-option ${selectedAnswer === index ? 'selected' : ''} ${
                  (isTiebreaker ? hasAnsweredTiebreaker : hasAnswered) || timeRemaining === 0
                    ? 'disabled'
                    : ''
                }`}
                onClick={() => handleAnswerSelect(index)}
                disabled={
                  (isTiebreaker ? hasAnsweredTiebreaker : hasAnswered) || timeRemaining === 0
                }>
                <span className='option-letter'>{String.fromCharCode(65 + index)}.</span>
                <span className='option-text'>{option}</span>
              </button>
            ))}
          </div>

          {/* TIEBREAKER FEATURE: Shows the different messages for the tiebreaker */}
          {(isTiebreaker ? hasAnsweredTiebreaker : hasAnswered) ? (
            <div className='trivia-status'>
              <p className='waiting-message'>
                ✓ Answer submitted!{' '}
                {otherPlayerAnswered
                  ? isTiebreaker
                    ? 'Determining winner...'
                    : 'Moving to next question...'
                  : 'Waiting for other player...'}
              </p>
            </div>
          ) : timeRemaining === 0 ? (
            <div className='trivia-status'>
              <p className='waiting-message' style={{ color: '#ff6b6b' }}>
                ⏱️ Time expired. Waiting for game result...
              </p>
            </div>
          ) : (
            <button
              className='trivia-submit-btn'
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null || timeRemaining === 0}>
              Submit Answer
            </button>
          )}
        </div>
      )}

      {gameInstance.state.status === 'OVER' && (
        <div className='trivia-game-over'>
          <h2>Game Over!</h2>
          <div className='trivia-final-scores'>
            <p>
              <strong>{gameInstance.state.player1}:</strong> {gameInstance.state.player1Score}/10
            </p>
            <p>
              <strong>{gameInstance.state.player2}:</strong> {gameInstance.state.player2Score}/10
            </p>
          </div>
          {gameInstance.state.winners && gameInstance.state.winners.length > 0 ? (
            <div className='trivia-winner'>
              {gameInstance.state.winners.length === 1 ? (
                <p className='winner-announce'>
                  🎉 Winner: <strong>{gameInstance.state.winners[0]}</strong> 🎉
                </p>
              ) : (
                <p className='winner-announce'>🤝 It's a tie! 🤝</p>
              )}
            </div>
          ) : (
            <p>No winner determined</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TriviaGamePage;
