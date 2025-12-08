import { goToQuestions, loginUser, setupTest, teardownTest, goToCollections, verifyQuestionSaved, verifyQuestionUnsaved, openSaveToCollectionModal, toggleSaveQuestionToCollection, waitForQuestionsToLoad, toggleSaveQuestion } from '../support/helpers';

const COL5_TITLE = "Behavioral Interview Prep";
const Q2_TITLE = "How do I know if a company’s culture will be a good fit?";

describe("Cypress Tests to verify saving to collection", () => {

  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it("16.1 | Allows users to save questions to their collections with a save button, and shows saved status", () => {
    
    // login with a seed data user
    loginUser('e.hopper');

    // go to questions page
    goToQuestions();
    waitForQuestionsToLoad();

    // save question #2 to collection #10
    toggleSaveQuestionToCollection(Q2_TITLE, COL5_TITLE);

    // close the modal
    cy.get('.close-btn').click();

    // reload the page
    goToQuestions();
    waitForQuestionsToLoad();

    // open the modal again
    openSaveToCollectionModal(Q2_TITLE)

    // verify the collection #10 is marked as saved
    verifyQuestionSaved("Behavioral Interview Prep");

  });

  it("16.2 | Allows users to unsave questions to their collections with a save button, and shows unsaved status", () => {
    
    loginUser('e.hopper');

    // go to questions page
    goToQuestions();
    waitForQuestionsToLoad();

    // save and then unsave question #2 to collection #5
    toggleSaveQuestionToCollection(Q2_TITLE, COL5_TITLE);
    toggleSaveQuestion(COL5_TITLE);

    // close the modal
    cy.get('.close-btn').click();

    // reload the page
    goToQuestions();
    waitForQuestionsToLoad();

    // open the modal again
    openSaveToCollectionModal(Q2_TITLE);

    // verify the collection #5 is marked as unsaved
    verifyQuestionUnsaved(COL5_TITLE);

  });

});
