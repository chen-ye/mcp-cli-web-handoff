# Implementation Plan: Chrome Extension Code Coverage

## Phase 1: Organize Coverage Directory Structure [checkpoint: 7c47182]
- [x] Task: Reconfigure MCP Server Coverage
    - [x] **Implement:** Update the root `package.json` `test:unit` and `coverage` scripts to output `c8` reports to `coverage/mcp-server/` instead of the root `coverage/` directory.
    - [x] **Implement:** Update `.gitignore` if necessary to ensure the new folder structure is ignored.
- [x] 7c47182 Task: Conductor - User Manual Verification 'Phase 1: Organize Coverage Directory Structure' (Protocol in workflow.md)

## Phase 2: Chrome Extension V8 Coverage
- [ ] Task: Setup Playwright Coverage Reporter
    - [ ] **Implement:** Install a Playwright-compatible coverage reporter (e.g., `monocart-reporter`) as a dev dependency.
    - [ ] **Implement:** Update `tests/e2e/playwright.config.ts` (and any other relevant playwright configs) to use the new reporter, outputting to `coverage/chrome-extension/`.
    - [ ] **Implement:** Configure the reporter to enforce an 80% global coverage threshold.
- [ ] Task: Instrument Tests for V8 Coverage
    - [ ] **Implement:** Update `tests/unit/extension.spec.ts` (and E2E tests if necessary) to call `page.coverage.startJSCoverage()` before tests and `page.coverage.stopJSCoverage()` after tests, passing the data to the reporter.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Chrome Extension V8 Coverage' (Protocol in workflow.md)

## Phase 3: CI/CD Integration
- [ ] Task: Update GitHub Actions Pipeline
    - [ ] **Implement:** Modify `.github/workflows/ci.yml` to upload both `coverage/mcp-server/` and `coverage/chrome-extension/` as CI artifacts.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: CI/CD Integration' (Protocol in workflow.md)
