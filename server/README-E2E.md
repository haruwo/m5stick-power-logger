# E2E Testing for M5StickC Power Logger

This directory contains end-to-end tests for the M5StickC Power Logger application using Playwright.

## Setup

1. Install dependencies:
```bash
npm install
npx playwright install
```

2. Ensure Docker and Docker Compose are installed and running.

## Running Tests

### All Tests
```bash
npm run test:e2e
```

### Run with Browser UI
```bash
npm run test:e2e:headed
```

### Debug Mode
```bash
npm run test:e2e:debug
```

### Interactive UI Mode
```bash
npm run test:e2e:ui
```

## Test Structure

- `dashboard.spec.js` - Tests for the main dashboard functionality
- `api.spec.js` - API endpoint testing
- `user-flows.spec.js` - Complete user journey testing
- `health-checks.spec.js` - System health and performance tests
- `setup.js` - Global test setup and teardown

## Test Coverage

### Frontend Tests
- Dashboard loading and navigation
- Tab switching functionality
- Responsive design
- Error handling

### API Tests
- Power event submission and validation
- Device management endpoints
- Data filtering and pagination
- CORS configuration

### Integration Tests
- Complete user workflows
- Real-time data simulation
- Network interruption handling
- Cross-browser compatibility

### Health Checks
- Service availability
- Database connectivity
- Redis caching
- Security headers
- Performance benchmarks

## Environment

Tests run against the full Docker Compose stack:
- Frontend (React): http://localhost:3001
- Backend (Node.js): http://localhost:3000
- Nginx (Reverse Proxy): http://localhost:8080
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## CI/CD Integration

The tests are configured for CI environments with:
- Automatic retries (2x in CI)
- Single worker in CI
- HTML, JSON, and JUnit reporters
- Screenshot and video capture on failures

## Troubleshooting

1. **Services not starting**: Ensure Docker is running and ports are available
2. **Tests timing out**: Increase timeouts in `playwright.config.js`
3. **Permission errors**: Check Docker permissions and file ownership
4. **Port conflicts**: Modify ports in `compose.yml` if needed

## Adding New Tests

1. Create new spec files in `tests/e2e/`
2. Follow the existing naming convention: `*.spec.js`
3. Use appropriate test descriptions and group related tests
4. Add test data cleanup when necessary
5. Include both positive and negative test scenarios