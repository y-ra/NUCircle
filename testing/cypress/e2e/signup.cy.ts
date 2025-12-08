import { setupTest, teardownTest } from '../support/helpers';

describe("Cypress Tests for Sign up Form", () => {

    beforeEach(() => {
        setupTest();
        cy.visit('http://localhost:4530/signup');
    });

    afterEach(() => {
        teardownTest();
    });

    it("shows error if non-NU email is used", () => {
        cy.get("#firstName-input").type("John");
        cy.get("#lastName-input").type("Doe");
        cy.get("#username-input").type("test@gmail.com");
        cy.get("#password-input").type("Password1!");
        cy.get("#confirm-password-input").type("Password1!");
        cy.get(".login-button").click();
        cy.contains("Please use a valid Northeastern email").should("exist");
    });
    it("rejects weak passwords with appropriate error messages", () => {
        const weakPasswords = [
            { pwd: "Short1!", err: "Password must contain at least 8 characters" },
            { pwd: "alllowercase1!", err: "Password must contain an uppercase letter" },
            { pwd: "ALLUPPERCASE1!", err: "Password must contain a lowercase letter" },
            { pwd: "NoNumbers!", err: "Password must contain a number" },
            { pwd: "NoSpecialChar1", err: "Password must contain a special character" },
        ];
        cy.get("#firstName-input").type("John");
        cy.get("#lastName-input").type("Doe");
        cy.get("#username-input").type("john.doe@northeastern.edu");

        weakPasswords.forEach(({ pwd, err }) => {
            cy.get("#password-input").clear();
            cy.get("#confirm-password-input").clear();
            cy.get("#password-input").type(pwd);
            cy.get("#confirm-password-input").type(pwd);
            cy.get(".login-button").click();
            cy.contains(err).should("exist");
        });
    });
    it("prevents signup with duplicate email", () => {
        const email = "duplicate@northeastern.edu";

        // first successful signup
        cy.get("#firstName-input").type("John");
        cy.get("#lastName-input").type("Doe");
        cy.get("#username-input").type(email);
        cy.get("#password-input").type("Password1!");
        cy.get("#confirm-password-input").type("Password1!");
        cy.get(".login-button").click();

        // same email again
        cy.visit("http://localhost:4530/signup");
        cy.get("#firstName-input").type("Maya");
        cy.get("#lastName-input").type("Robie");
        cy.get("#username-input").type(email);
        cy.get("#password-input").type("Password1!");
        cy.get("#confirm-password-input").type("Password1!");
        cy.get(".login-button").click();
        cy.contains("This email is already registered").should("exist");
    });
});