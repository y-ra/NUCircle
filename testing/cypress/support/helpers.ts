/**
 * Test utility functions for Cypress tests
 * Provides shared helper functions for common test patterns like authentication, navigation, and data setup
 */

/**
 * Logs in a user by visiting the login page and entering credentials
 * @param username - The username to log in with
 * @param password - The password to log in with (defaults to 'securePass123!')
 */
/**
 * Logs in a user by visiting the login page and entering credentials
 * @param username - The username to log in with
 * @param password - The password to log in with (defaults to 'securePass123!')
 */
export const loginUser = (username: string, password: string = 'securePass123!') => {
  // Intercept the login API call to wait for it to complete
  cy.intercept('POST', '/api/user/login').as('loginRequest');
  
  cy.visit('http://localhost:4530');
  
  // Wait for login page to load
  cy.contains('Please login to continue to NUCircle', { timeout: 10000 }).should('be.visible');
  
  // Fill in username
  cy.get('#username-input', { timeout: 5000 })
    .should('be.visible')
    .clear()
    .type(username);
  
  // Fill in password
  cy.get('#password-input', { timeout: 5000 })
    .should('be.visible')
    .clear()
    .type(password);
  
  // Submit the form
  cy.get('form', { timeout: 5000 }).should('exist');
  cy.get('button.login-button', { timeout: 5000 })
    .should('be.visible')
    .should('contain', 'Log in')
    .scrollIntoView()
    .should('not.be.disabled')
    .click({ force: true });
  
  // Wait for the login API call to complete
  cy.wait('@loginRequest', { timeout: 10000 }).then((interception) => {
    // Check if login was successful (status 200)
    if (interception.response?.statusCode !== 200) {
      // Extract error message from response body & handle different formats
      let errorMsg = 'Unknown error';
      const responseBody = interception.response?.body;
      
      if (responseBody) {
        if (typeof responseBody === 'string') {
          errorMsg = responseBody;
        } else if (typeof responseBody === 'object') {
          errorMsg = responseBody.error || responseBody.message || responseBody.err || JSON.stringify(responseBody);
        }
      }
      
      // Log detailed error information for debugging
      cy.log(`Login API failed with status ${interception.response?.statusCode}`);
      cy.log(`Response body:`, responseBody);
      
      // Check if error message is displayed on page
      cy.get('body').then(($body) => {
        const errorElement = $body.find('.error-message-login');
        if (errorElement.length > 0) {
          const pageError = errorElement.text().trim();
          cy.log(`Login error displayed on page: ${pageError}`);
          if (pageError) {
            errorMsg = pageError;
          }
        }
      });
      
      throw new Error(`Login failed with status ${interception.response?.statusCode}: ${errorMsg}`);
    }
  });
  
  // Wait for redirect
  cy.url({ timeout: 10000 }).should('satisfy', (url) => {
    const isLoggedIn = url.includes('/home') || url === 'http://localhost:4530/' || url === 'http://localhost:4530';
    const isNotLoginPage = !url.includes('/login');
    return isLoggedIn && isNotLoginPage;
  });
  
  // Verify logged in by checking for common elements
  cy.get('body', { timeout: 5000 }).should('exist');
  
  // Wait a bit for the page to fully render
  cy.wait(500);
  
  dismissWelcomePopup();
};

/**
 * Logs in a user assuming a prior login has occurred in the same test
 * @param username - The username to log in with
 * @param password - The password to log in with (defaults to 'password123')
 */
export const subsequentLoginUser = (username: string, password: string = 'securePass123!') => {
  cy.visit('http://localhost:4530');
  cy.wait(500);
  cy.contains('Please login to continue to NUCircle');
  cy.get('#username-input').clear().type(username);
  cy.get('#password-input').clear().type(password);
  cy.contains('Log in').click();
  cy.url().should('include', '/home', { timeout: 10000 }); 
  // Wait for redirect to home page
  cy.url().should('include', '/home');
};
/**
 * Logs out the currently logged-in user
 */
