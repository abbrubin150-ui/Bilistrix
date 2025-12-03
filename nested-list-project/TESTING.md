# Testing Documentation

## Overview

This document provides information about the testing infrastructure and test coverage for the Nested List Sandbox Application.

## Test Infrastructure

### Testing Stack

- **Test Runner**: [Vitest](https://vitest.dev/) v4.0.15
- **Testing Library**: [@testing-library/react](https://testing-library.com/react) v16.3.0
- **Matchers**: [@testing-library/jest-dom](https://github.com/testing-library/jest-dom) v6.9.1
- **User Interactions**: [@testing-library/user-event](https://testing-library.com/docs/user-event/intro) v14.6.1
- **Environment**: jsdom v27.2.0 & happy-dom v20.0.11

### Running Tests

```bash
# Run tests in watch mode (development)
npm test

# Run tests once (CI/CD)
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

### Current Status

**Total Tests**: 108 passing
**Test Files**: 2
**Coverage Areas**:
- ✅ Utils (nodeHelpers.ts) - 63 tests
- ✅ Store (useStore.ts) - 45 tests
- ⏳ Hooks (useKeyboardNav.ts) - Planned
- ⏳ Components (ListItem.tsx, ListView.tsx) - Planned

### Priority 1: Core Business Logic (Completed)

#### utils/nodeHelpers.ts (63 tests)

Comprehensive test coverage for all tree manipulation utilities:

- **generateId** (2 tests)
  - Unique ID generation
  - Format validation

- **createNode** (3 tests)
  - Default values
  - Custom values
  - ChildrenIds override

- **getNodeDepth** (4 tests)
  - Root nodes (depth 0)
  - Nested nodes
  - Non-existent nodes
  - Deep nesting (5+ levels)

- **getAllChildren** (5 tests)
  - All descendants retrieval
  - Immediate children
  - Leaf nodes
  - Non-existent nodes
  - Empty children arrays

- **getPath** (4 tests)
  - Full path from root
  - Single root node
  - Non-existent nodes
  - Various depths

- **canMoveNode** (7 tests)
  - Valid moves
  - Self-move prevention
  - Descendant move prevention
  - Max depth enforcement
  - Null parent (root level) moves
  - Non-existent nodes
  - Custom maxDepth parameter

- **getMaxDepthInSubtree** (4 tests)
  - Leaf nodes
  - Nodes with children
  - Complex structures
  - Non-existent nodes

- **searchNodes** (6 tests)
  - Title search
  - Description search
  - Case-insensitive matching
  - No matches
  - Empty query
  - Partial matches

- **filterNodes** (5 tests)
  - Predicate filtering
  - Level filtering
  - Collapsed state filtering
  - Always true/false predicates

- **sortNodes** (7 tests)
  - Title sorting (asc/desc)
  - CreatedAt sorting (asc/desc)
  - UpdatedAt sorting
  - Immutability preservation
  - Default order

- **countNodes** (6 tests)
  - Single tree counting
  - Multiple roots
  - Subtree counting
  - Leaf nodes
  - Empty arrays
  - Invalid IDs

- **cloneSubtree** (9 tests)
  - Leaf node cloning
  - Subtree with new IDs
  - Property preservation
  - Timestamp updates
  - Custom parent IDs
  - Default parent (null)
  - Parent-child relationships
  - Error handling
  - Complex structures

#### store/useStore.ts (45 tests)

Comprehensive coverage of Zustand store operations:

- **Node CRUD Operations** (17 tests)
  - Root node creation
  - Child node creation
  - Max depth enforcement
  - Timestamp management
  - Node updates
  - Node deletion with cascade
  - Parent-child relationship updates
  - Selection clearing on delete
  - Focus clearing on delete
  - Node moving between parents
  - Level updates on move
  - Self-move prevention
  - Descendant move prevention
  - Position-based insertion
  - Node duplication
  - Subtree duplication
  - Duplicate placement

- **Node Operations** (6 tests)
  - Collapse toggling
  - Done state toggling
  - Pin state toggling
  - Collapse all nodes
  - Expand all nodes
  - Collapse to specific level

- **Selection Management** (7 tests)
  - Single node selection
  - Selection replacement
  - Multi-selection
  - Duplicate prevention
  - Deselection
  - Clear all selections
  - Select all nodes

- **Focus Management** (5 tests)
  - Focus setting
  - Focus clearing
  - Zoom in with path building
  - Zoom out navigation
  - Exit focus mode

- **Session Management** (3 tests)
  - View mode changes
  - RTL toggling
  - Session property updates

- **Filter Management** (2 tests)
  - Filter configuration
  - Filter clearing

- **Command Palette** (2 tests)
  - Toggle state
  - Close action

### Priority 2: Hooks & Components (Planned)

#### hooks/useKeyboardNav.ts

Planned test areas:
- Arrow key navigation (up/down)
- Tab/Shift+Tab level changes
- Ctrl/Cmd+Arrow for moving nodes
- Keyboard shortcuts (Ctrl+K, Ctrl+Z/Y)
- Event handling edge cases

#### components/core/ListItem.tsx

Planned test areas:
- Rendering states (expanded/collapsed, completed)
- Drag-and-drop handlers
- Inline editing mode
- Level-based indentation
- Keyboard interactions
- Context menu actions

#### components/core/ListView.tsx

Planned test areas:
- Tree structure rendering
- Filter application
- Focus mode display
- Empty state
- Drop zones

### Priority 3: Advanced Features (Future)

- RulesEngine component tests
- PluginsManager component tests
- View components (BoardView, TimelineView, TreeView, MinimalView)
- Integration tests for drag-and-drop
- E2E tests for critical user flows

## Test Organization

```
src/
├── utils/__tests__/
│   └── nodeHelpers.test.ts          ✅ 63 tests
├── store/__tests__/
│   └── useStore.test.ts             ✅ 45 tests
├── hooks/__tests__/
│   └── useKeyboardNav.test.ts       ⏳ Planned
└── components/
    ├── core/__tests__/
    │   ├── ListItem.test.tsx        ⏳ Planned
    │   └── ListView.test.tsx        ⏳ Planned
    └── ui/__tests__/
        └── ...                       ⏳ Future
```

## Configuration Files

### vitest.config.ts

```typescript
- Test environment: jsdom
- Globals enabled
- Setup file: src/test/setup.ts
- Coverage provider: v8
- Coverage reporters: text, json, html
```

### src/test/setup.ts

Custom test setup including:
- Testing Library matchers (@testing-library/jest-dom)
- Automatic cleanup after each test
- localStorage mock
- window.matchMedia mock
- IntersectionObserver mock

## Writing Tests

### Best Practices

1. **Use descriptive test names**
   ```typescript
   it('should delete node and all descendants', () => { ... });
   ```

2. **Use renderHook for Zustand stores**
   ```typescript
   const { result } = renderHook(() => useStore());
   act(() => {
     result.current.createNode(null, { title: 'Test' });
   });
   ```

3. **Wrap state updates in act()**
   ```typescript
   act(() => {
     // Any state-changing operations
   });
   ```

4. **Test both happy path and edge cases**
   - Valid inputs
   - Invalid inputs
   - Boundary conditions
   - Error states

5. **Use beforeEach for setup**
   ```typescript
   beforeEach(() => {
     // Reset state or create test fixtures
   });
   ```

### Example Test

```typescript
describe('Feature', () => {
  it('should perform expected behavior', () => {
    // Arrange
    const { result } = renderHook(() => useStore());

    // Act
    act(() => {
      result.current.someAction();
    });

    // Assert
    expect(result.current.someState).toBe(expectedValue);
  });
});
```

## CI/CD Integration

Tests are designed to run in CI/CD pipelines:

```bash
npm run test:run
```

This command:
- Runs all tests once (no watch mode)
- Exits with appropriate status code
- Displays test results and coverage

## Coverage Goals

| Category | Current | Target |
|----------|---------|--------|
| Utils | 100% | 100% |
| Store | ~80% | 90%+ |
| Hooks | 0% | 85%+ |
| Components | 0% | 80%+ |
| **Overall** | **~40%** | **80%+** |

## Known Limitations

1. **Component Tests**: Not yet implemented for React components with drag-and-drop
2. **E2E Tests**: No end-to-end tests for complete user workflows
3. **Performance Tests**: No benchmarks for large tree rendering (1000+ nodes)
4. **Accessibility Tests**: No automated a11y testing yet
5. **Visual Regression**: No screenshot comparison testing

## Future Improvements

1. ✅ Add Vitest and Testing Library setup
2. ✅ Write tests for nodeHelpers.ts
3. ✅ Write tests for useStore.ts
4. ⏳ Add tests for useKeyboardNav.ts
5. ⏳ Add tests for ListItem.tsx and ListView.tsx
6. ⏳ Add integration tests for drag-and-drop
7. ⏳ Set up E2E testing with Cypress
8. ⏳ Add visual regression testing
9. ⏳ Implement performance benchmarking
10. ⏳ Add accessibility testing with jest-axe

## Contributing

When adding new features:

1. Write tests first (TDD approach recommended)
2. Ensure tests are descriptive and focused
3. Aim for high coverage (>80%) on critical paths
4. Run tests before committing: `npm test`
5. Update this documentation if adding new test categories

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library - React](https://testing-library.com/react)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
