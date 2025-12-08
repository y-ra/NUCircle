import { createAnswer, createQuestion, goToAnswerQuestion, goToQuestions, loginUser, setupTest, teardownTest } from "../support/helpers";

const Q1_TITLE = "How do I know if a company’s culture will be a good fit?";
const Q2_TITLE = "How important is LinkedIn when applying for internships?";
const Q3_TITLE = "Balancing co-op work and classes — how do you manage it?";
const Q4_TITLE = "What’s the best way to network at company info sessions?";
const Q5_TITLE = "How to tailor my resume for consulting vs. tech roles?";
const Q6_TITLE = "What are the best ways to prepare for a behavioral co-op interview?";

describe("Cypress Tests to verify order of questions displayed", () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it('10.1 | Adds three questions and one answer, then click "Questions", then click unanswered button, verifies the sequence', () => {
    loginUser('e.hopper');

    createQuestion("Test Question A", "Test Question A Text", "javascript");

    createQuestion("Test Question B", "Test Question B Text", "javascript");

    createQuestion("Test Question C", "Test Question C Text", "javascript");

    goToAnswerQuestion("Test Question A");

    createAnswer("Answer Question A");

    goToQuestions();

    // clicks unanswered
    cy.contains("Unanswered").click();
    const qTitles = ["Test Question C", "Test Question B"];
    cy.get(".postTitle").each(($el, index, $list) => {
      cy.wrap($el).should("contain", qTitles[index]);
    });
  });

  it("10.2 | Check if questions are displayed in descending order of dates.", () => {
    const qTitles = [
      Q1_TITLE,
      Q2_TITLE,
      Q3_TITLE,
      Q4_TITLE,
      Q5_TITLE,
      Q6_TITLE
    ];

    loginUser('e.hopper');
    
    cy.get(".postTitle").each(($el, index, $list) => {
      cy.wrap($el).should("contain", qTitles[index]);
    });
  });

  it("10.3 | successfully shows all questions in model in most viewed order", () => {
    const qTitles = [
      Q3_TITLE,
      Q5_TITLE,
      Q6_TITLE,
      Q1_TITLE,
      Q2_TITLE,
      Q4_TITLE,
    ];

    loginUser('e.hopper');

    cy.contains("Most Viewed").click();
    cy.get(".postTitle").each(($el, index, $list) => {
      cy.wrap($el).should("contain", qTitles[index]);
    });
  });
});