export const logoutUser = () => {
  cy.get('.logout-button').click();
  cy.url().should('eq', 'http://localhost:4530/', { timeout: 10000 });
  cy.wait(1000);
  cy.contains('Please login to continue to NUCircle');
};

/**
 * Safely navigates to a game page using cy.visit()
 * This function handles cases where the document might be null, preventing Cypress errors
 * @param gameId - The game ID to navigate to
 */
export const navigateToGamePage = (gameId: string) => {
  // First check if we're already on the correct page
  cy.url().then((currentUrl) => {
    if (currentUrl.includes(`/games/${gameId}`)) {
      cy.log(`Already on game page for ${gameId}`);
      return;
    }

    // Ensure page is stable before navigation
    cy.get('body').should('exist').should('be.visible');
    cy.window().should('exist');
    cy.document().should('exist');
    
    // Wait for any pending operations to complete
    cy.wait(1000);
    
    // Use cy.visit() - Cypress handles this more reliably than history.pushState
    cy.visit(`/games/${gameId}`, { 
      timeout: 20000,
      failOnStatusCode: false,
      onBeforeLoad: (win) => {
        // Ensure window exists before navigation
        if (!win || !win.document) {
          throw new Error('Window or document not available');
        }
      }
    });
    
    // Wait for page to fully load
    cy.window().should('exist');
    cy.document().should('exist');
    cy.get('body').should('exist').should('be.visible');
    cy.wait(1500); // Wait for React Router and page to stabilize
  });
  
  // Verify navigation succeeded
  cy.url({ timeout: 20000 }).should('include', `/games/${gameId}`);
}
/**
 * Seeds the database with test data
 * Will fail the test if MongoDB is not available or seeding fails
 * @returns Cypress chainable to allow proper chaining
 */
export const seedDatabase = () => {
  const mongoUri = Cypress.env('MONGODB_URI') || 'mongodb://127.0.0.1:27017';
  // Use a longer timeout
  return cy.exec(`npx ts-node ../server/seedData/populateDB.ts ${mongoUri}`, {
    failOnNonZeroExit: true,
    timeout: 35000, // 35 second timeout (script has its own 25s timeout)
  });
};

/**
 * Clears the database
 * Will fail the test if MongoDB is not available or cleanup fails
 * @returns Cypress chainable to allow proper chaining
 */
export const cleanDatabase = () => {
  const mongoUri = Cypress.env('MONGODB_URI') || 'mongodb://127.0.0.1:27017';
  // Use a longer timeout to account for MongoDB connection delays
  return cy.exec(`npx ts-node ../server/seedData/deleteDB.ts ${mongoUri}`, {
    failOnNonZeroExit: false, // Don't fail tests if cleanup has issues (MongoDB might be slow)
    timeout: 15000, // 15 second timeout - reduced since populateDB.ts clears collections anyway
  }).then((result) => {
    // Log the result for debugging using console.log to avoid async/sync mixing
    if (result.stdout) {
      console.log('Cleanup stdout:', result.stdout);
    }
    if (result.stderr) {
      console.log('Cleanup stderr:', result.stderr);
    }
    // Log if cleanup failed
    if (result.code !== 0) {
      console.log(`Warning: Database cleanup returned non-zero exit code: ${result.code}`);
    }
    return result;
  });
};

/**
 * Sets up the database before each test
 */
export const setupTest = () => {
  // Skip explicit cleanup - populateDB.ts already clears collections before inserting
  // This avoids timeout issues with deleteDB.ts
  cy.log('Skipping explicit database cleanup - populateDB.ts handles collection clearing');
  
  // Seed the database and wait for it to complete
  return seedDatabase().then((seedResult) => {
    // Verify seeding succeeded
    if (seedResult.code !== 0) {
      const errorMsg = seedResult.stderr || seedResult.stdout || 'Unknown error';
      cy.log(`Seeding stderr: ${seedResult.stderr}`);
      cy.log(`Seeding stdout: ${seedResult.stdout}`);
      throw new Error(`Database seeding failed with code ${seedResult.code}: ${errorMsg}`);
    }
    cy.log('Database seeding completed successfully');
    // Wait a bit more to ensure seeding is fully processed
    cy.wait(1000);
  });
};

