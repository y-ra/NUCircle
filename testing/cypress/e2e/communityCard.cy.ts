import { createCommunity, verifyCommunityDetailsDisplayed, verifyCommunityDetailsNotDisplayed, goToCommunities, viewCommunityCard, loginUser, setupTest, teardownTest } from '../support/helpers';

const C1_NAME = "HubSpot";
const C1_DESC = "A community for students who have completed or are applying for HubSpot co-ops. Discuss interview tips, tech stack insights, and what it’s like to work in a collaborative, fast-paced marketing tech company.";
const C1_MEMBERS = ["e.hopper",
      "w.byers",
      "m.wheeler",
      "d.henderson",
      "e.munson",
      "vecna",
      "b.hargrove",
      "s.harrington",
      "m.mayfield", 
      "n.wheeler",  
      "j.tribbiani",
      "l.sinclair"];

const C5_NAME = "Pre-Health & Medical Co-ops";
const C5_DESC = "A space for students interested in healthcare, pre-med, nursing, or research co-ops. Discuss hospital experiences, lab rotations, and application strategies for medical or healthcare-related co-ops.";
const C5_MEMBERS = [
    "e.munson",
    "vecna",
    "b.hargrove",
    "s.harrington",
    "m.mayfield",
    "n.wheeler",
    "j.hopper",
    "l.sinclair",
    "j.gergich",
    "r.green"];

describe("Cypress Tests to verify display of community information", () => {

  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it("6.1 | Displays community card for selected community", () => {
    
    loginUser('e.hopper');

    // go to all communities page
    goToCommunities();

    // go to the new community
    viewCommunityCard(C1_NAME);

    // verify community information is displayed
    verifyCommunityDetailsDisplayed(C1_NAME, C1_DESC, C1_MEMBERS);

  });

  it("6.2 | Does not display private community information", () => {
    
    loginUser('e.hopper');

    // go to all communities page
    goToCommunities();

    // go to the new community
    viewCommunityCard(C5_NAME);

    // verify community information is displayed
    verifyCommunityDetailsNotDisplayed(C5_NAME, C5_DESC, C5_MEMBERS);

  });

});
