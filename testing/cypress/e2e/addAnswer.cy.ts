import { createAnswer, goToAnswerQuestion, loginUser, setupTest, teardownTest } from '../support/helpers';
const qusetion = "How do I know if a company’s culture will be a good fit?";
describe("Cypress Tests to verify adding new answers", () => {

  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it("1.1 | Created new answer should be displayed at the top of the answers page", () => {
    const answers = [
      "Test Answer 1",
      "You can get a sense of whether a company’s culture fits you by paying close attention to how people communicate during interviews.",
    ];
    
    loginUser('e.hopper');

    goToAnswerQuestion(qusetion);

    createAnswer(answers[0]);

    cy.get(".answer-text").contains(answers[0])
    cy.contains("e.hopper");
    cy.contains("0 seconds ago");
  });


  it("1.2 | Answer is mandatory when creating a new answer", () => {
    loginUser('e.hopper');

    goToAnswerQuestion(qusetion);

    cy.contains("Post Answer").click();
    cy.contains("Answer text cannot be empty");
  });
});
