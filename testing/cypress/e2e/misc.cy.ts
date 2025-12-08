import { 
  loginUser, 
  setupTest, 
  teardownTest, 
  createQuestion, 
  goToAnswerQuestion, 
  createAnswer, 
  goToQuestions, 
  clickFilter, 
  waitForQuestionsToLoad 
} from '../support/helpers';

const Q1_DESC = "How do I know if a company’s culture will be a good fit?";
const Q2_DESC = "How important is LinkedIn when applying for internships?";
const Q3_DESC = "Balancing co-op work and classes — how do you manage it?";
const Q4_DESC = "What’s the best way to network at company info sessions?";
const Q5_DESC = "How to tailor my resume for consulting vs. tech roles?";

describe("Cypress Tests for verifying active order and initial test data", () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it("12.1 | Adds a question, clicks active button, verifies the sequence", () => {
    loginUser('e.hopper');

    // Create a new test question
    createQuestion('Test Question A', 'Test Question A Text', 'javascript');

    // Add answers to existing questions to change their activity order
    // Answer Q1 (React question)
    goToAnswerQuestion(Q1_DESC);
    createAnswer('Answer to React Router');
    goToQuestions();

    // Answer Q2 (Node.js memory question)
    goToAnswerQuestion(Q2_DESC);
    createAnswer('Answer to Node.js memory');
    goToQuestions();

    // Answer our new Test Question A
    goToAnswerQuestion('Test Question A');
    createAnswer('Answer Question A');
    goToQuestions();

    // Click Active filter to see questions ordered by most recent answer activity
    clickFilter('Active');
    waitForQuestionsToLoad();

    // Verify questions are in active order (most recently answered first)
    // The order should reflect which questions were answered most recently
    const expectedActiveOrder = [
      'Test Question A',  // Most recently answered (just now)
      Q2_DESC,           // Second most recently answered
      Q1_DESC,           // Third most recently answered
    ];
    
    // Check at least the first 3 questions are in the expected order
    cy.get('.postTitle').eq(0).should('contain', expectedActiveOrder[0]);
    cy.get('.postTitle').eq(1).should('contain', expectedActiveOrder[1]);
    cy.get('.postTitle').eq(2).should('contain', expectedActiveOrder[2]);
  });

  it("12.2 | Checks if seeded answers exist in Q3 answers page", () => {
    loginUser('e.hopper');

    // Navigate to Q3 (Webpack configuration question)
    cy.contains(Q3_DESC).click();
    
    // Check specific content from A3_TXT
    cy.get('.answer-text').should('contain', 'Block off time for yourself just like you would for class. I also found it helpful to use separate calendars for work and school so I could visually see my free time. And don’t underestimate the power of sleep.')
  });

  it("12.3 | Checks if seeded answer exists in Q4 answers page", () => {
    loginUser('e.hopper');
    
    // Navigate to Q4 (PostgreSQL optimization question)
    cy.contains(Q4_DESC).click();

    // Check specific content from A4_TXT
    cy.get('.answer-text').should('contain', 'Ask genuine questions about the speaker’s work — people love talking about their experiences. Follow up with a short LinkedIn message afterward. Even a quick \'thanks for sharing your insights\' can go a long way.');
  });

  it("12.4 | Verifies that questions with no answers appear correctly", () => {
    loginUser('e.hopper');
    createQuestion('Test Question A', 'Test Question A Text', 'javascript');
    
    // Check unanswered questions
    clickFilter('Unanswered');
    waitForQuestionsToLoad();
    
    // Should have 1 unanswered question that was created right before this
    cy.get('.postTitle').should('have.length.at.least', 1);
    
    // Verify they show "0 answers"
    cy.get('.postStats').first().should('contain', '0');
  });

  it("12.5 | Verifies question view counts are tracked correctly", () => {
    loginUser('e.hopper');
    
    // Click on a question to view it
    cy.contains(Q5_DESC).click();
    
    // Go back to questions list
    goToQuestions();
    
    // The view count should have increased
    // Find the question and check its view count is greater than 0
    cy.contains(Q5_DESC).parent().parent().within(() => {
      cy.get('.postStats').should('contain', '5');
      // Note: The exact view count will depend on seed data
    });
  });
});
