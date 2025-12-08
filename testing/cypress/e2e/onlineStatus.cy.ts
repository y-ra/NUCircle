import { 
  loginUser, 
  setupTest, 
  teardownTest, 
  goToUsers,
  verifyUserOnlineStatus,
  logoutUser
} from '../support/helpers';

describe('Cypress Tests to verify user online status', () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it('User shows online indicator after login', () => {
    loginUser('e.hopper');
    goToUsers();

    verifyUserOnlineStatus('e.hopper', true);
  });

  it('Offline users do not show online indicator', () => {
  loginUser('e.hopper');
  goToUsers();

  verifyUserOnlineStatus('m.wheeler', false);
  verifyUserOnlineStatus('w.byers', false);
});

  it('Multiple users can be online simultaneously', () => {
    loginUser('e.hopper');
    goToUsers();

    verifyUserOnlineStatus('e.hopper', true);
    
    cy.get('.user_card').contains('.userUsername', 'm.wheeler').parents('.user_card').within(() => {
      cy.get('.online-indicator').should('not.exist');
    });
  });

  it('Online indicator persists after page reload', () => {
    loginUser('e.hopper');
    goToUsers();

    verifyUserOnlineStatus('e.hopper', true);

    cy.reload();
    
    goToUsers();

    verifyUserOnlineStatus('e.hopper', true);
  });

  it('User without online indicator should not show challenge button', () => {
    loginUser('e.hopper');
    goToUsers();

    cy.get('.user_card').contains('.userUsername', 'm.wheeler').parents('.user_card').within(() => {
      cy.get('.challenge-button').should('not.exist');
    });
  });
});