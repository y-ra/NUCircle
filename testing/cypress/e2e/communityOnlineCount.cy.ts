import { 
  loginUser, 
  setupTest, 
  teardownTest,
  goToCommunities,
  viewCommunityCard,
  logoutUser
} from '../support/helpers';

describe('Cypress Tests for community online member count', () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it('Community page displays online member count', () => {
    loginUser('e.hopper');
    goToCommunities();
    viewCommunityCard('HubSpot');

    cy.get('.section-heading').contains('Members').should('contain', 'online');
  });

  it('Online indicator appears for online members', () => {
    loginUser('e.hopper');
    goToCommunities();
    viewCommunityCard('HubSpot');

    cy.get('.member-item').contains('e.hopper').within(() => {
      cy.get('.online-indicator').should('exist');
    });
  });

  it('Offline members do not show online indicator', () => {
    loginUser('e.hopper');
    goToCommunities();
    viewCommunityCard('HubSpot');

    cy.get('.member-item').contains('m.wheeler').within(() => {
      cy.get('.online-indicator').should('not.exist');
    });
  });

  it('Online count shows correct format', () => {
  loginUser('e.hopper');
  goToCommunities();
  viewCommunityCard('HubSpot');

  cy.get('.section-heading').contains('Members').invoke('text').then((text) => {
    expect(text).to.match(/Members \(\d+ online\)/);
  });
});

it('Member list displays correctly with online indicators', () => {
    loginUser('e.hopper');
    goToCommunities();
    viewCommunityCard('HubSpot');

    cy.get('.members-list').should('exist');
    cy.get('.member-item').should('have.length.at.least', 1);
    
    // At least item should exist
    cy.get('.member-item').first().should('contain', 'e.hopper');
  });
});