/**
 * Cleans up the database after each test
 */
export const teardownTest = () => {
  cy.log('Skipping database cleanup in teardown - populateDB.ts handles collection clearing');
};

/**
 * Navigates to the Ask Question page
 */
export const goToAskQuestion = () => {
  cy.contains('Ask Question').click();
  cy.url().should('include', '/new/question');
};

/**
 * Navigates to the current user's profile by clicking the profile button in the upper right
 */
export const goToMyProfile = () => {
  cy.get('.profile-image').click();
  cy.url().should('include', '/user/');
};

/**
 * Creates a new question with the provided details
 * @param title - Question title
 * @param text - Question content
 * @param tags - Space-separated tags
 */
export const createQuestion = (title: string, text: string, tags: string) => {
  goToAskQuestion();
  cy.get('#formTitleInput').type(title);
  cy.get('#formTextInput').type(text);
  cy.get('#formTagInput').type(tags);
  cy.contains('Post Question').click();
};

/**
 * Navigates to answer a specific question by clicking on its title
 * @param questionTitle - The title of the question to click on
 */
export const goToAnswerQuestion = (questionTitle: string) => {
  cy.contains(questionTitle).click();
  cy.contains('Answer Question').click();
  cy.url().should('include', '/new/answer');
};

/**
 * Creates an answer to the current question
 * @param answerText - The answer content
 */
export const createAnswer = (answerText: string) => {
  cy.get('#answerTextInput').type(answerText);
  cy.contains('Post Answer').click();
};

/**
 * Performs a search using the search bar
 * @param searchTerm - The term to search for
 */
export const performSearch = (searchTerm: string) => {
  cy.get('#searchBar').type(`${searchTerm}{enter}`);
};

/**
 * Clicks on a specific filter/order button
 * @param filterName - The name of the filter ("Newest", "Unanswered", "Active", "Most Viewed")
 */
export const clickFilter = (filterName: string) => {
  cy.contains(filterName).click();
};

/**
 * Navigates back to the Questions page
 */
export const goToQuestions = () => {
  cy.contains('Questions').click();
  cy.url().should('include', '/home');
};

/**
 * Navigates back to the Collections page
 */
export const goToCollections = () => {
  cy.contains('Collections').click();
};

/**
 * Creates a new question with the provided details
 * @param title - Question title
 * @param text - Question content
 * @param tags - Space-separated tags
 */
export const createCommunity = (title: string, desc: string, isPublic: boolean) => {
  cy.get('.new-community-button').click();
  cy.get('.new-community-input').type(title);
  cy.get('.new-community-textarea').type(desc);
  if (!isPublic) { cy.get('.checkbox-wrapper').click();};
  cy.get('.new-community-submit').click();
};

export const dismissWelcomePopup = () => {
  // Check if welcome popup exists and dismiss it
  cy.get('body').then(($body) => {
    const hasBackdrop = $body.find('.welcome-popup-backdrop').length > 0;
    const hasButton = $body.find('.welcome-popup-button').length > 0;
    
    if (hasBackdrop || hasButton) {
      // Click the button to dismiss - use force to ensure click goes through
      cy.get('.welcome-popup-button', { timeout: 5000 })
        .should('exist')
        .click({ force: true });
      
      // Wait for backdrop to disappear after clicking
      cy.get('.welcome-popup-backdrop', { timeout: 10000 }).should('not.exist');
    }
  });
  
  // Final check: ensure backdrop is completely gone before proceeding
  cy.get('.welcome-popup-backdrop', { timeout: 5000 }).should('not.exist');
};

/**
 * Navigates back to the Communities page
 */
export const goToCommunities = () => {
  // Ensure welcome popup is dismissed before clicking
  dismissWelcomePopup();
  
  // Wait for Communities link to be visible
  cy.contains('Communities', { timeout: 5000 }).should('be.visible');
  
  // Use force: true to bypass backdrop if it's still present
  cy.contains('Communities').click({ force: true });
};

