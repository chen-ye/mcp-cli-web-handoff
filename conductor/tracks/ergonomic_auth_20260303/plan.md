# Implementation Plan: Ergonomic Authentication Flow

## Phase 1: Auto-Copy Token
- [ ] Task: Implement clipboard writing utility
    - [ ] **Write Tests:** Add unit tests to `mcp-client.spec.ts` to verify that `execSync` is called with the correct OS-specific clipboard command.
    - [ ] **Implement:** Create a helper function in `mcp-server/src/client.ts` to write to the clipboard (`pbcopy` for macOS, `clip` for Windows, `xclip`/`xsel` for Linux).
- [ ] Task: Auto-copy token on daemon startup/resolution
    - [ ] **Write Tests:** Update `mcp-client.spec.ts` to assert the clipboard utility is called when `ensureDaemonRunning` successfully resolves a token.
    - [ ] **Implement:** Call the clipboard utility within `resolveToken` in `mcp-server/src/client.ts`.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Auto-Copy Token' (Protocol in workflow.md)

## Phase 2: Verification and Refinement
- [ ] Task: Verify extension token persistence
    - [ ] **Verify:** Ensure `chrome-extension/background.ts` and `sidepanel.ts` correctly retrieve the token from `chrome.storage.local` on startup. (This may already be working, but needs explicit verification).
- [ ] Task: E2E Verification
    - [ ] **Verify:** Run the full E2E test suite to ensure the new auto-copy logic doesn't interfere with existing flows.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Verification and Refinement' (Protocol in workflow.md)
