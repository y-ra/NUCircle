import { setupTest, teardownTest, loginUser, goToCommunities, viewCommunityCard } from "../support/helpers";

describe("Community Visit Streaks", () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it("8.1 | Initialize streak on first visit to a community", () => {
    // Login with seed data user
    loginUser("e.hopper");

    // Go to communities and view 
    goToCommunities();
    viewCommunityCard("HubSpot");

    // Check that streak is initialized (should show current streak: 1)
    cy.contains("1 day in a row").should("exist");
    cy.contains("No streaks yet").should("not.exist");
  });

  it("8.2 | Maintain streak count on same day revisit", () => {
    // Login as w.byers (member of HubSpot community)
    loginUser("w.byers", "strongP@ss234");

    // First visit to HubSpot community
    goToCommunities();
    viewCommunityCard("HubSpot");

    // Verify initial streak
    cy.contains("1 day in a row").should("exist");

    // Navigate away and back to same community
    goToCommunities();
    viewCommunityCard("HubSpot");

    // Streak should remain 1 (same day)
    cy.contains("1 day in a row").should("exist");
  });

  it("8.3 | Display streak information for community members", () => {
    // Login as m.wheeler (member of HubSpot community)
    loginUser("d.henderson", "C0mplexP@ss456");

    // Visit HubSpot community
    goToCommunities();
    viewCommunityCard("HubSpot");

    // Check that streak information is visible
    cy.contains("Daily Streak").should("exist");
    cy.contains("in a row").should("exist");
    cy.contains("Longest Streak").should("exist");
  });

  it("8.4 | Track individual user streaks in shared community", () => {
    // First user visits
    loginUser("e.hopper");
    goToCommunities();
    viewCommunityCard("HubSpot");

    // Verify first user's streak
    cy.contains("1 day in a row").should("exist");
    cy.contains("e.hopper").should("exist");
    cy.contains("holds the record with").should("exist");

    // Logout and login as second user
    cy.get(".logout-button").click();
    loginUser("w.byers", "strongP@ss234");

    // Second user visits same community
    goToCommunities();
    viewCommunityCard("HubSpot");

    // Second user should have their own streak initialized
    cy.contains("1 day in a row").should("exist");
  });

  it("8.5 | Show longest streak record holder", () => {
    // Login as d.henderson (member of HubSpot community)
    loginUser("d.henderson", "C0mplexP@ss456");

    // Visit HubSpot community
    goToCommunities();
    viewCommunityCard("HubSpot");

    // Verify longest streak displays the user and their record
    cy.contains("Longest Streak").should("exist");
    cy.contains("holds the record with").should("exist");
    cy.contains("1 day").should("exist");
  });

  it("8.6 | Non-members see zero streak", () => {
    // Login as user who is NOT a member of HubSpot community
    loginUser("r.green", "F@stL0ad!ng");

    // View HubSpot community without being a member
    goToCommunities();
    viewCommunityCard("HubSpot");

    // Non-member should see 0 days streak
    cy.contains("0 days in a row").should("exist");
  });

  it("8.7 | Multiple members show different streaks", () => {
    // First member visits
    loginUser("e.hopper");
    goToCommunities();
    viewCommunityCard("HubSpot");
    cy.contains("1 day in a row").should("exist");

    // Second member visits
    cy.get(".logout-button").click();
    loginUser("w.byers", "strongP@ss234");
    goToCommunities();
    viewCommunityCard("HubSpot");
    cy.contains("1 day in a row").should("exist");

    // Third member visits
    cy.get(".logout-button").click();
    loginUser("d.henderson", "C0mplexP@ss456");
    goToCommunities();
    viewCommunityCard("HubSpot");
    cy.contains("1 day in a row").should("exist");

    // Longest streak section should show one of the users who visited
    cy.contains("Longest Streak").should("exist");
    cy.contains("holds the record with").should("exist");
  });

  it("8.8 | Show initialized streak after first visit", () => {
    // Login as a member of Deloitte community
    loginUser("p.buffay", "Qu3ryN1nja!");

    // Visit Deloitte community for first time
    goToCommunities();
    viewCommunityCard("Deloitte");

    // After visiting, should show initialized streak
    cy.contains("1 day in a row").should("exist");
    cy.contains("p.buffay").should("exist");
    cy.contains("holds the record with").should("exist");
  });
});