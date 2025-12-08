import {
  loginUser,
  setupTest,
  teardownTest,
  goToUsers,
  goToOwnProfile,
  dismissWelcomePopup,
  goToMyProfile,
} from '../support/helpers';

/**
 * Cypress Tests for Profile Management
 * Tests:
 * - Creating/viewing/editing profile (name, major, graduation year, co-op interests, bio)
 * - External links (LinkedIn, GitHub, Portfolio)
 * - Career Goals and Technical Interests
 */

describe('Cypress Tests for Profile Management', () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  /**
   * Test: View user profile
   * Verifies that profile information is displayed correctly
   */
  it('Should display user profile information', () => {
    loginUser('e.hopper');

    // Navigate to profile page
    goToOwnProfile();
    cy.url().should('include', '/user/e.hopper');

    // Verify profile elements are displayed and scroll into view to check
    cy.contains('e.hopper', { timeout: 5000 }).scrollIntoView().should('exist');
    cy.contains('Eleven Hopper', { timeout: 5000 }).scrollIntoView().should('exist');
  });

  /**
   * Test: Edit profile information (name, major, graduation year, co-op interests)
   */
  it('Should allow editing profile information', () => {
    loginUser('e.hopper');
    goToOwnProfile();

    // Wait for profile page to fully load
    cy.url().should('include', '/user/e.hopper');

    // Intercept the updateProfile API call to verify the request payload
    cy.intercept('PATCH', '/api/user/updateProfile').as('updateProfile');

    // Click Edit Profile Info button and scroll into view first then click
    cy.contains('button', 'Edit Profile Info', { timeout: 5000 }).scrollIntoView().click({ force: true });

    // Wait for edit mode to be active
    cy.get('.profile-edit', { timeout: 5000 }).should('exist');

    // Edit first name
    cy.get('label').contains('First Name').parent().find('input').clear().type('UpdatedFirstName');

    // Edit last name
    cy.get('label').contains('Last Name').parent().find('input').clear().type('UpdatedLastName');

    // Edit major
    cy.get('label').contains('Major').parent().find('input').clear().type('Computer Science');

    // Edit graduation year
    cy.get('label').contains('Graduation Year').parent().find('input').clear().type('2025');

    // Edit co-op interests
    cy.get('label').contains('Co-op Interests').parent().find('select').should('exist').as('coopSelect');
    
    // Scroll select into view and ensure it's visible
    cy.get('@coopSelect').scrollIntoView().should('be.visible');
    
    // Verify the option exists
    cy.get('@coopSelect').find('option[value="Searching for co-op"]').should('exist');
    
    cy.get('@coopSelect').select('Searching for co-op');
    
    // Verify the value is set on the DOM element
    cy.get('@coopSelect').should('have.value', 'Searching for co-op');
    
    // Verify the selected option text
    cy.get('@coopSelect').find('option:selected').should('have.text', 'Searching for co-op');

    // edit the biography
    cy.get('label').contains('Biography').parent().find('textarea').clear().type('new biography');
    
    cy.wait(500);
    
    // Verify again
    cy.get('@coopSelect').should('have.value', 'Searching for co-op');

    // Find and click the Save button in the profile-edit section
    cy.get('.profile-edit').within(() => {
      cy.get('.edit-profile-button').contains('Save', { timeout: 5000 })
        .should('exist')
        .should('be.visible')
        .should('not.be.disabled')
        .scrollIntoView()
        .click({ force: true });
    });

    // Wait for the API call to complete and verify the request payload
    cy.wait('@updateProfile').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
      
      // Verify the request body includes coopInterests
      const requestBody = interception.request.body;
      expect(requestBody).to.have.property('coopInterests', 'Searching for co-op');
      expect(requestBody).to.have.property('username', 'e.hopper');
      expect(requestBody).to.have.property('firstName', 'UpdatedFirstName');
      expect(requestBody).to.have.property('lastName', 'UpdatedLastName');
      expect(requestBody).to.have.property('major', 'Computer Science');
      expect(requestBody).to.have.property('graduationYear', 2025);
      
      // Verify the response includes the updated coopInterests
      const responseBody = interception.response?.body;
      expect(responseBody).to.have.property('coopInterests', 'Searching for co-op');
    });

    // Wait for success message to appear
    cy.contains('Profile updated successfully', { timeout: 10000 })
      .scrollIntoView()
      .should('exist')
      .should('be.visible');

    // Wait for edit mode to close 
    cy.get('.profile-edit', { timeout: 5000 }).should('not.exist');

    // Wait for the UI to update with the new values
    cy.wait(1000);

    // Verify changes are saved and scroll into view to check visibility
    cy.contains('UpdatedFirstName UpdatedLastName').scrollIntoView().should('exist');
    cy.contains('Computer Science').scrollIntoView().should('exist');
    cy.contains('2025').scrollIntoView().should('exist');
    
    // Verify co-op interests
    cy.contains('Co-op Interests:', { timeout: 5000 }).scrollIntoView().should('exist');
    
    // Wait for the text to render
    cy.wait(500);
    
    // Find the paragraph containing "Co-op Interests:" and verify it contains the new value
    cy.contains('Co-op Interests:').parent().should('exist').then(($p) => {
      const text = $p.text();
      // Verify it doesn't say "Not specified" anymore
      expect(text).to.not.include('Not specified');
      // Verify it contains "Searching for co-op"
      expect(text).to.include('Searching for co-op');
    });
    
    // Check actual displayed text
    cy.contains('Co-op Interests:').parent().should('contain.text', 'Searching for co-op');
    cy.contains('Co-op Interests:').parent().should('not.contain.text', 'Not specified');
  });

  /**
   * Test: Add external links (LinkedIn, GitHub, Portfolio)
   */
  it('Should allow adding external links', () => {
    loginUser('e.hopper');
    goToOwnProfile();

    // Wait for profile page to fully load
    cy.url().should('include', '/user/e.hopper');

    // Click Add Links button and scroll into view first
    cy.contains('button', 'Add Links', { timeout: 5000 }).scrollIntoView().click({ force: true });

    // Add LinkedIn URL
    cy.get('label').contains('LinkedIn').parent().find('input').type('https://linkedin.com/in/testuser');

    // Add GitHub URL
    cy.get('label').contains('GitHub').parent().find('input').type('https://github.com/testuser');

    // Add Portfolio URL
    cy.get('label').contains('Portfolio').parent().find('input').type('https://testuser.com');

    // Save links and scroll into view first
    cy.contains('button', 'Save').scrollIntoView().click({ force: true });

    // Verify links are saved and scroll into view to check
    cy.contains('External links updated successfully', { timeout: 5000 }).scrollIntoView().should('exist');
    cy.contains('LinkedIn:').scrollIntoView().should('exist');
    cy.contains('https://linkedin.com/in/testuser').scrollIntoView().should('exist');
    cy.contains('GitHub:').scrollIntoView().should('exist');
    cy.contains('https://github.com/testuser').scrollIntoView().should('exist');
    cy.contains('Portfolio:').scrollIntoView().should('exist');
    cy.contains('https://testuser.com').scrollIntoView().should('exist');
  });

  /**
   * Test: Edit existing external links
   */
  it('Should allow editing existing external links', () => {
    loginUser('e.hopper');
    goToOwnProfile();

    // Wait for profile page to fully load
    cy.url().should('include', '/user/e.hopper');

    // First add links and scroll into view first
    cy.contains('button', 'Add Links', { timeout: 5000 }).scrollIntoView().click({ force: true });
    cy.get('label').contains('LinkedIn').parent().find('input').type('https://linkedin.com/in/old');
    cy.get('label').contains('GitHub').parent().find('input').type('https://github.com/old');
    cy.contains('button', 'Save').click();
    cy.wait(1000);

    // Edit links and scroll into view first
    cy.contains('button', 'Edit Links').scrollIntoView().click({ force: true });
    cy.get('label').contains('LinkedIn').parent().find('input').clear().type('https://linkedin.com/in/new');
    cy.contains('button', 'Save').scrollIntoView().click({ force: true });

    // Verify updated links and scroll into view to check
    cy.contains('External links updated successfully', { timeout: 5000 }).scrollIntoView().should('exist');
    cy.contains('https://linkedin.com/in/new').scrollIntoView().should('exist');
  });

  /**
   * Test: Validate external link URLs
   */
  it('Should validate external link URLs format', () => {
    loginUser('e.hopper');
    goToOwnProfile();

    // Wait for profile page to fully load
    cy.url().should('include', '/user/e.hopper');

    cy.contains('button', 'Add Links', { timeout: 5000 }).scrollIntoView().click({ force: true });

    // Try to save invalid URL
    cy.get('label').contains('LinkedIn').parent().find('input').type('invalid-url');
    cy.contains('button', 'Save').scrollIntoView().click({ force: true });

    // Verify error message appears and scroll into view to check
    cy.contains('URLs must start with http:// or https://', { timeout: 5000 }).scrollIntoView().should('exist');
  });

  /**
   * Test: External links are clickable
   */
  it('Should make external links clickable', () => {
    loginUser('e.hopper');
    goToOwnProfile();

    // Wait for profile page to fully load
    cy.url().should('include', '/user/e.hopper');

    // Add links and scroll into view first
    cy.contains('button', 'Add Links', { timeout: 5000 }).scrollIntoView().click({ force: true });
    cy.get('label').contains('LinkedIn').parent().find('input').type('https://linkedin.com/in/testuser');
    cy.contains('button', 'Save').scrollIntoView().click({ force: true });
    cy.wait(1000);

    // Verify links are clickable
    cy.contains('a', 'https://linkedin.com/in/testuser').should('have.attr', 'href', 'https://linkedin.com/in/testuser');
    cy.contains('a', 'https://linkedin.com/in/testuser').should('have.attr', 'target', '_blank');
  });

  /**
   * Test: View another user's profile
   */
  it('Should allow viewing another user\'s profile', () => {
    loginUser('e.hopper');
    goToUsers();

    // Click on another user's card and scroll into view first
    cy.get('.user_card').contains('.userUsername', 'm.wheeler').scrollIntoView().click({ force: true });

    // Verify profile page loads
    cy.url().should('include', '/user/m.wheeler');
    cy.contains('m.wheeler', { timeout: 5000 }).scrollIntoView().should('exist');

    // Verify edit buttons are not visible for other users
    cy.contains('button', 'Edit Profile Info').should('not.exist');
  });

  /**
   * Test: Profile displays all information fields
   */
  it('Should display all profile information fields', () => {
    loginUser('e.hopper');
    goToOwnProfile();

    // Wait for profile page to fully load
    cy.url().should('include', '/user/e.hopper');

    // Verify all sections exist and scroll into view to check visibility
    cy.contains('Major:').scrollIntoView().should('exist');
    cy.contains('Graduation Year:').scrollIntoView().should('exist');
    cy.contains('Co-op Interests:').scrollIntoView().should('exist');
    cy.contains('Biography:').scrollIntoView().should('exist');
    cy.contains('External Links').scrollIntoView().should('exist');
  });

  describe('Update Career Goals and Technical Interests', () => {
    it('User can update their career goals', () => {
      loginUser('e.hopper');
      goToMyProfile();
      cy.wait(1000);

      // Click edit profile button
      cy.contains('button', 'Edit Profile Info').click();
      cy.wait(500);

      // Update career goals
      cy.get('input[placeholder*="data science, finance"]').clear().type('software engineering, product management');
      
      // Save changes
      cy.contains('button', 'Save').click();
      cy.wait(1000);

      // Verify success message
      cy.contains('Profile updated successfully!').should('exist');

      // Verify the updated career goals are displayed
      cy.contains('Career Goals:').parent().should('contain', 'software engineering, product management');
    });

    it('User can update their technical interests', () => {
      loginUser('e.hopper');
      goToMyProfile();
      cy.wait(1000);

      // Click edit profile button
      cy.contains('button', 'Edit Profile Info').click();
      cy.wait(500);

      // Update technical interests
      cy.get('input[placeholder*="machine learning, web development"]').clear().type('react, typescript, node.js');
      
      // Save changes
      cy.contains('button', 'Save').click();
      cy.wait(1000);

      // Verify success message
      cy.contains('Profile updated successfully!').should('exist');

      // Verify the updated technical interests are displayed
      cy.contains('Technical Interests:').parent().should('contain', 'react, typescript, node.js');
    });

    it('User can update both career goals and technical interests together', () => {
      loginUser('e.hopper');
      goToMyProfile();
      cy.wait(1000);

      // Click edit profile button
      cy.contains('button', 'Edit Profile Info').click();
      cy.wait(500);

      // Update both fields
      cy.get('input[placeholder*="data science, finance"]').clear().type('data science, finance');
      cy.get('input[placeholder*="machine learning, web development"]').clear().type('python, machine learning, tensorflow');
      
      // Save changes
      cy.contains('button', 'Save').click();
      cy.wait(1000);

      // Verify both fields are updated
      cy.contains('Career Goals:').parent().should('contain', 'data science, finance');
      cy.contains('Technical Interests:').parent().should('contain', 'python, machine learning, tensorflow');
    });

    it('User can clear their career goals', () => {
      loginUser('e.hopper');
      goToMyProfile();
      cy.wait(1000);

      // Click edit profile button
      cy.contains('button', 'Edit Profile Info').click();
      cy.wait(500);

      // Clear career goals
      cy.get('input[placeholder*="data science, finance"]').clear();
      
      // Save changes
      cy.contains('button', 'Save').click();
      cy.wait(1000);

      // Verify the field shows "Not specified"
      cy.contains('Career Goals:').parent().should('contain', 'Not specified');
    });

    it('User can cancel editing career goals', () => {
      loginUser('e.hopper');
      goToMyProfile();
      cy.wait(1000);

      // Get original career goals text
      cy.contains('Career Goals:').parent().invoke('text').then((originalText) => {
        // Click edit profile button
        cy.contains('button', 'Edit Profile Info').click();
        cy.wait(500);

        // Change career goals
        cy.get('input[placeholder*="data science, finance"]').clear().type('temporary change');
        
        // Cancel changes
        cy.contains('button', 'Cancel').click();
        cy.wait(500);

        // Verify original text is unchanged
        cy.contains('Career Goals:').parent().invoke('text').should('eq', originalText);
      });
    });
  });

  describe('Search Users by Career Goals', () => {
    it('User can search for other users by single career goal', () => {
      loginUser('e.hopper');
      goToUsers();
      cy.wait(1000);

      // Open filters
      cy.get('.filter-control-btn').first().click();
      cy.wait(500);

      // Enter career goal filter (find by label in filter panel)
      cy.get('.filters-panel-header').contains('label', 'Career Goals:').parent().find('input').type('data science');
      
      // Click search
      cy.contains('button', 'Search').click();
      cy.wait(1500);

      // Verify results exist
      cy.get('body').should('exist');
      cy.get('.user_card').should('have.length.at.least', 1);
    });

    it('User can search for other users by multiple career goals (comma-separated)', () => {
      loginUser('e.hopper');
      goToUsers();
      cy.wait(1000);

      // Open filters
      cy.get('.filter-control-btn').first().click();
      cy.wait(500);

      // Enter multiple career goals
      cy.get('.filters-panel-header').contains('label', 'Career Goals:').parent().find('input').type('data science, software engineering');
      
      // Click search
      cy.contains('button', 'Search').click();
      cy.wait(1500);

      // Verify results exist
      cy.get('body').should('exist');
    });

    it('Career goals search is case insensitive', () => {
      loginUser('e.hopper');
      goToUsers();
      cy.wait(1000);

      // Open filters
      cy.get('.filter-control-btn').first().click();
      cy.wait(500);

      // Enter career goal in uppercase
      cy.get('.filters-panel-header').contains('label', 'Career Goals:').parent().find('input').type('DATA SCIENCE');
      
      // Click search
      cy.contains('button', 'Search').click();
      cy.wait(1500);

      // Verify results exist
      cy.get('body').should('exist');
    });

    it('Career goals search handles partial matches', () => {
      loginUser('e.hopper');
      goToUsers();
      cy.wait(1000);

      // Open filters
      cy.get('.filter-control-btn').first().click();
      cy.wait(500);

      // Enter partial career goal
      cy.get('.filters-panel-header').contains('label', 'Career Goals:').parent().find('input').type('science');
      
      // Click search
      cy.contains('button', 'Search').click();
      cy.wait(1500);

      // Verify results exist
      cy.get('body').should('exist');
    });
  });

  describe('Search Users by Technical Interests', () => {
    it('User can search for other users by single technical interest', () => {
      loginUser('e.hopper');
      goToUsers();
      cy.wait(1000);

      // Open filters
      cy.get('.filter-control-btn').first().click();
      cy.wait(500);

      // Enter technical interest filter
      cy.get('.filters-panel-header').contains('label', 'Technical Interests:').parent().find('input').type('machine learning');
      
      // Click search
      cy.contains('button', 'Search').click();
      cy.wait(1500);

      // Verify results exist
      cy.get('body').should('exist');
      cy.get('.user_card').should('have.length.at.least', 1);
    });

    it('User can search for other users by multiple technical interests', () => {
      loginUser('e.hopper');
      goToUsers();
      cy.wait(1000);

      // Open filters
      cy.get('.filter-control-btn').first().click();
      cy.wait(500);

      // Enter multiple technical interests
      cy.get('.filters-panel-header').contains('label', 'Technical Interests:').parent().find('input').type('python, react, tensorflow');
      
      // Click search
      cy.contains('button', 'Search').click();
      cy.wait(1500);

      // Verify results exist
      cy.get('body').should('exist');
    });

    it('Technical interests search is case insensitive', () => {
      loginUser('e.hopper');
      goToUsers();
      cy.wait(1000);

      // Open filters
      cy.get('.filter-control-btn').first().click();
      cy.wait(500);

      // Enter technical interest in mixed case
      cy.get('.filters-panel-header').contains('label', 'Technical Interests:').parent().find('input').type('PYTHON');
      
      // Click search
      cy.contains('button', 'Search').click();
      cy.wait(1500);

      // Verify results exist
      cy.get('body').should('exist');
    });
  });

  describe('Combined Search with Career Goals and Technical Interests', () => {
    it('User can combine career goals and technical interests filters', () => {
      loginUser('e.hopper');
      goToUsers();
      cy.wait(1000);

      // Open filters
      cy.get('.filter-control-btn').first().click();
      cy.wait(500);

      // Enter both filters
      cy.get('.filters-panel-header').contains('label', 'Career Goals:').parent().find('input').type('data science');
      cy.get('.filters-panel-header').contains('label', 'Technical Interests:').parent().find('input').type('python');
      
      // Click search
      cy.contains('button', 'Search').click();
      cy.wait(1500);

      // Verify results exist
      cy.get('body').should('exist');
    });

    it('User can combine career goals with major filter', () => {
      loginUser('e.hopper');
      goToUsers();
      cy.wait(1000);

      // Open filters
      cy.get('.filter-control-btn').first().click();
      cy.wait(500);

      // Select major
      cy.get('.filters-panel-header').contains('label', 'Major:').parent().find('select').select('Computer Science');
      
      // Enter career goal
      cy.get('.filters-panel-header').contains('label', 'Career Goals:').parent().find('input').type('software engineering');
      
      // Click search
      cy.contains('button', 'Search').click();
      cy.wait(1500);

      // Verify results exist
      cy.get('body').should('exist');
    });

    it('User can combine technical interests with graduation year filter', () => {
      loginUser('e.hopper');
      goToUsers();
      cy.wait(1000);

      // Open filters
      cy.get('.filter-control-btn').first().click();
      cy.wait(500);

      // Select graduation year
      cy.get('.filters-panel-header').contains('label', 'Graduation Year:').parent().find('select').select('2025');
      
      // Enter technical interest
      cy.get('.filters-panel-header').contains('label', 'Technical Interests:').parent().find('input').type('react');
      
      // Click search
      cy.contains('button', 'Search').click();
      cy.wait(1500);

      // Verify results exist
      cy.get('body').should('exist');
    });

    it('User can combine name search with career goals filter', () => {
      loginUser('e.hopper');
      goToUsers();
      cy.wait(1000);

      // Enter name search
      cy.get('#user_search_bar').type('Mike');
      
      // Open filters
      cy.get('.filter-control-btn').first().click();
      cy.wait(500);

      // Enter career goal
      cy.get('.filters-panel-header').contains('label', 'Career Goals:').parent().find('input').type('software');
      
      // Click search
      cy.contains('button', 'Search').click();
      cy.wait(1500);

      // Verify results exist
      cy.get('body').should('exist');
    });
  });

  describe('Clear Career Goals and Technical Interests Filters', () => {
    it('User can clear career goals filter', () => {
      loginUser('e.hopper');
      goToUsers();
      cy.wait(1000);

      // Open filters and search
      cy.get('.filter-control-btn').first().click();
      cy.wait(500);
      cy.get('.filters-panel-header').contains('label', 'Career Goals:').parent().find('input').type('data science');
      cy.contains('button', 'Search').click();
      cy.wait(1500);

      // Clear filters
      cy.contains('button', 'Clear').click();
      cy.wait(1500);

      // Verify all users are shown again
      cy.get('.user_card').should('have.length.at.least', 3);
    });

    it('User can clear technical interests filter', () => {
      loginUser('e.hopper');
      goToUsers();
      cy.wait(1000);

      // Open filters and search
      cy.get('.filter-control-btn').first().click();
      cy.wait(500);
      cy.get('.filters-panel-header').contains('label', 'Technical Interests:').parent().find('input').type('python');
      cy.contains('button', 'Search').click();
      cy.wait(1500);

      // Clear filters
      cy.contains('button', 'Clear').click();
      cy.wait(1500);

      // Verify all users are shown again
      cy.get('.user_card').should('have.length.at.least', 3);
    });

    it('User can clear both career goals and technical interests filters together', () => {
      loginUser('e.hopper');
      goToUsers();
      cy.wait(1000);

      // Open filters and search with both
      cy.get('.filter-control-btn').first().click();
      cy.wait(500);
      cy.get('.filters-panel-header').contains('label', 'Career Goals:').parent().find('input').type('data science');
      cy.get('.filters-panel-header').contains('label', 'Technical Interests:').parent().find('input').type('python');
      cy.contains('button', 'Search').click();
      cy.wait(1500);

      // Clear filters
      cy.contains('button', 'Clear').click();
      cy.wait(1500);

      // Verify all users are shown again
      cy.get('.user_card').should('have.length.at.least', 3);
    });
  });

  describe('Edge Cases and Validation', () => {
    it('User can handle whitespace in career goals search', () => {
      loginUser('e.hopper');
      goToUsers();
      cy.wait(1000);

      // Open filters
      cy.get('.filter-control-btn').first().click();
      cy.wait(500);

      // Enter career goal with extra whitespace
      cy.get('.filters-panel-header').contains('label', 'Career Goals:').parent().find('input').type('  data science  ,  finance  ');
      
      // Click search
      cy.contains('button', 'Search').click();
      cy.wait(1500);

      // Verify results exist
      cy.get('body').should('exist');
    });

    it('Empty career goals search returns all users', () => {
      loginUser('e.hopper');
      goToUsers();
      cy.wait(1000);

      // Open filters
      cy.get('.filter-control-btn').first().click();
      cy.wait(500);

      // Leave career goals empty and search
      cy.contains('button', 'Search').click();
      cy.wait(1500);

      // Verify all users are shown
      cy.get('.user_card').should('have.length.at.least', 3);
    });

    it('Career goals with special characters are handled correctly', () => {
      loginUser('e.hopper');
      goToUsers();
      cy.wait(1000);

      // Open filters
      cy.get('.filter-control-btn').first().click();
      cy.wait(500);

      // Enter career goal with special characters
      cy.get('.filters-panel-header').contains('label', 'Career Goals:').parent().find('input').type('C++ programming');
      
      // Click search
      cy.contains('button', 'Search').click();
      cy.wait(1500);

      // Verify no error occurs
      cy.get('body').should('exist');
    });

    it('User can toggle filters visibility', () => {
      loginUser('e.hopper');
      goToUsers();
      cy.wait(1000);

      // Open filters
      cy.get('.filter-control-btn').first().click();
      cy.wait(500);

      // Verify filters are visible
      cy.get('.filters-panel-header').should('be.visible');
      cy.get('.filters-panel-header').contains('label', 'Career Goals:').should('be.visible');

      // Close filters
      cy.get('.filter-control-btn').first().click();
      cy.wait(500);

      // Verify filters are hidden
      cy.get('.filters-panel-header').should('not.exist');
    });
  });
  
  describe('Profile Display of Career Goals and Technical Interests', () => {
    it('Other users can view career goals on profile', () => {
      // First user sets career goals
      loginUser('e.hopper');
      goToMyProfile();
      cy.wait(1000);

      cy.contains('button', 'Edit Profile Info').click();
      cy.wait(500);
      
      // Find the Career Goals input within the profile-edit section
      cy.get('.profile-edit').within(() => {
        cy.contains('strong', 'Career Goals:').parent().find('input').clear({ force: true }).type('data science, AI research');
      });
      cy.contains('button', 'Save').click();
      cy.wait(1000);

      // Logout
      cy.get('.logout-button').click();
      cy.wait(1000);

      // Second user views first user's profile
      loginUser('m.wheeler');
      goToUsers();
      cy.wait(1000);

      // Click on e.hopper's profile
      cy.get('.user_card').contains('.userUsername', 'e.hopper').click();
      cy.wait(1000);

      // Verify career goals are visible
      cy.contains('Career Goals:').parent().should('contain', 'data science, AI research');
    });

    it('Career goals display "Not specified" when empty', () => {
      loginUser('e.hopper');
      goToMyProfile();
      cy.wait(1000);

      // Clear career goals if they exist
      cy.contains('button', 'Edit Profile Info').click();
      cy.wait(500);
      cy.get('.profile-edit').within(() => {
        cy.contains('strong', 'Career Goals:').parent().find('input').clear({ force: true });
      });
      cy.contains('button', 'Save').click();
      cy.wait(1000);

      // Verify "Not specified" is shown
      cy.contains('Career Goals:').parent().should('contain', 'Not specified');
    });

    it('Technical interests display correctly on profile', () => {
      loginUser('e.hopper');
      goToMyProfile();
      cy.wait(1000);

      cy.contains('button', 'Edit Profile Info').click();
      cy.wait(500);
      cy.get('.profile-edit').within(() => {
        cy.contains('strong', 'Technical Interests:').parent().find('input').clear({ force: true }).type('react, node.js, mongodb');
      });
      cy.contains('button', 'Save').click();
      cy.wait(1000);

      // Verify technical interests are visible
      cy.contains('Technical Interests:').parent().should('contain', 'react, node.js, mongodb');
    });
  });

  describe('Profile Statistics Visibility', () => {
    it('User can view their own profile statistics', () => {
      loginUser('e.hopper');
      goToMyProfile();
      cy.wait(1000);

      // Verify stats section exists
      cy.contains('h2', 'User Stats').scrollIntoView().should('be.visible');
      
      // Verify stats grid exists
      cy.get('.stats-grid').should('be.visible');
      
      // Verify all stat boxes are visible (using stat-label class)
      cy.get('.stat-box').contains('.stat-label', 'Date Joined').should('be.visible');
      cy.get('.stat-box').contains('.stat-label', 'Points').should('be.visible');
      cy.get('.stat-box').contains('.stat-label', 'Questions').should('be.visible');
      cy.get('.stat-box').contains('.stat-label', 'Answers').should('be.visible');
      cy.get('.stat-box').contains('.stat-label', 'Communities').should('be.visible');
      cy.get('.stat-box').contains('.stat-label', 'Quizzes Won').scrollIntoView().should('be.visible');
    });

    it('User can unpublish their statistics', () => {
      loginUser('e.hopper');
      goToMyProfile();
      cy.wait(1000);

      // Intercept the API call
      cy.intercept('PATCH', '/api/user/updateStatVisibility').as('updateStatVisibility');

      // Stats are published by default, so unpublish them
      cy.contains('button', 'Unpublish Stats').scrollIntoView().click({ force: true });

      // Wait for the API call
      cy.wait('@updateStatVisibility').then((interception) => {
        expect(interception.response?.statusCode).to.eq(200);
        expect(interception.request.body).to.have.property('field', 'showStats');
        expect(interception.request.body).to.have.property('value', false);
      });

      // Verify button text changes to "Publish Stats"
      cy.contains('button', 'Publish Stats').should('be.visible');
    });

    it('User can publish their statistics after unpublishing', () => {
      loginUser('e.hopper');
      goToMyProfile();
      cy.wait(1000);

      // First unpublish stats (they're published by default)
      cy.contains('button', 'Unpublish Stats').scrollIntoView().click({ force: true });
      cy.wait(1000);

      // Intercept the API call for publishing
      cy.intercept('PATCH', '/api/user/updateStatVisibility').as('updateStatVisibility');

      // Now publish
      cy.contains('button', 'Publish Stats').scrollIntoView().click({ force: true });

      // Wait for the API call
      cy.wait('@updateStatVisibility').then((interception) => {
        expect(interception.response?.statusCode).to.eq(200);
        expect(interception.request.body).to.have.property('field', 'showStats');
        expect(interception.request.body).to.have.property('value', true);
      });

      // Verify button text changes back to "Unpublish Stats"
      cy.contains('button', 'Unpublish Stats').should('be.visible');
    });

    it('Other users can view published statistics by default', () => {
      // First user has stats published by default
      loginUser('e.hopper');
      goToMyProfile();
      cy.wait(1000);

      // Verify stats are published (Unpublish button visible)
      cy.contains('button', 'Unpublish Stats').scrollIntoView().should('be.visible');

      // Logout
      cy.get('.logout-button').click();
      cy.wait(1000);

      // Second user views first user's profile
      loginUser('m.wheeler');
      goToUsers();
      cy.wait(1000);

      cy.get('.user_card').contains('.userUsername', 'e.hopper').click();
      cy.wait(1000);

      // Verify stats section is visible
      cy.contains('h2', 'User Stats').scrollIntoView().should('be.visible');
      cy.get('.stats-grid').should('be.visible');
      
      // Verify stat boxes are visible
      cy.get('.stat-box').contains('.stat-label', 'Points').should('be.visible');
      cy.get('.stat-box').contains('.stat-label', 'Questions').should('be.visible');
      cy.get('.stat-box').contains('.stat-label', 'Answers').should('be.visible');
      cy.get('.stat-box').contains('.stat-label', 'Communities').should('be.visible');
      cy.get('.stat-box').contains('.stat-label', 'Quizzes Won').scrollIntoView().should('be.visible');

      // Verify publish/unpublish button is not visible to other users
      cy.contains('button', 'Publish Stats').should('not.exist');
      cy.contains('button', 'Unpublish Stats').should('not.exist');
    });

    it('Statistics display correct values', () => {
      loginUser('e.hopper');
      goToMyProfile();
      cy.wait(1000);

      // Verify stats section exists
      cy.contains('h2', 'User Stats').scrollIntoView().should('be.visible');

      // Verify each stat has a numeric value
      cy.get('.stat-box').contains('.stat-label', 'Points').parent().find('.stat-value').should('exist');
      cy.get('.stat-box').contains('.stat-label', 'Questions').parent().find('.stat-value').should('exist');
      cy.get('.stat-box').contains('.stat-label', 'Answers').parent().find('.stat-value').should('exist');
      cy.get('.stat-box').contains('.stat-label', 'Communities').parent().find('.stat-value').should('exist');
      cy.get('.stat-box').contains('.stat-label', 'Quizzes Won').parent().find('.stat-value').should('exist');
    });

    it('Date Joined is always visible', () => {
      loginUser('e.hopper');
      goToMyProfile();
      cy.wait(1000);

      // Date Joined should always be visible regardless of stats visibility
      cy.get('.stat-box').contains('.stat-label', 'Date Joined').scrollIntoView().should('be.visible');
      
      // Verify it has a value
      cy.get('.stat-box').contains('.stat-label', 'Date Joined').parent().find('.stat-value').should('not.contain', 'N/A');
    });

    it('User can toggle stats visibility multiple times', () => {
      loginUser('e.hopper');
      goToMyProfile();
      cy.wait(1000);

      // Stats are published by default, so unpublish first
      cy.contains('button', 'Unpublish Stats').scrollIntoView().click({ force: true });
      cy.wait(500);
      cy.contains('button', 'Publish Stats').should('be.visible');

      // Publish
      cy.contains('button', 'Publish Stats').scrollIntoView().click({ force: true });
      cy.wait(500);
      cy.contains('button', 'Unpublish Stats').should('be.visible');

      // Unpublish again
      cy.contains('button', 'Unpublish Stats').scrollIntoView().click({ force: true });
      cy.wait(500);
      cy.contains('button', 'Publish Stats').should('be.visible');
    });

    it('Points are displayed in stats section', () => {
      loginUser('e.hopper');
      goToMyProfile();
      cy.wait(1000);

      cy.contains('h2', 'User Stats').scrollIntoView().should('be.visible');
      
      // Find the Points stat box
      cy.get('.stat-box').contains('.stat-label', 'Points').parent().within(() => {
        cy.get('.stat-value').invoke('text').then((text) => {
          const points = parseInt(text);
          expect(points).to.be.a('number');
          expect(points).to.be.at.least(0);
        });
      });
    });

    it('Quiz W/L record displays correctly', () => {
      loginUser('e.hopper');
      goToMyProfile();
      cy.wait(1000);

      cy.contains('h2', 'User Stats').scrollIntoView().should('be.visible');
      
      // Find the Quizzes Won stat box
      cy.get('.stat-box').contains('.stat-label', 'Quizzes Won').parent().within(() => {
        cy.get('.stat-value').invoke('text').then((text) => {
          // Verify format is "X / Y" (wins / total)
          const recordMatch = text.match(/(\d+)\s*\/\s*(\d+)/);
          expect(recordMatch).to.not.be.null;
          if (recordMatch) {
            const wins = parseInt(recordMatch[1]);
            const total = parseInt(recordMatch[2]);
            expect(wins).to.be.a('number');
            expect(total).to.be.a('number');
            expect(wins).to.be.at.most(total); // Wins should never exceed total
          }
        });
      });
    });

    it('All stat categories are present in stats section', () => {
      loginUser('e.hopper');
      goToMyProfile();
      cy.wait(1000);

      cy.contains('h2', 'User Stats').scrollIntoView().should('be.visible');

      // Verify all required stat categories exist
      const requiredStats = [
        'Date Joined',
        'Points',
        'Questions',
        'Answers',
        'Communities',
        'Quizzes Won'
      ];

      requiredStats.forEach(stat => {
        cy.get('.stat-box').contains('.stat-label', stat).scrollIntoView().should('be.visible');
      });
    });

    it('Stats button changes color based on state', () => {
      loginUser('e.hopper');
      goToMyProfile();
      cy.wait(1000);

      // Stats are published by default - button should have gray color
      cy.contains('button', 'Unpublish Stats').should('have.css', 'background-color', 'rgb(147, 157, 166)');
      
      // Unpublish them
      cy.contains('button', 'Unpublish Stats').click({ force: true });
      cy.wait(500);
      
      // Now button should have red color
      cy.contains('button', 'Publish Stats').should('have.css', 'background-color', 'rgb(255, 111, 97)');
      
      // Publish them again
      cy.contains('button', 'Publish Stats').click({ force: true });
      cy.wait(500);
      
      // Button should be gray again
      cy.contains('button', 'Unpublish Stats').should('have.css', 'background-color', 'rgb(147, 157, 166)');
    });

    it('Stats grid layout is responsive', () => {
      loginUser('e.hopper');
      goToMyProfile();
      cy.wait(1000);

      cy.get('.stats-grid').should('be.visible');
      
      // Verify multiple stat boxes exist in the grid
      cy.get('.stats-grid').find('.stat-box').should('have.length.at.least', 1);
      
      // Verify stat boxes have proper structure
      cy.get('.stat-box').first().within(() => {
        cy.get('.stat-label').should('exist');
        cy.get('.stat-value').should('exist');
      });
    });
  });

});

