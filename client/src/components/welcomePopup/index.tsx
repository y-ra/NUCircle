import './index.css';
import useLoginContext from '../../hooks/useLoginContext';
import { markWelcomeMessageSeen } from '../../services/userService';

/**
 * WelcomePopup component displays a welcome message with community guidelines
 * for first-time users after sign-up.
 */
const WelcomePopup = ({ onClose }: { onClose: () => void }) => {
  const { user, setUser } = useLoginContext();

  const handleClose = async () => {
    try {
      if (user) {
        const updatedUser = await markWelcomeMessageSeen();
        setUser(updatedUser);
      }
      onClose();
    } catch (error) {
      onClose();
    }
  };

  return (
    <div className='welcome-popup-backdrop' onClick={handleClose}>
      <div className='welcome-popup-container' onClick={e => e.stopPropagation()}>
        <h2 className='welcome-popup-title'>Welcome to NUCircle!</h2>
        <div className='welcome-popup-content'>
          <p>We're excited to have you join our community of Northeastern students.</p>
          <div className='welcome-popup-guidelines'>
            <h3>Community Guidelines</h3>
            <ul>
              <li>Be respectful and kind to all members</li>
              <li>Share knowledge and help others learn</li>
              <li>Keep discussions relevant and constructive</li>
              <li>Follow Northeastern's code of conduct</li>
            </ul>
          </div>
          <p className='welcome-popup-footer'>
            We hope you have a great experience connecting with fellow Huskies!
          </p>
        </div>
        <button onClick={handleClose} className='welcome-popup-button'>
          Get Started
        </button>
      </div>
    </div>
  );
};

export default WelcomePopup;
