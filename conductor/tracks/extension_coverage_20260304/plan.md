# Implementation Plan: Chrome Extension Code Coverage

## Phase 1: Organize Coverage Directory Structure [checkpoint: 7c47182]
- [x] Task: Reconfigure MCP Server Coverage
    - [x] **Implement:** Update the root `package.json` `test:unit` and `coverage` scripts to output `c8` reports to `coverage/mcp-server/` instead of the root `coverage/` directory.
    - [x] **Implement:** Update `.gitignore` if necessary to ensure the new folder structure is ignored.
- [x] 7c47182 Task: Conductor - User Manual Verification 'Phase 1: Organize Coverage Directory Structure' (Protocol in workflow.md)

## Phase 2: Chrome Extension V8 Coverage
- [x] Task: Setup Playwright Coverage Reporter
    - [x] **Implement:** Install standard Istanbul libraries and create a custom collector script `scripts/collect-extension-coverage.js`.
    - [x] **Implement:** Update `package.json` to include `test:extension:coverage` and a combined `coverage` script.
- [x] Task: Instrument Tests for V8 Coverage
    - [x] **Implement:** Update `tests/unit/extension.spec.ts` to call `page.coverage.startJSCoverage()` before tests and `page.coverage.stopJSCregage()` after tests, attaching the raw data to the test results for processing by the collector.
- [~] Task: Conductor - User Manual Verification 'Phase 2: Chrome Extension V8 Coverage' (Protocol in workflow.md)

## Phase 3: CI/CD Integration
- [x] Task: Update GitHub Actions Pipeline
    - [x] **Implement:** Modify `.github/workflows/ci.yml` to upload both `coverage/mcp-server/` and `coverage/chrome-extension/` as CI artifacts.
- [~] Task: Conductor - User Manual Verification 'Phase 3: CI/CD Integration' (Protocol in workflow.md)
