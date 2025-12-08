import { Q1_DESC, Q2_DESC, Q3_DESC, Q4_DESC, Q5_DESC, Q6_DESC, Q7_DESC, Q8_DESC, Q9_DESC, Q10_DESC } from '../../../server/testData/post_strings';
import { 
  loginUser, 
  setupTest, 
  teardownTest, 
  performSearch, 
  verifyQuestionOrder, 
  waitForQuestionsToLoad 
} from '../support/helpers';

describe("Cypress Tests to verify searching questions", () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it("17.1 | Search for a question using text content that does not exist", () => {
    const searchText = "tasty";
    
    loginUser('e.hopper');
    
    // Perform search for non-existent content
    performSearch(searchText);
    
    // Verify no results found
    cy.get('.postTitle').should('have.length', 0);
    cy.contains('No Questions Found').should('be.visible');
  });

  it("17.2 | Search string in question text - finds company questions", () => {
    loginUser('e.hopper');
    
    // Search for text that appears in Q2's content (memory issues) and Q10 (memory leaks)
    performSearch('company');
    waitForQuestionsToLoad();
    
    // Should find Q2 (Node.js memory issues) and Q10 (React memory leaks)
    cy.get('.postTitle').should('contain', "How do I know if a company’s culture will be a good fit?");
    cy.get('.postTitle').should('contain', "What’s the best way to network at company info sessions?");
  });

  it("17.3 | Search string in question text - finds LinkedIn question", () => {
    loginUser('e.hopper');
    
    // Search for text that appears in Q4's content (PostgreSQL)
    performSearch('LinkedIn');
    waitForQuestionsToLoad();
    
    // Should find Q4 about PostgreSQL query optimization
    const expectedResults = ["How important is LinkedIn when applying for internships?"];
    verifyQuestionOrder(expectedResults);
  });

  it("17.4 | Search a question by tag - react tag", () => {
    loginUser('e.hopper');
    
    // Search for react tag (tag3)
    // Based on seed data: Q1, Q6, Q10 have react tag
    performSearch('[co-op-experience]');
    waitForQuestionsToLoad();
    
    cy.get('.postTitle').should('contain', "Balancing co-op work and classes — how do you manage it?");
  });

  it("17.5 | Search a question by tag - resume-building tag", () => {
    loginUser('e.hopper');
    
    // Search for javascript tag (tag1)
    // Based on seed data: Q1, Q5, Q9 have javascript tag
    performSearch('[resume-building]');
    waitForQuestionsToLoad();
    
    cy.get('.postTitle').should('contain', "How important is LinkedIn when applying for internships?");
    cy.get('.postTitle').should('contain', "How to tailor my resume for consulting vs. tech roles?");
  });

  it("17.6 | Search a question by tag - software-engineering tag", () => {
    loginUser('e.hopper');
    
    // Search for python tag (tag2)
    // Based on seed data: Q2, Q7 have python tag
    performSearch('[software-engineering]');
    waitForQuestionsToLoad();
    
    cy.get('.postTitle').should('contain', "How to tailor my resume for consulting vs. tech roles?");
  });

  it("17.7 | Search a question by tag - marketing tag", () => {
    loginUser('e.hopper');
    
    // Search for node.js tag (tag4)
    // Based on seed data: Q3, Q8 have node.js tag
    performSearch('[marketing]');
    waitForQuestionsToLoad();
    
    cy.get('.postTitle').should('contain', "How do I know if a company’s culture will be a good fit?");
  });

  it("17.8 | Search for a question using a tag that does not exist", () => {
    loginUser('e.hopper');
    
    // Search for non-existent tag
    performSearch('[nonExistentTag]');
    
    // Verify no results found
    cy.get('.postTitle').should('have.length', 0);
    cy.contains('No Questions Found').should('be.visible');
  });

  it("17.9 | Search with multiple terms finds relevant questions", () => {
    loginUser('e.hopper');
    
    // Search for multiple terms that should match React-related questions
    performSearch('internships culture');
    waitForQuestionsToLoad();
    
    // Should find questions containing either "React" or "component"
    cy.get('.postTitle').should('have.length.at.least', 2);
  });
});
