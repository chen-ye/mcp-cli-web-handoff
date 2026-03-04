# Specification: Improve Chrome Extension Code Coverage

## Overview
This track aims to increase the code coverage of the Chrome Extension to meet the project standard of >80%. We will transition from the current dynamic injection testing method to standard ESM imports for unit testing the extension's logic across the background script, side panel, and content scripts.

## Functional Requirements
- **Coverage Increase:** Achieve >80% code coverage for `background.ts`, `sidepanel.ts`, and `content.ts`.
- **Testing Refactor:** Refactor existing unit tests in `tests/unit/extension.spec.ts` to use standard ESM imports instead of dynamic script injection.
- **New Unit Tests:**
    - Expand unit tests for `background.ts` to cover all connection and message handling logic.
    - Expand unit tests for `sidepanel.ts` to cover UI interaction logic and state management.
    - Create new unit tests for `content.ts` to verify DOM observation and status reporting.

## Non-Functional Requirements
- **Standardized Testing:** Follow idiomatic Playwright and TypeScript testing patterns.
- **Maintainability:** Improve the maintainability of the extension test suite by using conventional import methods.
- **CI/CD Integration:** Ensure the expanded test suite runs correctly in the existing CI pipeline and the new coverage reporting mechanism.

## Acceptance Criteria
- [ ] Code coverage for all Chrome Extension modules (`background.ts`, `sidepanel.ts`, `content.ts`) is >= 80%.
- [ ] Unit tests for the extension use standard ESM imports.
- [ ] All tests pass in the local development environment and the CI pipeline.
- [ ] The `npm run coverage` command accurately reports the increased coverage for the extension.

## Out of Scope
- Merging extension and MCP server coverage reports into a single file.
- Functional changes to the extension logic itself (refactoring for testability is permitted).
