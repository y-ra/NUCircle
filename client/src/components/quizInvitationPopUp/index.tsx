import './index.css';
import { QuizInvite } from '../../types/types';

interface QuizInvitationModalProps {
  invite: QuizInvite | null;
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * Modal that displays when a user receives a quiz invitation
 * Shows challenger name and Accept/Decline buttons
 */
const QuizInvitationPopUp = ({ invite, onAccept, onDecline }: QuizInvitationModalProps) => {
  if (!invite) return null;

  return (
    <div className='quiz-invite-modal-overlay'>
      <div className='quiz-invite-modal'>
        <div className='quiz-invite-header'>
          <h2>Quiz Challenge!</h2>
        </div>

        <div className='quiz-invite-body'>
          <p className='quiz-invite-message'>
            <strong>{invite.challengerUsername}</strong> has challenged you to a trivia quiz!
          </p>
          <p className='quiz-invite-question'>Do you accept the challenge?</p>
        </div>

        <div className='quiz-invite-actions'>
          <button className='quiz-invite-btn decline' onClick={onDecline}>
            Decline
          </button>
          <button className='quiz-invite-btn accept' onClick={onAccept}>
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizInvitationPopUp;
