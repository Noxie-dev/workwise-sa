# Testing Guide for WorkWise SA

This guide provides information on how to run and write tests for the WorkWise SA application.

## Running Tests

### Using Vitest

The project is configured to use Vitest for testing. You can run tests using the following commands:

```bash
# Run all tests
npx vitest run

# Run tests in watch mode
npx vitest

# Run tests with coverage
npx vitest run --coverage
```

### Running Specific Tests

You can run specific test files or patterns:

```bash
# Run a specific test file
npx vitest run src/__tests__/hooks/useFormAutosave.mock.test.ts

# Run all hook tests
npx vitest run src/__tests__/hooks/

# Run all component tests
npx vitest run src/__tests__/components/
```

## Test Structure

Tests are organized in the following directories:

- `client/src/__tests__/` - Client-side tests
  - `components/` - UI component tests
  - `hooks/` - Custom hook tests
  - `contexts/` - Context provider tests
  - `utils/` - Utility function tests

## Mock Tests vs. React Component Tests

Due to the current setup with React compiler, we've created two types of tests:

1. **Mock Tests** - These test the logic of components and hooks without rendering React components. These are more reliable in the current environment and have the `.mock.test.ts` extension.

2. **React Component Tests** - These test the actual React components and hooks. These have the `.test.tsx` extension but may require additional setup to work properly.

## Mocking

### Mocking Icons

Lucide React icons are mocked in `client/src/__mocks__/lucide-react.tsx`. This mock creates simple SVG elements with appropriate test IDs for each icon.

### Mocking Firebase

Firebase authentication is mocked in individual test files. See `AuthContext.test.tsx` for an example.

### Mocking API Calls

API calls using `fetch` are mocked in `setupTests.ts` and can be customized in individual test files.

## Test Utilities

### Test Providers

The `test-utils.tsx` file provides utilities for testing components that require providers:

```jsx
// Import the custom render function
import { render, screen } from '../utils/test-utils';

// Use it to render components with all providers
render(<YourComponent />);
```

### Query Client Testing

For components that use React Query, use the provided wrappers:

```jsx
import { createWrapper } from '../utils/test-utils';

// In your test
const { result } = renderHook(() => useYourHook(), {
  wrapper: createWrapper()
});
```

## Writing Tests

### Component Tests

Component tests should verify:
1. Rendering without errors
2. Proper display of props
3. User interactions (clicks, inputs, etc.)
4. State changes
5. Conditional rendering

### Hook Tests

Hook tests should verify:
1. Initial state
2. State changes after function calls
3. Side effects
4. Error handling

### Context Tests

Context tests should verify:
1. Provider rendering
2. Context value updates
3. Consumer behavior

## Best Practices

1. Test component behavior, not implementation details
2. Use data-testid attributes for test-specific element selection
3. Mock external dependencies
4. Keep tests isolated and independent
5. Use setup and teardown functions for common test setup
6. Test edge cases and error scenarios
7. Keep tests simple and focused on a single aspect of functionality

## Troubleshooting

### Common Issues

1. **Tests failing with React compiler errors**
   - Use the mock tests instead of the React component tests.

2. **Tests failing with "TypeError: window.matchMedia is not a function"**
   - This is handled in `setupTests.ts`, but make sure your component is rendered with the proper test utilities.

3. **Tests failing with "Error: Uncaught [Error: useAuth must be used within an AuthProvider]"**
   - Use the `render` function from `test-utils.tsx` which provides the AuthProvider.

4. **Tests timing out**
   - Check for unresolved promises or async operations. Make sure to use `await` with async test functions.

5. **Mock functions not being called**
   - Verify that the mock is set up correctly and that the component is actually calling the function.

For more help, refer to the [Vitest documentation](https://vitest.dev/guide/) or [Jest documentation](https://jestjs.io/docs/getting-started).
