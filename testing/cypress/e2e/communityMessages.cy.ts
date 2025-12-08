import {
    loginUser,
    setupTest,
    teardownTest,
    goToCommunities,
    goToCommunityMessages,
    viewCommunityCard,
    logoutUser,
} from '../support/helpers';

describe("Cypress Tests for Community Messages", () => {

    beforeEach(() => {
        setupTest();
    });

    afterEach(() => {
        teardownTest();
    });

    it('adds user to community chat upon joining community, including Chat button option in community page', () => {
        loginUser('e.hopper', 'securePass123!');

        // no access to Microsoft community chat before joining
        goToCommunityMessages();
        cy.contains('Microsoft').should('not.exist');
        goToCommunities();
        viewCommunityCard('Microsoft');
        cy.contains('Chat').should('not.exist');
        
        // joined Microsoft community
        goToCommunities();
        cy.contains('.community-card-title', 'Microsoft').closest('.community-card').contains('button', 'Join').click();
        
        // has access to Microsoft community chat after joining
        cy.contains('Community Messages').click();
        cy.contains('Microsoft').should('exist');
        goToCommunities();
        viewCommunityCard('Microsoft');
        cy.contains('Chat').should('exist');
    });

    it('removes a user from community chat upon leaving community, including removal of Chat button option in community page', () => {
        loginUser('e.hopper', 'securePass123!');

        // access to Microsoft community chat before leaving
        goToCommunities();
        cy.contains('.community-card-title', 'Microsoft').closest('.community-card').contains('button', 'Join').click();
        goToCommunityMessages();
        cy.contains('Microsoft').should('exist');
        goToCommunities();
        viewCommunityCard('Microsoft');
        cy.contains('Chat').should('exist');

        // left Microsoft community
        goToCommunities();
        cy.contains('.community-card-title', 'Microsoft').closest('.community-card').contains('button', 'Leave').click();
        
        // lose access to Microsoft community chat after leaving
        cy.contains('Community Messages').click();
        cy.contains('Microsoft').should('not.exist');
        goToCommunities();
        viewCommunityCard('Microsoft');
        cy.contains('Chat').should('not.exist');
    });

    it('users can post messages in the community chat, visible to all members in that community', () => {
        loginUser('e.hopper', 'securePass123!');

        // sent message in HubSpot community chat
        goToCommunityMessages();
        const messageText = 'Hello, this is a test message to Community HubSpot!';
        cy.contains('HubSpot').click();
        cy.get('.community-message-textbox').type(messageText);
        cy.get('.send-button').click();
        cy.get('.messages-container').should('contain', messageText);

        // log in as another user who is also a member of HubSpot community
        logoutUser();
        loginUser('w.byers', 'strongP@ss234');
        
        // verify that the sent message is visible to other community members
        goToCommunityMessages();
        cy.contains('HubSpot').click();
        cy.get('.messages-container').should('contain', messageText);

        // send reply
        const replyText = 'Hey! Welcome to the HubSpot community!';
        cy.get('.community-message-textbox').type(replyText);
        cy.get('.send-button').click();
        cy.get('.messages-container').should('contain', replyText);
        cy.get('.messages-container').should('contain', messageText);
    });
});