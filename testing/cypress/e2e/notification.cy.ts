import {
    setupTest,
    teardownTest,
    loginUser,
    createQuestion,
    goToAnswerQuestion,
    createAnswer,
    goToCommunities,
    createCommunity,
    viewCommunityCard,
    goToQuestions,
} from '../support/helpers';

const expectNotification = (text: string) => {
    cy.get('.notifications-wrapper .notification-card')
        .should('exist')
        .contains(text);
};

describe("Cypress Tests for Notifications", () => {

    beforeEach(() => {
        setupTest();
    });

    afterEach(() => {
        teardownTest();
    });

    it("shows notification when the user's question is answered", () => {
        // can't test notification with 2 users, so will just answer own question
        loginUser('e.hopper');
        createQuestion("Test Q Notifs", "Notification body test", "test");
        goToQuestions();
        // answer own question
        goToAnswerQuestion("Test Q Notifs");
        createAnswer("Here is an answer. This is what I think about it");
        expectNotification("e.hopper answered your question");
        expectNotification("Here is an answer. This is what I t");
    });

    it("shows notification when the user receives a direct message", () => {
        // can't test notification with 2 users, so will just DM self
        loginUser('e.hopper');
        cy.contains('Messaging').click();
        cy.contains('Direct Message').click();
        cy.get('#create-chat-svg').click();
        cy.get('.users_list').contains('e.hopper').click();
        cy.get('.create-chat-btn').click();
        cy.get('.message-input .custom-input').type('Hello to myself! This is my test message {enter}');
        
        expectNotification("e.hopper sent you a DM");
        expectNotification("Hello to myself! This is my test me");
    });

    // Admins of communities also recieve notifications when someone joined their community
    // However, this cannot be tested with Cypress since we cannot log in as two different users
    // in the same test to simulate one user creating a community and another user joining it.
    // Thus, this test is omitted. However, the functionality has been manually tested and verified to work as intended

});