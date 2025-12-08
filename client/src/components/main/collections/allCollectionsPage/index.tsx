import './index.css';
import useAllCollectionsPage from '../../../../hooks/useAllCollectionsPage';

/**
 * AllCollectionsPage component displays a list of collections for a specific user.
 */
const AllCollectionsPage = () => {
  const {
    usernameBeingViewed,
    collections,
    handleCreateCollection,
    handleViewCollection,
    isOwner,
  } = useAllCollectionsPage();

  return (
    <div className='collections-page'>
      <div className='collections-header'>
        <h1 className='collection_title'>{usernameBeingViewed}'s Collections</h1>
        {isOwner && (
          <button className='collections-create-btn' onClick={handleCreateCollection}>
            Create Collection
          </button>
        )}
      </div>

      <div className='collections-list'>
        {collections.map(collection => (
          <div
            key={collection._id.toString()}
            className='collection-card'
            onClick={() => handleViewCollection(collection._id.toString())}>
            <h2 className='main-collection-name'>{collection.name}</h2>
            <div className='main-collection-description'>{collection.description}</div>
            <div className='collection-privacy'>{collection.isPrivate ? 'Private' : 'Public'}</div>
            <div className='collection-questions'>Questions: {collection.questions.length}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllCollectionsPage;
