# Specification: Chrome Extension Code Coverage

## Overview
This track introduces code coverage reporting for the Chrome Extension. Since the extension code executes inside a Chromium browser context rather than a Node.js process, standard tools like `c8` cannot track it directly. We will use Playwright's native V8 coverage capabilities to collect execution data from the browser and generate independent coverage reports for the extension. 

## Functional Requirements
- **V8 Coverage Collection:** Modify the Playwright test setup to start and stop V8 JavaScript coverage tracking (`page.coverage.startJSCoverage()`) during the tests that execute extension code.
- **Report Generation:** Process the raw V8 coverage data to generate human-readable and machine-readable reports (e.g., using `monocart-reporter` or similar Playwright-native coverage reporter).
- **Separate Reports & Directory Structure:** The project will adopt a unified output structure for coverage:
    - MCP Server coverage will be saved to `coverage/mcp-server/`.
    - Chrome Extension coverage will be saved to `coverage/chrome-extension/`.

## Non-Functional Requirements
- **Idiomatic Playwright:** The implementation must utilize Playwright's built-in APIs and standard ecosystem plugins to minimize complex custom scripts.
- **Report Formats:** Generate both an interactive HTML report (for local developer use) and an `lcov` / JSON format (for CI artifacts/Codecov).
- **Threshold Enforcement:** The CI pipeline must fail if the Chrome Extension code coverage falls below the project standard of 80%.

## Acceptance Criteria
- [ ] Running the test suite collects code coverage for `background.ts`, `sidepanel.ts`, and `content.ts`.
- [ ] HTML and LCOV reports are successfully generated in `coverage/chrome-extension/`.
- [ ] Existing `c8` configuration is updated to output to `coverage/mcp-server/`.
- [ ] The build or test command fails if the extension coverage is below 80%.
- [ ] The CI pipeline (`ci.yml`) is updated to upload both the `mcp-server` and `chrome-extension` coverage reports.

## Out of Scope
- Merging the extension coverage report with the Node.js (`c8`) MCP server coverage report into a single combined view.
- Modifying the build process to instrument code with Istanbul prior to testing.
