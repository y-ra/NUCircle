import './index.css';
import useNewCommunityPage from '../../../../hooks/useNewCommunityPage';

const NewCommunityPage = () => {
  const {
    name,
    setName,
    description,
    setDescription,
    isPublic,
    setIsPublic,
    error,
    handleNewCommunity,
  } = useNewCommunityPage();

  return (
    <div className='new-community-page'>
      <h2 className='new-community-title'>Create a New Community</h2>
      <div className='new-community-label'>Community Name</div>
      <input
        className='new-community-input'
        placeholder='Community name'
        type='text'
        onChange={e => setName(e.target.value)}
        value={name}
        required
      />
      <div className='new-community-label'>Community Description</div>
      <textarea
        className='new-community-textarea'
        placeholder='Community description'
        onChange={e => setDescription(e.target.value)}
        value={description}
        required
      />
      <label className='new-community-checkbox-label'>
        <label className='checkbox-wrapper'>
          <input
            type='checkbox'
            checked={isPublic}
            onChange={() => setIsPublic(!isPublic)}
            className='new-community-checkbox'
          />
          <div className='checkmark'></div>
        </label>
        Public Community
      </label>
      <button className='new-community-submit' onClick={handleNewCommunity}>
        Create Community
      </button>
      {error && <p className='new-community-error'>{error}</p>}
    </div>
  );
};

export default NewCommunityPage;
