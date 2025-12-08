import { goToCommunities, createCommunity, loginUser, setupTest, teardownTest } from '../support/helpers';

const C1_NAME = "HubSpot";
const C2_NAME = "Microsoft";
const C3_NAME = "Goldman Sachs";
const C4_NAME = "Mass General Brigham";
const C5_NAME = "Pre-Health & Medical Co-ops";
const C6_NAME = "Deloitte";
const C7_NAME = "Pre-Law & Policy";


describe("Cypress Tests to verify display of all communities", () => {

  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it("4.1 | Displays all communities on the community page", () => {
    
    // login with seed data user
    loginUser('e.hopper');

    // go to all communities page
    goToCommunities();

    const C_NAME_NEW = "Public Community1";
    createCommunity(C_NAME_NEW, "A public community for devs", false);
    const cTitles = [
      C1_NAME,
      C2_NAME,
      C3_NAME,
      C4_NAME,
      C5_NAME,
      C6_NAME,
      C7_NAME,
      C_NAME_NEW
    ];

    goToCommunities();

    // verify all communities are displayed
    cy.get('.community-card').each(($el, index, $list) => {
      cy.wrap($el).should("contain", cTitles[index]);});

  });

  it("4.2 | Should search for a community", () => {
    loginUser('e.hopper');
    goToCommunities();
    cy.get('.community-search').type(C1_NAME);
    cy.get('.community-card').should("contain", C1_NAME);
  });

});
