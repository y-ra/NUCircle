import { createQuestion, goToAskQuestion, loginUser, setupTest, teardownTest } from '../support/helpers';

describe("Cypress Tests to verify asking new questions", () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });


  it("2.1 | Ask a Question creates and displays expected meta data", () => {
    loginUser('e.hopper');

    createQuestion("Test Question Q1", "Test Question Q1 Text T1", "interview-prep");

    cy.contains("NUCircle");
    cy.contains("7 Questions");
    cy.get(".lastActivity").should("contain", "Posted by").and("contain", "e.hopper").and("contain", "0 seconds ago");
    const views = [
      "0",
      "3",
      "3",
      "4",
      "3",
      "4",
      "4"
    ];
    const answers = [
      "0",
      "1",
      "1",
      "1",
      "1",
      "1",
      "1"
    ];
    cy.get(".postStats").each(($el, index, $list) => {
      cy.wrap($el).should("contain", views[index]);
      cy.wrap($el).should("contain", answers[index]);
    });
    cy.contains("Unanswered").click();
    cy.contains("1 Question");
  });

  it("2.2 | Ask a Question with empty title shows error", () => {
    loginUser('e.hopper');
    
    cy.contains("Ask Question").click();
    cy.get("#formTextInput").type("Test Question 1 Text Q1");
    cy.get("#formTagInput").type("interview-prep");
    cy.contains("Post Question").click();
    
    cy.contains("Title cannot be empty");
  });
});