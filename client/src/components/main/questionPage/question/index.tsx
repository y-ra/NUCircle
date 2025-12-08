import './index.css';
import { getMetaData } from '../../../../tool';
import { PopulatedDatabaseQuestion } from '../../../../types/types';
import SaveToCollectionModal from '../../collections/saveToCollectionModal';
import useQuestionView from '../../../../hooks/useQuestionView';

/**
 * Interface representing the props for the Question component.
 *
 * q - The question object containing details about the question.
 */
interface QuestionProps {
  question: PopulatedDatabaseQuestion;
}

/**
 * Question component renders the details of a question including its title, tags, author, answers, and views.
 * Clicking on the component triggers the handleAnswer function,
 * and clicking on a tag triggers the clickTag function.
 *
 * @param q - The question object containing question details.
 */
const QuestionView = ({ question }: QuestionProps) => {
  const { clickTag, handleAnswer, handleSaveClick, closeModal, isModalOpen, selectedQuestion } =
    useQuestionView();

  return (
    <div
      className='question'
      onClick={() => {
        if (question._id) {
          handleAnswer(question._id);
        }
      }}>
      <div className='question-top'>
        <div className='postTitle'>{question.title}</div>
        <div className='postStats'>
          <div>
            <svg
              width='24'
              height='16'
              viewBox='0 0 27 19'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'>
              <path
                d='M1.125 9.25C1.125 9.25 5.625 1.25 13.5 1.25C21.375 1.25 25.875 9.25 25.875 9.25C25.875 9.25 21.375 17.25 13.5 17.25C5.625 17.25 1.125 9.25 1.125 9.25Z'
                stroke='#37404D'
                stroke-width='2.5'
                stroke-linecap='round'
                stroke-linejoin='round'
              />
              <path
                d='M13.5 12.25C15.364 12.25 16.875 10.9069 16.875 9.25C16.875 7.59315 15.364 6.25 13.5 6.25C11.636 6.25 10.125 7.59315 10.125 9.25C10.125 10.9069 11.636 12.25 13.5 12.25Z'
                stroke='#37404D'
                stroke-width='2.5'
                stroke-linecap='round'
                stroke-linejoin='round'
              />
            </svg>
            {question.views.length}
          </div>
          <div>
            <svg
              width='17'
              height='17'
              viewBox='0 0 20 20'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'>
              <path
                d='M0 20V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H18C18.55 0 19.0208 0.195833 19.4125 0.5875C19.8042 0.979167 20 1.45 20 2V14C20 14.55 19.8042 15.0208 19.4125 15.4125C19.0208 15.8042 18.55 16 18 16H4L0 20ZM3.15 14H18V2H2V15.125L3.15 14Z'
                fill='#37404D'
              />
            </svg>
            {question.answers.length || 0}
          </div>
        </div>
      </div>

      <div className='question_mid'>
        <div className='lastActivity'>
          Posted by<div className='question_author'>{question.askedBy}</div>
          <div className='question_meta'>{getMetaData(new Date(question.askDateTime))}</div>
        </div>
        <div className='question_tags'>
          {question.tags.map(tag => (
            <button
              key={String(tag._id)}
              className='question_tag_button'
              onClick={e => {
                e.stopPropagation();
                clickTag(tag.name);
              }}>
              {tag.name}
            </button>
          ))}
        </div>
        <button
          onClick={e => {
            e.stopPropagation();
            handleSaveClick(question);
          }}
          className='collections-btn'>
          Edit My Collections
        </button>
      </div>
      {isModalOpen && selectedQuestion && (
        <SaveToCollectionModal question={selectedQuestion} onClose={closeModal} />
      )}
    </div>
  );
};

export default QuestionView;
