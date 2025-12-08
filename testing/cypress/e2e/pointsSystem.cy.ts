import { 
  setupTest, 
  teardownTest, 
  loginUser, 
  createQuestion, 
  goToAnswerQuestion,
  createAnswer,
  goToCommunities,
  viewCommunityCard,
  goToQuestions,
  goToMyProfile,
  subsequentLoginUser,
} from "../support/helpers";

describe("Points System", () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it("9.1 | User earns 10 points for asking a question", () => {
    // Login as user
    loginUser("e.hopper");

    // Check initial points (should be 0 for new user or existing points)
    goToMyProfile();
    cy.contains("Points")
      .parent()
      .then(($el) => {
        const initialPointsText = $el.text();
        const initialPoints = parseInt(
          initialPointsText.match(/\d+/)?.[0] || "0"
        );

        // Create a question
        goToQuestions();
        createQuestion(
          "Test Question for Points",
          "This is a test question to verify points are awarded",
          "testing points"
        );

        // Navigate back to profile and verify points increased by 10
        goToMyProfile();
        cy.contains("Points")
          .parent()
          .should("contain", initialPoints + 10);
      });
  });

  it("9.2 | User earns 15 points for answering a question", () => {
    // First user creates a question
    loginUser("e.hopper");
    goToQuestions();
    createQuestion(
      "Question to Answer",
      "This question needs an answer",
      "testing"
    );

    // Logout and login as different user to answer
    cy.get(".logout-button").click();
    loginUser("w.byers", "strongP@ss234");

    // Check initial points for answering user
    goToMyProfile();
    cy.contains("Points").parent().then(($el) => {
      const initialPointsText = $el.text();
      const initialPoints = parseInt(initialPointsText.match(/\d+/)?.[0] || "0");

      // Answer the question
      goToQuestions();
      goToAnswerQuestion("Question to Answer");
      createAnswer("This is my answer to earn points");

      // Navigate back to profile and verify points increased by 15
      goToMyProfile();
      cy.contains("Points").parent().should("contain", initialPoints + 15);
    });
  });

  it("9.3 | User earns 5 points for joining a community", () => {
    // Login as user who is not a member of HubSpot
    loginUser("r.green", "F@stL0ad!ng");

    // Check initial points
    goToMyProfile();
    cy.contains("Points").parent().then(($el) => {
      const initialPointsText = $el.text();
      const initialPoints = parseInt(initialPointsText.match(/\d+/)?.[0] || "0");

      // Join HubSpot community
      goToCommunities();
      viewCommunityCard("HubSpot");
      cy.contains("button", "Join").click();

      // Navigate back to profile and verify points increased by 5
      goToMyProfile();
      cy.contains("Points").parent().should("contain", initialPoints + 5);
    });
  });

  it("9.4 | User accumulates points from multiple actions", () => {
    // Login as user
    loginUser("d.henderson", "C0mplexP@ss456");

    // Check initial points
    goToMyProfile();
    cy.contains("Points").parent().then(($el) => {
      const initialPointsText = $el.text();
      const initialPoints = parseInt(initialPointsText.match(/\d+/)?.[0] || "0");

      // Ask a question (10 points)
      goToQuestions();
      createQuestion(
        "First Question",
        "Testing multiple point actions",
        "testing"
      );

      // Join a community (5 points) - join Microsoft since m.wheeler is not a member
      goToCommunities();
      viewCommunityCard("Microsoft");
      cy.contains("button", "Join").click();

      // Answer another user's question (15 points)
      goToQuestions();
      goToAnswerQuestion("How do I know if a company’s culture will be a good fit?")
      createAnswer("My answer for more points");

      // Verify total points increased by 30 (10 + 5 + 15)
      goToMyProfile();
      cy.contains("Points").parent().should("contain", initialPoints + 30);
    });
  });

  it("9.5 | Points are displayed on user profile", () => {
    // Login as user
    loginUser("e.hopper");

    // Navigate to profile
    goToMyProfile();

    // Verify points section exists and displays points
    cy.contains("User Stats").should("exist");
    cy.contains("Points").should("exist");
    cy.contains("Points").parent().invoke('text').should('match', /\d+/);
  });

  it("9.6 | Different users have independent point totals", () => {
    // First user earns points
    loginUser("e.hopper");
    goToMyProfile();
    cy.contains("Points").parent().then(($el) => {
      const user1Points = $el.text().match(/\d+/)?.[0];

      // Ask a question as first user
      goToQuestions();
      createQuestion(
        "User 1 Question",
        "Earning points as user 1",
        "testing"
      );

      // Logout and login as second user
      cy.get(".logout-button").click();
      loginUser("w.byers", "strongP@ss234");

      // Check second user's points
      goToMyProfile();
      cy.contains("Points").parent().then(($el2) => {
        const user2Points = $el2.text().match(/\d+/)?.[0];

        // Ask a question as second user
        goToQuestions();
        createQuestion(
          "User 2 Question",
          "Earning points as user 2",
          "testing"
        );

        // Verify second user's points increased
        goToMyProfile();
        cy.contains("Points").parent().should("contain", parseInt(user2Points || "0") + 10);
      });
    });
  });

  it("9.7 | Points persist across sessions", () => {
    // Login and earn points
    loginUser("d.henderson", "C0mplexP@ss456");

    // Ask a question to earn points
    goToQuestions();
    createQuestion(
      "Persistence Test Question",
      "Testing if points persist",
      "testing"
    );

    // Check points
    goToMyProfile();
    cy.contains("Points").parent().then(($el) => {
      const pointsEarned = $el.text().match(/\d+/)?.[0];

      // Logout
      cy.get(".logout-button").click();

      // Login again
      subsequentLoginUser("d.henderson", "C0mplexP@ss456");

      // Verify points are still there
      goToMyProfile();
      cy.contains("Points").parent().should("contain", pointsEarned);
    });
  });

});