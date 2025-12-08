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
  goToUsers,
} from "../support/helpers";

describe("Global Leaderboard", () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it("10.1 | Leaderboard shows top users by points", () => {
    // Login and navigate to Users page
    loginUser("e.hopper");
    goToUsers();

    // Verify leaderboard shows users with points
    cy.contains("🏆 Leaderboard").should("exist");
    cy.get(".leaderboard-title").parent().within(() => {
      // Check that users are displayed with points
      cy.contains("pts").should("exist");
    });
  });

  it("10.2 | Leaderboard displays medals for top 3 users", () => {
    // Create some test data - have users earn different point amounts
    loginUser("e.hopper");
    goToQuestions();
    createQuestion("Question 1", "First question", "test");
    
    cy.get(".logout-button").click();
    loginUser("w.byers", "strongP@ss234");
    goToQuestions();
    createQuestion("Question 2", "Second question", "test");
    goToAnswerQuestion("Question 1");
    createAnswer("Answer to earn more points");

    // Navigate to Users page
    goToUsers();

    // Verify top 3 have medal emojis
    cy.contains("🏆 Leaderboard").parent().within(() => {
      // Look for medal emojis in the leaderboard
      cy.get(".userCard").first().should("contain", "🥇");
    });
  });

  it("10.3 | Clicking leaderboard user navigates to their profile", () => {
    // Login and navigate to Users page
    loginUser("e.hopper");
    goToUsers();

    // Click on a user in the leaderboard
    cy.contains("🏆 Leaderboard").parent().within(() => {
      cy.get(".userCard").first().click();
    });

    // Verify navigation to user profile
    cy.url().should("include", "/user/");
  });

  it("10.4 | Leaderboard shows multiple users with same points", () => {
    // Have multiple users earn the same points
    loginUser("e.hopper");
    goToQuestions();
    createQuestion("Q1", "Question 1", "test"); // 10 points

    cy.get(".logout-button").click();
    loginUser("w.byers", "strongP@ss234");
    goToQuestions();
    createQuestion("Q2", "Question 2", "test"); // 10 points

    // Navigate to Users page
    goToUsers();

    // Verify both users appear on leaderboard
    cy.contains("🏆 Leaderboard").parent().within(() => {
      cy.contains("e.hopper").should("exist");
      cy.contains("w.byers").should("exist");
      cy.contains("10 pts").should("exist");
    });
  });

  it("10.5 | Leaderboard persists across page navigation", () => {
    // Login and check leaderboard
    loginUser("e.hopper");
    goToUsers();

    // Store leaderboard state
    cy.contains("🏆 Leaderboard").parent().within(() => {
      cy.get(".userCard").first().invoke('text').as('topUser');
    });

    // Navigate away
    goToQuestions();

    // Navigate back to Users page
    goToUsers();

    // Verify leaderboard is still there with same data
    cy.contains("🏆 Leaderboard").should("exist");
    cy.get("@topUser").then((topUser) => {
      cy.contains("🏆 Leaderboard").parent().should("contain", topUser);
    });
  });
});