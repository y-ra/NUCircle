import './index.css';

/**
 * Interface representing the props for the AnswerHeader component.
 *
 * - ansCount - The number of answers to display in the header.
 * - title - The title of the question or discussion thread.
 */
interface AnswerHeaderProps {
  ansCount: number;
  handleNewAnswer: () => void;
}

/**
 * AnswerHeader component that displays a header section for the answer page.
 * It includes the number of answers, the title of the question, and a button to ask a new question.
 *
 * @param ansCount The number of answers to display.
 * @param title The title of the question or discussion thread.
 */
const AnswerHeader = ({ ansCount, handleNewAnswer }: AnswerHeaderProps) => (
  <div className='answers-header-row'>
    <div className='answers-title'>
      {ansCount} {ansCount === 1 ? 'Answer' : 'Answers'}
    </div>
    <button
      className='ansButton'
      onClick={() => {
        handleNewAnswer();
      }}>
      Answer Question
    </button>
  </div>
);

export default AnswerHeader;
