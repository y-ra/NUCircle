import './index.css';
import { useState, useEffect } from 'react';
import QuestionHeader from './header';
import QuestionView from './question';
import useQuestionPage from '../../../hooks/useQuestionPage';
import useLoginContext from '../../../hooks/useLoginContext';
import WelcomePopup from '../../welcomePopup';

/**
 * QuestionPage component renders a page displaying a list of questions
 * based on filters such as order and search terms.
 * It includes a header with order buttons and a button to ask a new question.
 */
const QuestionPage = () => {
  const { titleText, qlist, setQuestionOrder, questionOrder } = useQuestionPage();
  const { user } = useLoginContext();
  const [showWelcome, setShowWelcome] = useState(false);

  // welcome message popup logic
  useEffect(() => {
    if (user) {
      if (user.hasSeenWelcomeMessage === false) {
        setShowWelcome(true);
      } else {
        setShowWelcome(false);
      }
    }
  }, [user]);

  return (
    <>
      {showWelcome && <WelcomePopup onClose={() => setShowWelcome(false)} />}
      <QuestionHeader
        titleText={titleText}
        qcnt={qlist.length}
        setQuestionOrder={setQuestionOrder}
        currentOrder={questionOrder}
      />
      <div id='question_list' className='question_list'>
        {qlist.map(q => (
          <QuestionView question={q} key={q._id.toString()} />
        ))}
      </div>

      {titleText === 'Search Results' && !qlist.length && (
        <div className='bold_title right_padding'>No Questions Found</div>
      )}
    </>
  );
};

export default QuestionPage;
