import { setupTest, teardownTest, loginUser, addWorkExperience, editWorkExperience } from '../support/helpers';

describe("Cypress Tests for Work Experience", () => {

    beforeEach(() => {
        setupTest();
    });

    afterEach(() => {
        teardownTest();
    });

    it("allows user to add a new work experience", () => {
        loginUser('e.hopper');
        cy.get('.profile-image').click();
        cy.contains("Work Experience");

        addWorkExperience();

        // validate new card appears
        cy.contains("Software Engineering Co-op").should("exist");
        cy.contains("OpenAI").should("exist");
        cy.contains("Co-op").should("exist");
        cy.contains("Boston, MA").should("exist");
    });

    it('shows required field validation if form is incomplete', () => {
        loginUser('e.hopper');
        cy.get('.profile-image').click();
        cy.contains('+ Add').click();

        const requiredFields = [
            { selector: 'input[name="title"]', value: 'Software Engineering Co-op' },
            { selector: 'input[name="company"]', value: 'OpenAI' },
            { selector: 'select[name="type"]', value: 'Co-op' },
            { selector: 'input[name="location"]', value: 'Boston, MA' },
        ];

        requiredFields.forEach((field, index) => {
            cy.get(field.selector).type(field.value);
            cy.contains('Save').click();
            // Form should still be open because submission failed
            cy.get(field.selector).should('exist');
        })
    });

    it('allows user to edit an existing work experience', () => {
        loginUser('e.hopper');
        cy.get('.profile-image').click();
        // Add work experience to edit
        addWorkExperience();

        // edit the work experience
        editWorkExperience('#WE-title-input', 'Updated Title');
        cy.contains("Updated Title").should("exist");
        editWorkExperience('#WE-company-input', 'Updated Company');
        cy.contains("Updated Company").should("exist");
        editWorkExperience('#WE-location-input', 'Cambridge, MA');
        cy.contains("Cambridge, MA").should("exist");
    });

    it('allows user to delete a work experience', () => {
        loginUser('e.hopper');
        cy.get('.profile-image').click();
        addWorkExperience();
        cy.contains("Software Engineering Co-op").should("exist");
        
        cy.get('.work-experience-card').contains('Software Engineering Co-op').parents('.work-experience-card').find('.delete-button').click();
        cy.contains('Are you sure you want to delete this work experience? This action cannot be undone.').should('exist');
        cy.contains('Confirm').click({ force: true });
        cy.contains("Software Engineering Co-op").should("not.exist");
    });
});
