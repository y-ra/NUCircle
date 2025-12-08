import {deleteCollection, goToMyCollections, loginUser, setupTest, teardownTest, verifyCollectionExists } from '../support/helpers';

describe("Cypress Tests to verify deleting a collections", () => {

  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it("9.1 | Delete an exisitng collections in the My Collections Page", () => {
    
    loginUser('e.hopper');

    goToMyCollections();
    
    cy.get('.collection_title').should('contain', "Collections");

    // Verify some pre-seeded collections appear
    verifyCollectionExists("Behavioral Interview Prep");

    deleteCollection("Behavioral Interview Prep");

    // Verify deletion
    cy.contains("Behavioral Interview Prep").should('not.exist');
    cy.get(".collection-card").should('not.exist');
  });
});