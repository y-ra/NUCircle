import { GameMove, TriviaGameState, TriviaAnswer } from '../../types/types';
import Game from './game';
import TriviaQuestionModel from '../../models/triviaQuestion.model';
import { awardPointsToUser } from '../point.service';

/**
 * TRIVIA FEATURE: Core Game Logic - TriviaGame Class
 * This is the main class that handles all Trivia-specific game logic.
 * It extends the generic Game class and implements:
 * - Question fetching from database
 * - Answer validation and scoring
 * - Progress tracking (current question, player answers, scores)
 * - Game state changing (WAITING_TO_START -> IN_PROGRESS -> OVER)
 *
 * Represents a game of Trivia, extending the generic Game class.
 *
 * This class contains the specific game logic for playing a Trivia Quiz game
 */
class TriviaGame extends Game<TriviaGameState, TriviaAnswer> {
  private _correctAnswers: number[] = [];
  private _tiebreakerTimerSet: boolean = false;

  /**
   * Constructor for the TriviaGame class which initializes the game state and type.
   * @param createdBy The username of the user creating the game.
   */
  public constructor(createdBy: string) {
    super(
      {
        status: 'WAITING_TO_START',
        currentQuestionIndex: 0,
        questions: [],
        player1Answers: [],
        player2Answers: [],
        player1Score: 0,
        player2Score: 0,
      },
      'Trivia',
      createdBy,
    );
  }

  /**
   * TRIVIA FEATURE: Question Fetching
   * Called when the game starts & uses MongoDB aggregation to randomly select 10 questions.
   * Stores correct answers separately for scoring & maps the questions to the game format.
   * Fetches 10 random questions from the database.
   */
  private async _fetchRandomQuestions(): Promise<void> {
    try {
      const questions = await TriviaQuestionModel.aggregate([{ $sample: { size: 10 } }]);
      this._correctAnswers = questions.map((q: { correctAnswer: number }) => q.correctAnswer);
      this.state = {
        ...this.state,
        questions: questions.map(
          (q: { _id: { toString: () => string }; question: string; options: string[] }) => ({
            questionId: q._id.toString(),
            question: q.question,
            options: q.options,
          }),
        ),
      };
    } catch (error) {
      throw new Error(`Failed to fetch trivia questions: ${(error as Error).message}`);
    }
  }

  /**
   * TIEBREAKER FEATURE: Fetches the Tiebreaker question
   * Fetches 1 random question from the database for the tiebreaker, which is then added to the questions array & stores the correct answer
   */
  private async _fetchTiebreakerQuestion(): Promise<void> {
    try {
      const questions = await TriviaQuestionModel.aggregate([{ $sample: { size: 1 } }]);
      const tiebreakerQuestion = questions[0];
      const tiebreakerCorrectAnswer = tiebreakerQuestion.correctAnswer;

      // Adds the tiebreaker question to the questions array
      const tiebreakerQuestionFormatted = {
        questionId: tiebreakerQuestion._id.toString(),
        question: tiebreakerQuestion.question,
        options: tiebreakerQuestion.options,
      };

      this._correctAnswers.push(tiebreakerCorrectAnswer);
      this.state = {
        ...this.state,
        questions: [...this.state.questions, tiebreakerQuestionFormatted],
        isTiebreaker: true,
        tiebreakerStartTime: Date.now(),
      };
      this._tiebreakerTimerSet = false; // Reset flag so timer can be set up
    } catch (error) {
      throw new Error(`Failed to fetch tiebreaker question: ${(error as Error).message}`);
    }
  }

  /**
   * TIEBREAKER FEATURE: Checks if the timer needs to be set up
   * Returns true if the tiebreaker just started & the timer hasn't been set yet
   */
  public shouldSetTiebreakerTimer(): boolean {
    return (
      this.state.isTiebreaker === true &&
      !this._tiebreakerTimerSet &&
      this.state.tiebreakerStartTime !== undefined
    );
  }

  /**
   * TIEBREAKER FEATURE: Marks the timer as set
   */
  public markTiebreakerTimerSet(): void {
    this._tiebreakerTimerSet = true;
  }

