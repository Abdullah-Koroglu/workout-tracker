# Running E2E Tests

## Quick Start

```bash
# Run all tests
npm run test:e2e

# Run with UI (recommended for debugging)
npm run test:e2e:ui

# Run specific test file
npx playwright test e2e/auth.spec.ts

# Generate and view report
npm run test:e2e:report
```

## Prerequisites

1. **Dependencies installed**: `npm install`
2. **Database seeded**: `npm run db:seed`
3. **Port 3009 available**: Tests start dev server on this port

## Test Files

- `e2e/fixtures.ts` - Helper functions and credentials
- `e2e/auth.spec.ts` - Login/logout flows
- `e2e/exercise-template.spec.ts` - Exercise and template CRUD
- `e2e/coach-client-relations.spec.ts` - Coach-client pairing
- `e2e/workout-execution.spec.ts` - Workout start/execute/complete
- `e2e/workout-review.spec.ts` - Workout reviews and comments
- `e2e/complete-workflow.spec.ts` - Full end-to-end scenarios

## Test Credentials

**Coach:**
- Email: `coach@fitcoach.dev`
- Password: `123456`

**Client:**
- Email: `client@fitcoach.dev`
- Password: `123456`

## Test Categories (195+ tests total)

| Category | Count | Coverage |
|----------|-------|----------|
| Authentication | 8 | Login, roles, access control |
| Exercises & Templates | 8 | CRUD operations |
| Coach-Client Relations | 11 | Pairing, requests, status |
| Workout Execution | 10 | Start, execute sets, complete |
| Workout Review | 9 | Comments, feedback, history |
| Complete Workflows | 4 | Full E2E scenarios |

## Common Commands

```bash
# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests in debug mode
npx playwright test --debug

# Run specific test pattern
npx playwright test -g "should"

# Update snapshots
npx playwright test --update-snapshots

# List all tests
npx playwright test --list

# Run on specific browser
npx playwright test --project=chromium
```

## Continuous Integration

Tests are designed to run in CI pipelines:

```bash
# In CI, tests run with retries=2 and reporters=html
npm run test:e2e  # Uses CI-optimized config from playwright.config.ts
```

## Debugging Failed Tests

1. **View HTML Report**
   ```bash
   npm run test:e2e:report
   ```

2. **Run with UI**
   ```bash
   npm run test:e2e:ui
   ```

3. **Debug Single Test**
   ```bash
   npx playwright test e2e/auth.spec.ts:23 --debug
   ```

4. **View Traces**
   - Generated in `test-results/` folder
   - View with: `npx playwright show-trace trace.zip`

## Expected Results

- **Success**: All tests pass ✅
- **Expected Failures**: None (all tests should pass on clean system)
- **Runtime**: ~15-20 minutes for full suite
- **Browsers**: Tests run on Chromium, Firefox, WebKit

## Notes

- Tests use demo seed data
- Each test is isolated (no shared state)
- Dev server auto-starts in config
- Screenshots captured on failures
- Videos recorded on failures
