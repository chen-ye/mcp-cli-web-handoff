# Implementation Plan: Ergonomic Authentication Flow

## Phase 1: Auto-Copy Token
- [x] Task: Implement clipboard writing utility
    - [x] **Write Tests:** Add unit tests to `mcp-client.spec.ts` to verify that `execSync` is called with the correct OS-specific clipboard command.
    - [x] **Implement:** Create a helper function in `mcp-server/src/client.ts` to write to the clipboard (`pbcopy` for macOS, `clip` for Windows, `xclip`/`xsel` for Linux).
- [x] Task: Auto-copy token on daemon startup/resolution
    - [x] **Write Tests:** Update `mcp-client.spec.ts` to assert the clipboard utility is called when `ensureDaemonRunning` successfully resolves a token.
    - [x] **Implement:** Call the clipboard utility within `resolveToken` in `mcp-server/src/client.ts`.
- [~] Task: Conductor - User Manual Verification 'Phase 1: Auto-Copy Token' (Protocol in workflow.md)

## Phase 2: Verification and Refinement
- [x] Task: Verify extension token persistence
    - [x] **Verify:** Ensure `chrome-extension/background.ts` and `sidepanel.ts` correctly retrieve the token from `chrome.storage.local` on startup. (This may already be working, but needs explicit verification).
- [x] Task: E2E Verification
    - [x] **Verify:** Run the full E2E test suite to ensure the new auto-copy logic doesn't interfere with existing flows.
- [~] Task: Conductor - User Manual Verification 'Phase 2: Verification and Refinement' (Protocol in workflow.md)
