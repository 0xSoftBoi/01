```markdown
# 01 Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns found in the "01" TypeScript repository. You'll learn the project's conventions for file naming, module imports/exports, and testing, as well as how to follow the established commit and workflow practices. This guide is ideal for contributors aiming for consistency and maintainability in a TypeScript codebase without a framework.

## Coding Conventions

### File Naming
- **PascalCase** is used for file names.
  - Example: `MyComponent.ts`, `UserService.ts`

### Import Style
- **Relative imports** are used to reference modules within the project.
  - Example:
    ```typescript
    import { UserService } from './UserService';
    ```

### Export Style
- **Named exports** are preferred over default exports.
  - Example:
    ```typescript
    // In UserService.ts
    export function getUser(id: string) { /* ... */ }

    // In another file
    import { getUser } from './UserService';
    ```

### Commit Patterns
- Commit messages are **freeform** (no strict prefixes).
- Average commit message length is about 65 characters.

## Workflows

### Adding a New Module
**Trigger:** When you need to add a new feature or utility.
**Command:** `/add-module`

1. Create a new file using PascalCase (e.g., `NewFeature.ts`).
2. Implement your feature using TypeScript.
3. Use named exports for all functions, classes, or constants.
4. Import any dependencies using relative paths.
5. If applicable, create a corresponding test file (`NewFeature.test.ts`).
6. Commit your changes with a clear, descriptive message.

### Writing Tests
**Trigger:** When you add or update functionality.
**Command:** `/write-test`

1. Create a test file named with the pattern `*.test.ts` (e.g., `UserService.test.ts`).
2. Write tests using the project's chosen (unknown) testing framework.
3. Ensure all exports are tested.
4. Run tests to verify correctness.
5. Commit test files with a descriptive message.

## Testing Patterns

- Test files follow the pattern: `*.test.ts`
- The specific testing framework is **unknown**; check existing test files for guidance.
- Place test files alongside the modules they test or in a dedicated test directory.

**Example:**
```typescript
// UserService.test.ts
import { getUser } from './UserService';

describe('getUser', () => {
  it('returns user data for a valid ID', () => {
    // test implementation
  });
});
```

## Commands
| Command         | Purpose                                    |
|-----------------|--------------------------------------------|
| /add-module     | Scaffold and implement a new module        |
| /write-test     | Create and implement a new test file       |
```
