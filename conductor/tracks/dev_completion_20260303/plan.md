# Implementation Plan: Development Completion and Standardization

## Phase 1: Tooling and Root Orchestration [checkpoint: f5c8061]
- [x] abf2a0d Task: Initialize Biome project-wide
    - [x] **Implement:** Install `@biomejs/biome` and create `biome.json` at the root.
    - [x] **Implement:** Configure linting and formatting rules.
    - [x] **Implement:** Add `lint`, `format`, and `check` scripts to the root `package.json`.
- [x] 93a9817 Task: Standardize Root NPM Scripts
    - [x] **Implement:** Update root `package.json` to orchestrate `test:unit`, `test:e2e`, and `build` across all workspaces using `--workspaces`.
- [x] f5c8061 Task: Conductor - User Manual Verification 'Phase 1: Tooling and Root Orchestration' (Protocol in workflow.md)

## Phase 2: Chrome Extension TypeScript Migration [checkpoint: 6ac8d77]
- [x] 0f77adb Task: Setup TypeScript for Chrome Extension
    - [x] **Implement:** Add `tsconfig.json` to `chrome-extension/`.
    - [x] **Implement:** Update root `package.json` workspaces to include `chrome-extension`.
- [x] 33cd458 Task: Convert `background.js` to `.ts`
    - [x] **Write Tests:** Ensure unit tests for background logic exist and pass.
    - [x] **Implement:** Rename to `background.ts`, add types, and fix any compiler errors.
- [x] f6a8537 Task: Convert `content.js` to `.ts`
    - [x] **Write Tests:** Ensure content script logic is covered by tests.
    - [x] **Implement:** Rename to `content.ts`, add types, and fix errors.
- [x] 6a5cd6e Task: Convert `sidepanel.js` to `.ts`
    - [x] **Write Tests:** Ensure sidepanel logic is covered by unit tests.
    - [x] **Implement:** Rename to `sidepanel.ts`, add types, and fix errors.
- [x] 95d7fd2 Task: Update Build Pipeline for Extension
    - [x] **Implement:** Add a build step (e.g., `tsc` or `biome`) to compile TS files to JS for the browser.
- [x] 6ac8d77 Task: Conductor - User Manual Verification 'Phase 2: Chrome Extension TypeScript Migration' (Protocol in workflow.md)

## Phase 3: Accessibility and UI Audit [checkpoint: 39614ec]
- [x] Task: Conduct Accessibility Audit
    - [x] **Implement:** Use the `web-accessibility` tools to audit `sidepanel.html`.
    - [x] **Implement:** Document all WCAG 2.2 Level AA violations.
- [x] 23aede0 Task: Fix Accessibility Violations
    - [x] **Implement:** Update HTML/CSS/TS in the Side Panel to resolve all identified issues (ARIs, contrast, labels, etc.).
- [x] 39614ec Task: Conductor - User Manual Verification 'Phase 3: Accessibility and UI Audit' (Protocol in workflow.md)

## Phase 4: CI/CD and Coverage Finalization
- [ ] Task: Configure Coverage Reporting
    - [ ] **Implement:** Setup `c8` or `v8` coverage reporting for Playwright unit tests.
    - [ ] **Verify:** Ensure coverage meets the >80% threshold for all modules.
- [ ] Task: Update GitHub Actions Pipeline
    - [ ] **Implement:** Update `e2e.yml` to include Biome checks, Unit tests, and Coverage artifact uploads.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: CI/CD and Coverage Finalization' (Protocol in workflow.md)
