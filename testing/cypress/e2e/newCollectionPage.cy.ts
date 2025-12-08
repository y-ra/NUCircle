import {
  loginUser,
  setupTest,
  teardownTest,
  goToMyCollections,
  goToCreateCollection,
  verifyCollectionPageDetails,
  createNewCollection,
  verifyCollectionExists,
  goToCollection
} from '../support/helpers';

describe('Cypress Tests for creating collections', () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it('13.1 | Allows user to create a new Public collection', () => {
    const collectionName = 'New Collection';

    // Log in
    loginUser('e.hopper');

    // Navigate to My Collections
    goToMyCollections();

    // Click "Create Collection"
    goToCreateCollection();

    createNewCollection('New Collection', 'A list of new sources', false);

    goToMyCollections();

    // Verify the resulting collection page
    verifyCollectionExists(collectionName);
    goToCollection(collectionName);
    verifyCollectionPageDetails(collectionName, 'e.hopper');
  });

  it('13.2 | Allows user to create a new Private collection', () => {
    const collectionName = 'Private Collection';

    // Log in
    loginUser('e.hopper');

    // Navigate to My Collections
    goToMyCollections();

    // Click "Create Collection"
    goToCreateCollection();
    createNewCollection('Private Collection', 'Only I can see this', true);

    goToMyCollections();
    // Verify the resulting collection page
    verifyCollectionExists(collectionName);
    // cy.get('.collection-meta').should('contain', 'Private');

    goToCollection(collectionName);

    verifyCollectionPageDetails(collectionName, 'e.hopper');
  });
});