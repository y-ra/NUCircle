import {goToCollection, goToMyCollections, loginUser, setupTest, teardownTest, verifyCollectionExists, verifyCollectionPageDetails } from '../support/helpers';

describe("Cypress Tests to verify viewing of a specific collection page", () => {

  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it("5.1 | Displays the collection page after clicking on an existing collection in the my collections page", () => {
    
    loginUser('e.hopper');

    goToMyCollections();
    
    cy.get('.collection_title').should('contain', "Collections");

    // Verify some pre-seeded collections appear
    verifyCollectionExists("Behavioral Interview Prep");
    
    goToCollection("Behavioral Interview Prep");

    verifyCollectionPageDetails("Behavioral Interview Prep", "e.hopper");

  });
});