  /**
   * TRIVIA FEATURE: Answer Validation
   * Ensures that the game is in progress, player is in game, & the answer index is valid (0-3), the question ID matches current question, & the player hasn't already answered.
   * TIEBREAKER FEATURE: Validates tiebreaker answers separately
   *
   * Validates the answer submission
   * @param gameMove The move to validate
   * @throws Error if the move is invalid
   */
  private _validateMove(gameMove: GameMove<TriviaAnswer>): void {
    const { playerID, move } = gameMove;

    // Ensure game is in progress
    if (this.state.status !== 'IN_PROGRESS') {
      throw new Error('Invalid move: game is not in progress');
    }

    // Ensure player is in game
    if (playerID !== this.state.player1 && playerID !== this.state.player2) {
      throw new Error('Invalid move: player not in game');
    }

    // Ensure answer index is valid
    if (move.answerIndex < 0 || move.answerIndex > 3) {
      throw new Error('Invalid move: answer index must be between 0 and 3');
    }

    // TIEBREAKER FEATURE: Handles tiebreaker answer validation/checking
    if (this.state.isTiebreaker) {
      const tiebreakerQuestion = this.state.questions[this.state.questions.length - 1];
      if (move.questionId !== tiebreakerQuestion.questionId) {
        throw new Error('Invalid move: question ID does not match tiebreaker question');
      }

      const isPlayer1 = playerID === this.state.player1;
      if (isPlayer1 && this.state.tiebreakerPlayer1Answer !== undefined) {
        throw new Error('Invalid move: player has already answered tiebreaker');
      }
      if (!isPlayer1 && this.state.tiebreakerPlayer2Answer !== undefined) {
        throw new Error('Invalid move: player has already answered tiebreaker');
      }
      return;
    }

    // Regular question validation/checking
    const currentQuestion = this.state.questions[this.state.currentQuestionIndex];
    if (move.questionId !== currentQuestion.questionId) {
      throw new Error('Invalid move: question ID does not match current question');
    }

    // Check if the player has already answered the question
    const isPlayer1 = playerID === this.state.player1;
    const playerAnswers = isPlayer1 ? this.state.player1Answers : this.state.player2Answers;
    if (playerAnswers.length > this.state.currentQuestionIndex) {
      throw new Error('Invalid move: player has already answered this question');
    }
  }

  // Ensures that both players have answered
  private _bothPlayersAnswered(): boolean {
    return (
      this.state.player1Answers.length > this.state.currentQuestionIndex &&
      this.state.player2Answers.length > this.state.currentQuestionIndex
    );
  }

  /**
   * TIEBREAKER FEATURE: Checks if the tiebreaker timer finished
   * If 10 seconds have passed:
   * - If both players haven't answered → tie
   * - If one player answered correctly → they win
   * - If one player answered incorrectly → tie
   * Returns true if the timer finished & the game was ended
   */
  public checkTiebreakerTimer(): boolean {
    if (!this.state.isTiebreaker || !this.state.tiebreakerStartTime) return false;

    const elapsed = Date.now() - this.state.tiebreakerStartTime;
    const hasPlayer1Answer = this.state.tiebreakerPlayer1Answer !== undefined;
    const hasPlayer2Answer = this.state.tiebreakerPlayer2Answer !== undefined;

    // Only process if 10 seconds have passed
    if (elapsed < 10000) return false;

    // If both players haven't answered, it's a tie
    if (!hasPlayer1Answer && !hasPlayer2Answer) {
      this._endTiebreakerAsTie();
      return true;
    }

    // If both players answered, winner should already be determined by _processTiebreakerWinner
    if (hasPlayer1Answer && hasPlayer2Answer) {
      return false;
    }

    // Only one player answered - check if they got it correct
    const tiebreakerIndex = this.state.questions.length - 1;
    const correctAnswer = this._correctAnswers[tiebreakerIndex];
    const { player1, player2 } = this.state;

    if (hasPlayer1Answer && !hasPlayer2Answer) {
      // Player 1 answered, player 2 didn't
      const player1Correct = this.state.tiebreakerPlayer1Answer === correctAnswer;
      if (player1Correct && player1) {
        // Player 1 answered correctly → they win
        const winners = [player1];
        awardPointsToUser(player1, 10);
        if (player2) awardPointsToUser(player2, 2);
        this.state = {
          ...this.state,
          status: 'OVER',
          winners,
          player1Score: this.state.player1Score + 1, // Increment winner's score
        };
        return true;
      } else {
        // Player 1 answered incorrectly → tie
        this._endTiebreakerAsTie();
        return true;
      }
    } else if (!hasPlayer1Answer && hasPlayer2Answer) {
      // Player 2 answered, player 1 didn't
      const player2Correct = this.state.tiebreakerPlayer2Answer === correctAnswer;
      if (player2Correct && player2) {
        // Player 2 answered correctly → they win
        const winners = [player2];
        awardPointsToUser(player2, 10);
        if (player1) awardPointsToUser(player1, 2);
        this.state = {
          ...this.state,
          status: 'OVER',
          winners,
          player2Score: this.state.player2Score + 1, // Increment winner's score
        };
        return true;
      } else {
        // Player 2 answered incorrectly → tie
        this._endTiebreakerAsTie();
        return true;
      }
    }

    return false;
  }

