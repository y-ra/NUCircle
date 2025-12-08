import { getMetaData } from '../../../tool';
import AnswerView from './answer';
import AnswerHeader from './header';
import { Comment } from '../../../types/types';
import './index.css';
import QuestionCard from './questionBody';
import useAnswerPage from '../../../hooks/useAnswerPage';
import AskQuestionButton from '../askQuestionButton';

/**
 * AnswerPage component that displays the full content of a question along with its answers.
 * It also includes the functionality to vote, ask a new question, and post a new answer.
 */
const AnswerPage = () => {
  const { questionID, question, handleNewComment, handleNewAnswer } = useAnswerPage();

  if (!question) {
    return null;
  }

  return (
    <div className='answer-page-container'>
      <div className='ask-question-button-container'>
        <AskQuestionButton />
      </div>
      <QuestionCard
        question={question}
        handleAddComment={(comment: Comment) => handleNewComment(comment, 'question', questionID)}
      />
      <AnswerHeader ansCount={question.answers.length} handleNewAnswer={handleNewAnswer} />
      <div className='answers-list'>
        {question.answers.map(a => (
          <AnswerView
            key={String(a._id)}
            text={a.text}
            ansBy={a.ansBy}
            meta={getMetaData(new Date(a.ansDateTime))}
            comments={a.comments}
            handleAddComment={(comment: Comment) =>
              handleNewComment(comment, 'answer', String(a._id))
            }
          />
        ))}
      </div>
    </div>
  );
};

export default AnswerPage;
