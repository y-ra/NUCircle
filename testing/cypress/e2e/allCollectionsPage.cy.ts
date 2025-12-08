import {goToMyCollections, loginUser, setupTest, teardownTest, verifyCollectionExists } from '../support/helpers';

describe("Cypress Tests to verify viewing all collections", () => {

  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it("3.1 | Displays the exisitng collections in the My Collections Page", () => {
    
    loginUser('e.hopper');

    goToMyCollections();
    
    cy.get('.collection_title').should('contain', "Collections");

    // Verify some pre-seeded collections appear
    verifyCollectionExists("Behavioral Interview Prep");
  });
});