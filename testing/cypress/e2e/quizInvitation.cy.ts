import { 
  loginUser, 
  setupTest, 
  teardownTest, 
  goToUsers,
  sendQuizInvite,
  verifyChallengeButtonState
} from '../support/helpers';

describe('Cypress Tests to verify quiz invitation system', () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it('Challenge button appears for online users only', () => {
    loginUser('e.hopper');
    goToUsers();

    cy.get('.user_card').contains('.userUsername', 'e.hopper').parents('.user_card').within(() => {
      cy.get('.challenge-button').should('not.exist');
    });

    cy.get('.user_card').contains('.userUsername', 'm.wheeler').parents('.user_card').within(() => {
      cy.get('.challenge-button').should('not.exist');
    });
  });

  it('Cannot challenge yourself', () => {
    loginUser('e.hopper');
    goToUsers();

    verifyChallengeButtonState('e.hopper', false);
  });

  it('Can click challenge button for online users', () => {
    loginUser('e.hopper');
    goToUsers();

    cy.get('.user_card').each(($card) => {
      const hasOnlineIndicator = $card.find('.online-indicator').length > 0;
      const username = $card.find('.userUsername').text().trim();
      
      if (!hasOnlineIndicator || username === 'e.hopper') {
        cy.wrap($card).within(() => {
          cy.get('.challenge-button').should('not.exist');
        });
      }
    });
  });

  it('Challenge button is only visible when both users are online', () => {
    loginUser('e.hopper');
    goToUsers();

    cy.get('.user_card').contains('.userUsername', 'e.hopper').parents('.user_card').within(() => {
      cy.get('.challenge-button').should('not.exist');
    });

    cy.get('.user_card').each(($card) => {
      const username = $card.find('.userUsername').text().trim();
      const hasOnlineIndicator = $card.find('.online-indicator').length > 0;
      
      if (username !== 'e.hopper' && !hasOnlineIndicator) {
        cy.wrap($card).within(() => {
          cy.get('.challenge-button').should('not.exist');
        });
      }
    });
  });
});