import { setupTest, teardownTest, loginUser, goToCommunities, createCommunity, verifyCommunityDetailsDisplayed } from "../support/helpers";

describe("NewCommunityButton", () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it("14.1 | Create a new community", () => {
    loginUser("e.hopper");
    goToCommunities();

    const communityName = "Button Create Community";
    const communityDesc = "Created via NewCommunityButton";
    createCommunity(communityName, communityDesc, true);
    verifyCommunityDetailsDisplayed(communityName, communityDesc, ["e.hopper"]);
  });
});