/**
 * Navigate to a Community Card
 */
export const viewCommunityCard = (CommunityName:string) => {
  cy.contains('.community-card-title', CommunityName).closest('.community-card').contains('button', 'View Community').click();
};

/**
 * Navigates to the Community Messages page
 */
export const goToCommunityMessages = () => {
  cy.contains('Messaging').click();
  cy.contains('Community Messages').click();
}

/**
 * Waits for questions to load and verifies the page is ready
 */
export const waitForQuestionsToLoad = () => {
  cy.get('.postTitle').should('exist');
};

/**
 * Open save question to collection modal
 * @param questionTitle - The title of the question to click on
 */
export const openSaveToCollectionModal = (questionTitle: string) => {
  cy.contains('.postTitle', questionTitle).closest('.question').find('.collections-btn').click();
};

/**
 * Toggle save question modal
 * @param collectionTitle - The title of the question to click on
 */
export const toggleSaveQuestion = (collectionTitle: string) => {
  cy.get('.collection-list').contains('.collection-name', collectionTitle).parents('.collection-row').find('.save-btn').click();
};

/**
 * Saves a question to a collection
 * @param questionTitle - The title of the question to click on
 * @param collectionTitle - The title of the collection to save to
 */
export const toggleSaveQuestionToCollection = (questionTitle:string, collectionTitle: string) => {
  openSaveToCollectionModal(questionTitle);
  toggleSaveQuestion(collectionTitle);
};

/**
 * Verify community details are displayed
 * @param communityName - The name of the community
 * @param communityDesc - The description of the community
 * @param communityMembers - The members of the community
 */
export const verifyCommunityDetailsDisplayed = (communityName: string, communityDesc: string, communityMembers: Array<string>) => {
  cy.contains('.community-title', communityName).should('be.visible');
  cy.contains('.community-description', communityDesc).should('be.visible');
  cy.get('.member-item').each(($el, index, $list) => {
      cy.wrap($el).should("contain", communityMembers[index]);});
};

/**
 * Verify community details are displayed
 * @param communityName - The name of the community
 * @param communityDesc - The description of the community
 * @param communityMembers - The members of the community
 */
export const verifyCommunityDetailsNotDisplayed = (communityName: string, communityDesc: string, communityMembers: Array<string>) => {
  cy.contains('.community-title', communityName).should('not.exist');
  cy.contains('.community-description', communityDesc).should('not.exist');
  cy.get('.member-item').should('not.exist');
};

/**
 * Verify question is saved to collection
 * @param collectionTitle - The title of the collection to click on
 */
export const verifyQuestionSaved = (collectionTitle: string) => {
  cy.get('.collection-list').contains('.collection-name', collectionTitle).parents('.collection-row').get('.status-tag').should('have.class', 'saved');
};

/**
 * Verify question is unsaved to collection
 * @param collectionTitle - The title of the collection to click on
 */
export const verifyQuestionUnsaved = (collectionTitle: string) => {
  cy.get('.collection-list').contains('.collection-name', collectionTitle).parents('.collection-row').get('.status-tag').should('have.class', 'unsaved');
};

/**
 * Verifies the order of questions on the page
 * @param expectedTitles - Array of question titles in expected order
 */
export const verifyQuestionOrder = (expectedTitles: string[]) => {
  cy.get('.postTitle').should('have.length', expectedTitles.length);
  cy.get('.postTitle').each(($el, index) => {
    cy.wrap($el).should('contain', expectedTitles[index]);
  });
};

/**
 * Verifies the stats (answers/views) for questions
 * @param expectedAnswers - Array of expected answer counts
 * @param expectedViews - Array of expected view counts
 */
export const verifyQuestionStats = (expectedAnswers: string[], expectedViews: string[]) => {
  cy.get('.postStats').each(($el, index) => {
    if (index < expectedAnswers.length) {
      cy.wrap($el).should('contain', expectedAnswers[index]);
    }
    if (index < expectedViews.length) {
      cy.wrap($el).should('contain', expectedViews[index]);
    }
  });
};

