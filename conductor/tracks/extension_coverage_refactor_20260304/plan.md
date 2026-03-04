# Implementation Plan: Improve Chrome Extension Code Coverage

## Phase 1: Refactor Testing Infrastructure
- [ ] Task: Configure TypeScript for Extension Testing
    - [ ] **Implement:** Update `chrome-extension/tsconfig.json` and root config to allow importing extension modules in tests.
    - [ ] **Implement:** Refactor `tests/unit/extension.spec.ts` to use standard `import` statements for `background.ts` and `sidepanel.ts`.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Refactor Testing Infrastructure' (Protocol in workflow.md)

## Phase 2: Expand Background Script Coverage
- [ ] Task: Test Connection and Reconnection Logic
    - [ ] **Write Tests:** Add unit tests for `connect()`, `startKeepAlive()`, and `stopKeepAlive()` in `background.ts`.
    - [ ] **Implement:** Ensure tests pass and cover edge cases (e.g., missing token, connection loss).
- [ ] Task: Test Message Routing and Storage
    - [ ] **Write Tests:** Add unit tests for `onMessage` listeners and `chrome.storage.onChanged` in `background.ts`.
    - [ ] **Implement:** Verify correct storage of payloads and relaying of messages.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Expand Background Script Coverage' (Protocol in workflow.md)

## Phase 3: Expand Side Panel and Content Script Coverage
- [ ] Task: Test Side Panel UI Logic and State
    - [ ] **Write Tests:** Add unit tests for `updatePayloadUI()`, `updateConnectionStatus()`, and clipboard interaction helpers in `sidepanel.ts`.
    - [ ] **Implement:** Verify UI updates correctly based on state changes.
- [ ] Task: Test Content Script DOM Observation
    - [ ] **Write Tests:** Add new unit tests for `content.ts` logic, mocking the DOM and MutationObserver.
    - [ ] **Implement:** Verify detection of Gemini status and completion.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Expand Side Panel and Content Script Coverage' (Protocol in workflow.md)

## Phase 4: Final Validation and Coverage Threshold
- [ ] Task: Verify 80% Coverage Threshold
    - [ ] **Verify:** Run `npm run coverage` and confirm all extension modules meet or exceed 80% coverage.
    - [ ] **Implement:** Add any missing tests to close any remaining gaps.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Final Validation and Coverage Threshold' (Protocol in workflow.md)
