import { setupTest, teardownTest } from '../support/helpers';

describe("Cypress Tests for Login Form", () => {

    beforeEach(() => {
        setupTest();
    });

    afterEach(() => {
        teardownTest();
    });

    it("User logs in with email", () => {
        cy.visit('http://localhost:4530');
        cy.contains('Please login to continue to NUCircle');
        cy.get('#username-input').type('e.hopper@northeastern.edu');
        cy.get('#password-input').type('securePass123!');
        cy.contains('Log in').click();
        // Wait for redirect to home page
        cy.url().should('include', '/home');
    });
    it("User logs in with username only", () => {
        cy.visit('http://localhost:4530');
        cy.contains('Please login to continue to NUCircle');
        cy.get('#username-input').type('e.hopper');
        cy.get('#password-input').type('securePass123!');
        cy.contains('Log in').click();
        // Wait for redirect to home page
        cy.url().should('include', '/home');
    });
});
