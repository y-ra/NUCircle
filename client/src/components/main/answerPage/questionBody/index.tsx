import './index.css';
import { PopulatedDatabaseQuestion, Comment } from '../../../../types/types';
import VoteComponent from '../../voteComponent';
import { getMetaData } from '../../../../tool';
import CommentSection from '../../commentSection';

/**
 * Interface representing the props for the QuestionCard component.
 *
 * - views - The number of views the question has received.
 * - text - The content of the question, which may contain hyperlinks.
 * - askby - The username of the user who asked the question.
 * - meta - Additional metadata related to the question, such as the date and time it was asked.
 */
interface QuestionCardProps {
  question: PopulatedDatabaseQuestion;
  handleAddComment: (comment: Comment) => void;
}

/**
 * QuestionCard component that displays the body of a question.
 * It includes the number of views, the question content (with hyperlink handling),
 * the username of the author, and additional metadata.
 *
 * @param views The number of views the question has received.
 * @param text The content of the question.
 * @param askby The username of the question's author.
 * @param meta Additional metadata related to the question.
 */
const QuestionCard = ({ question, handleAddComment }: QuestionCardProps) => (
  <div className='question-card'>
    <div className='q-answer-top'>
      <VoteComponent question={question} />
      <div className='question-content'>
        <h1 className='answer-question-title'>{question.title}</h1>
        <div className='answer-question-text'>{question.text}</div>
        <div className='answer-question-meta'>
          <span>{question.views.length.toLocaleString()} views</span>
          <span>{question.answers.length} answers</span>
          <div className='question-author-block'>
            <div className='question-author-line'>asked by {question.askedBy}</div>
            <div className='question-meta-line'>{getMetaData(new Date(question.askDateTime))}</div>
          </div>
        </div>
        <CommentSection comments={question.comments} handleAddComment={handleAddComment} />
      </div>
    </div>
  </div>
);

export default QuestionCard;