  /**
   * TIEBREAKER FEATURE: Ends the tiebreaker & game as a tie
   * Called when timer has finished & both players haven't answered
   */
  private _endTiebreakerAsTie(): void {
    const { player1, player2 } = this.state;
    const winners: string[] = [];
    if (player1 && player2) {
      winners.push(player1, player2);
      awardPointsToUser(player1, 10);
      awardPointsToUser(player2, 10);
    }

    this.state = { ...this.state, status: 'OVER', winners };
  }

  /**
   * TIEBREAKER FEATURE: Processes tiebreaker answers & compares & determines the winner from that
   */
  private _processTiebreakerWinner(): void {
    const hasPlayer1Answer = this.state.tiebreakerPlayer1Answer !== undefined;
    const hasPlayer2Answer = this.state.tiebreakerPlayer2Answer !== undefined;

    // Wait for both answers
    if (!hasPlayer1Answer || !hasPlayer2Answer) return;

    const tiebreakerIndex = this.state.questions.length - 1;
    const correctAnswer = this._correctAnswers[tiebreakerIndex];
    const { player1, player2, tiebreakerPlayer1Answer, tiebreakerPlayer2Answer } = this.state;

    const player1Correct = tiebreakerPlayer1Answer === correctAnswer;
    const player2Correct = tiebreakerPlayer2Answer === correctAnswer;

    let winners: string[] = [];
    let updatedPlayer1Score = this.state.player1Score;
    let updatedPlayer2Score = this.state.player2Score;

    // Determine winner based on tiebreaker answers
    if (player1Correct && !player2Correct && player1) {
      winners = [player1];
      updatedPlayer1Score = this.state.player1Score + 1; // Increment winner's score
      awardPointsToUser(player1, 10);
      if (player2) awardPointsToUser(player2, 2);
    } else if (player2Correct && !player1Correct && player2) {
      winners = [player2];
      updatedPlayer2Score = this.state.player2Score + 1; // Increment winner's score
      awardPointsToUser(player2, 10);
      if (player1) awardPointsToUser(player1, 2);
    } else {
      // Both correct or both wrong = tie (no score increment for tie)
      if (player1 && player2) {
        winners = [player1, player2];
        awardPointsToUser(player1, 10);
        awardPointsToUser(player2, 10);
      }
    }

    this.state = {
      ...this.state,
      status: 'OVER',
      winners,
      player1Score: updatedPlayer1Score,
      player2Score: updatedPlayer2Score,
    };
  }

  // Checks if game has ended and determines the winner
  private async _gameEndCheck(): Promise<void> {
    // Checks if the 10 regular questions have been answered
    if (this.state.currentQuestionIndex >= 10 && !this.state.isTiebreaker) {
      const { player1Score, player2Score, player1, player2 } = this.state;

      // TIEBREAKER FEATURE: If the scores are tied, start the tiebreaker instead of ending the game as usual
      if (player1Score === player2Score && player1 && player2) {
        await this._fetchTiebreakerQuestion();
        return;
      }

      // Normal logic for non-tied scores
      let winners: string[] = [];
      if (player1Score > player2Score && player1) {
        winners = [player1];
        awardPointsToUser(player1, 10);
        if (player2) {
          awardPointsToUser(player2!, 2);
        }
      } else if (player2Score > player1Score && player2) {
        winners = [player2];
        awardPointsToUser(player2, 10);
        if (player1) {
          awardPointsToUser(player1!, 2);
        }
      } else if (player1 && player2) {
        winners = [player1, player2];
        awardPointsToUser(player1, 10);
        awardPointsToUser(player2, 10);
      }

      this.state = { ...this.state, status: 'OVER', winners };
    }
  }

