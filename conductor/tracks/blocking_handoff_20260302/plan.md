# Implementation Plan: Implement Blocking Handoff Logic

## Phase 1: Protocol and Daemon Updates
- [x] Task: Update WebSocket protocol for `handoff_id`
    - [x] **Implement:** Update message interfaces to include `handoff_id`.
    - [x] **Implement:** Update `sidepanel.js` and `background.js` to preserve and return the `handoff_id`.
- [x] Task: Implement result tracking in Daemon
    - [x] **Implement:** Update `daemon.ts` to store results by `handoff_id` and handle waiting MCP clients.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Protocol and Daemon Updates' (Protocol in workflow.md)

## Phase 2: MCP Tool Refactoring
- [x] Task: Update `mcp-client.ts` for two-step flow
    - [x] **Implement:** Add `waitForResult(handoffId)` to the client logic.
- [x] Task: Refactor `delegate_web_research` and add `get_research_result`
    - [x] **Implement:** Update tool handlers in `tools.ts` and register the new tool in `index.ts`.
- [x] Task: Update Agent Instructions
    - [x] **Implement:** Update `GEMINI.md` with instructions for the two-step tool sequence.
- [x] Task: Conductor - User Manual Verification 'Phase 2: MCP Tool Refactoring' (Protocol in workflow.md)

## Phase 3: E2E Verification
- [x] Task: Verify full handoff loop
    - [x] **Verify:** Run `npm run test:e2e` with updated tests covering both tools.
- [x] Task: Conductor - User Manual Verification 'Phase 3: E2E Verification' (Protocol in workflow.md)

## Phase: Review Fixes
- [x] 878b751 Task: Apply review suggestions
