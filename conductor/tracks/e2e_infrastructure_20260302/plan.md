# Implementation Plan: High-Fidelity E2E Testing Infrastructure

## Phase 1: Playwright Infrastructure & MCP Integration
- [x] 0438f9f Task: Initialize Playwright project
    - [x] **Implement:** Install `@playwright/test` and initialize configuration in `tests/e2e/playwright.config.ts`.
    - [x] **Implement:** Configure Playwright to support loading the Chrome Extension.
- [~] Task: Implement MCP Client Wrapper for Tests
    - [ ] **Implement:** Create a utility in `tests/e2e/mcp-client.ts` that wraps `mcp-cli` to trigger tool calls programmatically.
- [ ] Task: Implement functional MCP + Extension tests
    - [ ] **Implement:** Create `tests/e2e/handoff.spec.ts`.
    - [ ] **Implement:** Use `mcp-cli` wrapper to call `delegate_web_research` and verify using Playwright that the Side Panel UI updates correctly.
    - [ ] **Implement:** Verify the lifecycle of the WebSocket daemon (lazy startup, token auth) via these integrated tests.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Playwright Infrastructure & MCP Integration' (Protocol in workflow.md)

## Phase 2: Extension UI & Handoff Verification
- [ ] Task: Verify/Implement Completion Notification Trigger
    - [ ] **Research:** Check `chrome-extension/content.js` and `background.js` for completion monitoring logic.
    - [ ] **Implement:** If missing, add a simple trigger that sends a notification to the user when Gemini is "done".
- [ ] Task: Implement Clipboard & Response tests
    - [ ] **Implement:** In `tests/e2e/handoff.spec.ts`, verify the "Copy" buttons by checking the clipboard content.
    - [ ] **Implement:** Verify the "Submit to CLI" functionality by programmatically pasting text into the Side Panel textarea and clicking submit, then checking the `mcp-cli` output/state.
- [ ] Task: Cleanup Legacy Tests
    - [ ] **Implement:** Remove `tests/e2e/test_mcp.sh`, `tests/e2e/test_extension.js`, and `tests/e2e/mcp-config.json`.
    - [ ] **Implement:** Update root `package.json` with `test:e2e` script pointing to Playwright.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Extension UI & Handoff Verification' (Protocol in workflow.md)

## Phase 3: CI Integration
- [ ] Task: Configure GitHub Actions
    - [ ] **Implement:** Create `.github/workflows/e2e.yml`.
    - [ ] **Implement:** Set up the workflow to install dependencies, build the project, and run Playwright tests.
    - [ ] **Implement:** Configure artifact uploading for traces and screenshots on failure.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: CI Integration' (Protocol in workflow.md)