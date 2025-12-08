// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************
// cypress/support/e2e.js
import "@cypress/code-coverage/support";

// Suppress code coverage warnings if app is not instrumented
// This is common in E2E tests where instrumentation may not be set up
Cypress.on('window:before:load', (win) => {
  // Initialize coverage object if it doesn't exist to suppress warnings
  if (!win.__coverage__) {
    win.__coverage__ = {};
  }
});

// Suppress console warnings about coverage
const originalWarn = console.warn;
console.warn = function(...args) {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('coverage')) {
    // Suppress coverage-related warnings
    return;
  }
  originalWarn.apply(console, args);
};

// Import commands.js using ES2015 syntax:
import "./commands";

// Handle Cypress internal errors gracefully
// This error can occur during DOM snapshot restoration when document is null
Cypress.on('uncaught:exception', (err, runnable) => {
  // Suppress the "Cannot read properties of null (reading 'document')" error
  // This is a known Cypress issue that can occur during snapshot restoration
  if (err.message.includes('Cannot read properties of null') && 
      err.message.includes('document') &&
      err.stack && err.stack.includes('AutIframe')) {
    cy.log('Suppressed Cypress internal document null error during snapshot restoration');
    // Return false to prevent the error from failing the test
    return false;
  }
  // Don't suppress other errors
  return true;
});

// Alternatively you can use CommonJS syntax:
// require('./commands')