  /**
   * TRIVIA FEATURE: Answer Processing & Scoring
   * This is called when a player submits an answer. It:
   * 1. Validates the answer via _validateMove
   * 2. Records the answer in the player1Answers or player2Answers array
   * 3. Checks if the answer matches the correct answer and updates their score
   * 4. If both players answered, it increments currentQuestionIndex
   * 5. Checks if the game is over (all 10 questions have been answered) and determines the winner
   * TIEBREAKER FEATURE: Handles tiebreaker answers separately & determines the winner when both players answer.
   *
   * Applies a move (an answer submission) to the game
   * @param move The move to apply
   */
  public async applyMove(move: GameMove<TriviaAnswer>): Promise<void> {
    this._validateMove(move);

    const { playerID, move: answer } = move;
    const isPlayer1 = playerID === this.state.player1;

    // TIEBREAKER FEATURE: Handles tiebreaker answers
    if (this.state.isTiebreaker) {
      if (isPlayer1) {
        this.state = {
          ...this.state,
          tiebreakerPlayer1Answer: answer.answerIndex,
        };
      } else {
        this.state = {
          ...this.state,
          tiebreakerPlayer2Answer: answer.answerIndex,
        };
      }

      // Checks if both players answered to determine the winner
      this._processTiebreakerWinner();
      return;
    }

    // Regular question handling
    const isCorrect = answer.answerIndex === this._correctAnswers[this.state.currentQuestionIndex];

    if (isPlayer1) {
      this.state = {
        ...this.state,
        player1Answers: [...this.state.player1Answers, answer.answerIndex],
        player1Score: isCorrect ? this.state.player1Score + 1 : this.state.player1Score,
      };
    } else {
      this.state = {
        ...this.state,
        player2Answers: [...this.state.player2Answers, answer.answerIndex],
        player2Score: isCorrect ? this.state.player2Score + 1 : this.state.player2Score,
      };
    }

    if (this._bothPlayersAnswered()) {
      this.state = { ...this.state, currentQuestionIndex: this.state.currentQuestionIndex + 1 };
    }

    await this._gameEndCheck();
  }

  /**
   * Joins a player to the game. The game can only be joined if it is waiting to start.
   * @param playerID The ID of the player joining the game.
   * @throws Will throw an error if the player cannot join.
   */
  protected async _join(playerID: string): Promise<void> {
    if (this.state.status !== 'WAITING_TO_START') {
      throw new Error('Cannot join game: already started');
    }

    if (this.state.player1 === playerID || this.state.player2 === playerID) {
      throw new Error('Cannot join game: player already in game');
    }

    if (this.state.player1 === undefined) {
      this.state = { ...this.state, player1: playerID };
    } else if (this.state.player2 === undefined) {
      this.state = { ...this.state, player2: playerID };
    }
  }

  /**
   * TRIVIA FEATURE: Starting the Game
   * Called when the "Start Game" button is clicked. Fetches 10 random questions from the database and changes status from WAITING_TO_START to IN_PROGRESS.
   * Requires 2 players to start.
   * @throws Will throw an error if the game cannot be started.
   */
  public async startGame(): Promise<void> {
    if (this.state.status !== 'WAITING_TO_START') {
      throw new Error('Game is not waiting to start');
    }

    if (this.state.player1 === undefined || this.state.player2 === undefined) {
      throw new Error('Cannot start game: requires 2 players');
    }

    await this._fetchRandomQuestions();
    this.state = { ...this.state, status: 'IN_PROGRESS' };
  }

  /**
   * Removes a player from the game. If a player leaves during an ongoing game, the game ends.
   * @param playerID The ID of the player leaving the game.
   * @throws Will throw an error if the player is not in the game.
   */
  protected _leave(playerID: string): void {
    if (!this._players.includes(playerID)) {
      throw new Error(`Cannot leave game: player ${playerID} is not in the game.`);
    }

    if (this.state.status === 'WAITING_TO_START' && this.state.player1 === playerID) {
      this.state = { ...this.state, player1: undefined };
    } else if (this.state.status === 'IN_PROGRESS') {
      if (this.state.player1 === playerID && this.state.player2 !== undefined) {
        this.state = {
          ...this.state,
          status: 'OVER',
          player1: undefined,
          winners: [this.state.player2],
        };
      } else if (this.state.player2 === playerID && this.state.player1 !== undefined) {
        this.state = {
          ...this.state,
          status: 'OVER',
          player2: undefined,
          winners: [this.state.player1],
        };
      }
    }
  }
}

export default TriviaGame;
