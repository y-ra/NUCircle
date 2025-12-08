import './index.css';
import TagView from './tag';
import useTagPage from '../../../hooks/useTagPage';
import AskQuestionButton from '../askQuestionButton';

/**
 * Represents the TagPage component which displays a list of tags
 * and provides functionality to handle tag clicks and ask a new question.
 */
const TagPage = () => {
  const { tlist, clickTag } = useTagPage();

  return (
    <div className='tags-page'>
      <div className='tags-header'>
        <div className='tags-header-left'>
          <div className='tags-title'>All Tags</div>
          <div className='tag-count-circle'>{tlist.length}</div>
        </div>
        <AskQuestionButton />
      </div>
      <div className='tag_list'>
        {tlist.map(t => (
          <TagView key={t.name} t={t} clickTag={clickTag} />
        ))}
      </div>
    </div>
  );
};

export default TagPage;
