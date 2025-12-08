const { defineConfig } = require("cypress");
require('dotenv').config();

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4530',
    // Increase default command timeout to handle slow navigation
    defaultCommandTimeout: 10000,
    // Increase page load timeout
    pageLoadTimeout: 30000,
    // Increase request timeout
    requestTimeout: 10000,
    // Increase response timeout
    responseTimeout: 30000,
    setupNodeEvents(on, config) {
      require("@cypress/code-coverage/task")(on, config);
      config.env = {
        ...process.env,
        ...config.env,
        MONGODB_URI: 'mongodb://127.0.0.1:27017',
      };
      return config;
    },
  },
  // Suppress code coverage warnings - app may not be instrumented for E2E tests
  video: false,
  screenshotOnRunFailure: true,
  // Disable experimental features that might cause document tracking issues
  experimentalMemoryManagement: false,
});