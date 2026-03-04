# Specification: Ergonomic Authentication Flow

## Overview
This track addresses the ergonomic friction in the current authentication flow between the Gemini CLI (MCP Server) and the Chrome Extension. Currently, users struggle with selecting and copying the token from the CLI output and face issues with token persistence. The goal is to streamline this by automatically copying the token to the user's clipboard and ensuring the extension persistently stores it.

## Functional Requirements
- **Auto-Copy Token:** When the MCP server starts the daemon and generates a new token (or retrieves an existing one), it must automatically copy the token string to the user's system clipboard.
- **CLI Feedback:** The CLI should output a clear, concise message indicating that the token has been copied to the clipboard.
- **Token Persistence:** The Chrome Extension must persistently store the token using `chrome.storage.local` so it survives browser restarts. (Note: This is partially implemented, but needs verification to ensure it works seamlessly with the new auto-copy flow).
- **Status Indicator:** The Chrome Side Panel must clearly indicate the connection status based on the validity of the stored token.

## Non-Functional Requirements
- **Clipboard Utility:** Utilize a cross-platform Node.js clipboard utility (e.g., `clipboardy` or native `pbcopy`/`clip`/`xclip` via `child_process`) within the MCP server.
- **Security:** While auto-copying reduces explicit consent, it still requires the user to manually paste the token into the extension, maintaining a "human-in-the-loop" security model.

## Acceptance Criteria
- [ ] Running a tool that requires the daemon (e.g., `delegate_web_research`) automatically places the current daemon token in the system clipboard.
- [ ] The CLI prints "Daemon token copied to clipboard."
- [ ] Pasting the token into the Side Panel successfully authenticates the connection.
- [ ] Closing and reopening the browser/sidepanel maintains the authenticated connection without re-entering the token (assuming the daemon is still running with the same token).

## Out of Scope
- Implementing Native Messaging Hosts.
- Deep linking from the CLI to open the Chrome Extension directly.
