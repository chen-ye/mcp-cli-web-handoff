# Implementation Plan: Implement Blocking Handoff Logic

## Phase 1: MCP Server & Protocol Updates
- [ ] Task: Update WebSocket protocol and client
    - [ ] **Write Tests:** Create unit tests in `tests/unit/mcp-client.spec.ts` to verify `sendPayloadToDaemon` waits for a response message and handles timeouts.
    - [ ] **Implement:** Refactor `sendPayloadToDaemon` to return a `Promise<string>` and implement the listener logic.
- [ ] Task: Update tool handler to wait for results
    - [ ] **Write Tests:** Update `tests/unit/mcp-tools.spec.ts` to verify `handleDelegateWebResearch` returns the actual string result from the client.
    - [ ] **Implement:** Update the tool handler to await the client response and return it as the tool output.
- [ ] Task: Update Agent Instructions
    - [ ] **Implement:** Update `GEMINI.md` to reflect that the tool is now blocking.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: MCP Server & Protocol Updates' (Protocol in workflow.md)

## Phase 2: Extension Verification
- [ ] Task: Verify E2E Handoff Loop
    - [ ] **Verify:** Run `npm run test:e2e` and update `tests/e2e/handoff.spec.ts` to verify the tool call blocks and successfully receives the submitted text.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Extension Verification' (Protocol in workflow.md)
