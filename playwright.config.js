const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60000,
  use: {
    baseURL: 'http://127.0.0.1:8791',
    channel: 'chrome',
    viewport: { width: 390, height: 844 }
  },
  webServer: {
    command: 'python3 -m http.server 8791 --bind 127.0.0.1',
    port: 8791,
    reuseExistingServer: !process.env.CI
  }
});
