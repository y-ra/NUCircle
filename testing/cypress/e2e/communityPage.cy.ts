import { setupTest, teardownTest, loginUser, goToCommunities, createCommunity, verifyCommunityDetailsDisplayed } from "../support/helpers";

describe("CommunityPage", () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it("8.1 | Display community page", () => {
    loginUser("e.hopper");
    goToCommunities();

    const communityName = "Community Page Display";
    const communityDesc = "Description for display test";
    createCommunity(communityName, communityDesc, true);
    verifyCommunityDetailsDisplayed(communityName, communityDesc, ["e.hopper"]);
  });
});