/**
 * Verifies error messages are displayed
 * @param errorMessage - The error message to check for
 */
export const verifyErrorMessage = (errorMessage: string) => {
  cy.contains(errorMessage).should('be.visible');
};

/**
 * Verifies that the question count is displayed correctly
 * @param count - Expected number of questions
 */
export const verifyQuestionCount = (count: number) => {
  cy.get('#question_count').should('contain', `${count} question${count !== 1 ? 's' : ''}`);
};

/**
 * Custom assertion to check that elements contain text in order
 * @param selector - CSS selector for elements
 * @param texts - Array of texts in expected order
 */
export const verifyElementsInOrder = (selector: string, texts: string[]) => {
  cy.get(selector).should('have.length', texts.length);
  texts.forEach((text, index) => {
    cy.get(selector).eq(index).should('contain', text);
  });
};

// New methods added below

/**
 * Navigates to the My Collections page
 */
export const goToMyCollections = () => {
  cy.contains('My Collections').click();
  cy.url().should('include', '/collections');
};

/**
 * Navigates to the new collection creation page from My Collections.
 */
export const goToCreateCollection = () => {
  cy.get('.collections-create-btn').click({ force: true });
  cy.url().should('include', '/new/collection');
  cy.get('.new-collection-page').should('exist');
};

/**
 * Fills out the new collection form.
 */
export const createNewCollection = (
  name: string,
  description: string,
  isPrivate: boolean = false
) => {
  // Fill using expected classnames instead of placeholders
  cy.get('.new-collection-input')
    .should('exist')
    .clear()
    .type(name);

  cy.get('.new-collection-textarea')
    .should('exist')
    .clear()
    .type(description);

  // Handle privacy checkbox
  const checkboxSelector = '.checkbox-wrapper';
  cy.get(checkboxSelector).then(($checkbox) => {
    if (isPrivate) {
      cy.wrap($checkbox).click({ force: true });
    } 
  });

  // Submit the form
  cy.get('.new-collection-submit').should('exist').click({ force: true });
};

/**
 *  Deletes a collection by name
 * @param name - name of the collection to delete
 */
export const deleteCollection = (name: string) => {
  goToMyCollections();
  cy.get('.collection-card').contains('.main-collection-name', name).click();
  cy.get('.delete-collection-button').click({ force: true });
  cy.contains('Are you sure you want to delete this collection? This action cannot be undone.').should('exist');
  cy.get('.button-danger').click({ force: true });
};

/**
 * Verifies that a collection with the specified name is visible on the page.
 * @param name - name of the collection to verify
 */
export const verifyCollectionVisible = (name: string) => {
  cy.contains(name).should('exist');
};

/**
 * Verifies that a collection card with the specified name is visible on the page.
 * @param collectionName - Name of the collection to verify.
 */
export const verifyCollectionExists = (collectionName: string) => {
  cy.get('.collections-list').should('exist');
  cy.get('.collection-card').should('exist');
  cy.get('.main-collection-name').contains(collectionName).should('be.visible');
};

/**
 * Opens a collection by clicking on its name on the My Collections page.
 * @param name - Name of the collection to open
 */
export const goToCollection = (name: string) => {
  cy.get('.collection-card').contains('.main-collection-name', name).click({ force: true });
  cy.url().should('include', '/collections/');
  cy.get('.collection-page').should('exist');
};

/**
 * Verifies that a collection page shows required details
 * (name, description, meta, and questions list).
 * @param name - Expected collection name
 * @param username - Expected username (optional)
 */
export const verifyCollectionPageDetails = (name: string, username?: string) => {
  cy.get('.collection-title').should('contain', name);
  cy.get('.collection-description').should('exist');
  cy.get('.collection-meta').should('exist');
  cy.get('.questions-list').should('exist');
  if (username) {
    cy.get('.collection-meta').should('contain', username);
  }
};

