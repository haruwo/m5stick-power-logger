# E2E Tests for M5StickC Power Logger

This directory contains end-to-end tests for the M5StickC Power Logger application using Playwright.

## Setup

1. Install dependencies:
```bash
npm install
npm run setup
```

2. Set up environment variables (optional):
```bash
cp .env.example .env
```

## Running Tests

### Local Development
```bash
# Run tests with the main docker-compose stack running
npm test

# Run tests in headed mode (browser visible)
npm run test:headed

# Run tests with debug mode
npm run test:debug

# Run tests with UI mode
npm run test:ui
```

### Docker-based Testing
```bash
# Run complete e2e test suite in Docker
npm run test:docker
```

### From Server Root
```bash
# Setup e2e tests
npm run test:e2e:setup

# Run e2e tests
npm run test:e2e

# Run e2e tests in Docker
npm run test:e2e:docker
```

## Test Structure

- `tests/dashboard.spec.js` - Dashboard functionality tests
- `tests/devices.spec.js` - Device management tests
- `tests/timeline.spec.js` - Timeline view tests
- `tests/calendar.spec.js` - Calendar view tests
- `tests/api.spec.js` - API endpoint tests

## Configuration

The tests are configured in `playwright.config.js` and support:
- Multiple browsers (Chromium, Firefox, WebKit)
- Mobile testing (Chrome Mobile, Safari Mobile)
- Automatic screenshots on failure
- Video recording on failure
- Test traces for debugging

## Docker Setup

The e2e tests can run in a completely isolated Docker environment with:
- Separate test database
- Test-specific backend and frontend containers
- Playwright test runner container

This ensures tests don't interfere with development data and provide consistent results across different environments.