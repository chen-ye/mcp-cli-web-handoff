# Implementation Plan: High-Fidelity E2E Testing Infrastructure

## Phase 1: Playwright Infrastructure & MCP Integration [checkpoint: 44c9655]
- [x] 0438f9f Task: Initialize Playwright project
    - [x] **Implement:** Install `@playwright/test` and initialize configuration in `tests/e2e/playwright.config.ts`.
    - [x] **Implement:** Configure Playwright to support loading the Chrome Extension.
- [x] 575eb63 Task: Implement MCP Client Wrapper for Tests
    - [x] **Implement:** Create a utility in `tests/e2e/mcp-client.ts` that wraps `mcp-cli` to trigger tool calls programmatically.
- [x] dc03b43 Task: Implement functional MCP + Extension tests
    - [x] **Implement:** Create `tests/e2e/handoff.spec.ts`.
    - [x] **Implement:** Use `mcp-cli` wrapper to call `delegate_web_research` and verify using Playwright that the Side Panel UI updates correctly.
    - [x] **Implement:** Verify the lifecycle of the WebSocket daemon (lazy startup, token auth) via these integrated tests.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Playwright Infrastructure & MCP Integration' (Protocol in workflow.md)

## Phase 2: Extension UI & Handoff Verification [checkpoint: 169f181]
- [x] 169f181 Task: Verify/Implement Completion Notification Trigger
    - [x] **Research:** Check `chrome-extension/content.js` and `background.js` for completion monitoring logic.
    - [x] **Implement:** If missing, add a simple trigger that sends a notification to the user when Gemini is "done".
- [x] cfbf4be Task: Implement Clipboard & Response tests
    - [x] **Implement:** In `tests/e2e/handoff.spec.ts`, verify the "Copy" buttons by checking the clipboard content.
    - [x] **Implement:** Verify the "Submit to CLI" functionality by programmatically pasting text into the Side Panel textarea and clicking submit, then checking the `mcp-cli` output/state.
- [x] cfbf4be Task: Cleanup Legacy Tests
    - [x] **Implement:** Remove `tests/e2e/test_mcp.sh`, `tests/e2e/test_extension.js`, and `tests/e2e/mcp-config.json`.
    - [x] **Implement:** Update root `package.json` with `test:e2e` script pointing to Playwright.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Extension UI & Handoff Verification' (Protocol in workflow.md)

## Phase 3: CI Integration [checkpoint: f5bcc9a]
- [x] f5bcc9a Task: Configure GitHub Actions
    - [x] **Implement:** Create `.github/workflows/e2e.yml`.
    - [x] **Implement:** Set up the workflow to install dependencies, build the project, and run Playwright tests.
    - [x] **Implement:** Configure artifact uploading for traces and screenshots on failure.
- [x] Task: Conductor - User Manual Verification 'Phase 3: CI Integration' (Protocol in workflow.md)