/**
 * Navigates to the user list page
 */
export const goToUsers = () => {
  // Ensure welcome popup is dismissed before clicking
  dismissWelcomePopup();
  
  // Wait for Users link to be available
  cy.contains('Users', { timeout: 5000 }).should('exist');
  
  // Use force: true to bypass backdrop if it's still present
  cy.contains('Users').click({ force: true });
  
  // Wait for navigation
  cy.url().should('include', '/users');
};

/**
 * Verifies user has online indicator
 * @param username - The username to check
 * @param shouldBeOnline - true if user should be online
 */
export const verifyUserOnlineStatus = (username: string, shouldBeOnline: boolean) => {
  cy.get('.user_card').contains('.userUsername', username).parents('.user_card').within(() => {
    if (shouldBeOnline) {
      cy.get('.online-indicator').should('exist');
    } else {
      cy.get('.online-indicator').should('not.exist');
    }
  });
};

/**
 * Sends a quiz invitation to a user
 * @param username - Username to challenge
 */
export const sendQuizInvite = (username: string) => {
  cy.get('.user_card').contains('.userUsername', username).parents('.user_card').within(() => {
    cy.get('.challenge-button').click();
  });
};

/**
 * Verifies challenge button state for a user
 * @param username - The username to check
 * @param shouldBeVisible - If button should be visible
 */
export const verifyChallengeButtonState = (username: string, shouldBeVisible: boolean) => {
  cy.get('.user_card').contains('.userUsername', username).parents('.user_card').within(() => {
    if (shouldBeVisible) {
      cy.get('.challenge-button').should('be.visible');
    } else {
      cy.get('.challenge-button').should('not.exist');
    }
  });
};

/**
 * Views a community by navigating to its URL
 * @param communityId - The ID of the community to view
 */
export const viewCommunity = (communityId: string): void => {
  cy.visit(`/community/${communityId}`);
};

export const acceptQuizInvite = () => {
  cy.get('.quiz-invite-modal').should('be.visible');
  cy.get('.accept-invite-button').click();
};

export const declineQuizInvite = () => {
  cy.get('.quiz-invite-modal').should('be.visible');
  cy.get('.decline-invite-button').click();
};

/**
 * Verifies quiz invitation modal is displayed
 * @param challengerUsername - The username of the challenger
 */
export const verifyQuizInviteModal = (challengerUsername: string) => {
  cy.get('.quiz-invite-modal').should('be.visible');
  cy.get('.quiz-invite-modal').should('contain', challengerUsername);
  cy.get('.accept-invite-button').should('be.visible');
  cy.get('.decline-invite-button').should('be.visible');
};

/*
 * Adds a new work experience entry using the work experience form.
 */
export const addWorkExperience = () => {
  cy.contains("+ Add").click();
    cy.get('input[name="title"]').type("Software Engineering Co-op");
    cy.get('input[name="company"]').type("OpenAI");
    cy.get('select[name="type"]').select("Co-op");
    cy.get('input[name="location"]').type("Boston, MA");
    cy.get('input[name="startDate"]').type("2024-01-10");
    cy.get('textarea[name="description"]').type("Worked on machine learning infrastructure.");
    cy.contains("Save").click();
}

export const editWorkExperience = (field: string, value: string) => {
  cy.get('.work-experience-card').contains('Worked on machine learning infrastructure.').parents('.work-experience-card').find('.edit-button').click();
  cy.get(field).clear().type(value);
  cy.contains("Save").click();
}

/**
 * Navigates to a user's profile page
 * @param username - The username of the user whose profile to view
 */
export const goToUserProfile = (username: string) => {
  cy.visit(`/user/${username}`);
  cy.url().should('include', `/user/${username}`);
};

/**
 * Navigates to own profile via profile image click
 */
export const goToOwnProfile = () => {
  dismissWelcomePopup();
  cy.get('.profile-image').should('be.visible').click({ force: true });
  // Wait for profile page to load
  cy.get('body', { timeout: 5000 }).should('exist');
};