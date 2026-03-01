# Specification: Implement Chrome Extension

## Overview
This track focuses on building the Manifest V3 Chrome Extension that acts as the secure, visual bridge between the local WebSocket daemon and the `gemini.google.com` web interface. It provides a Side Panel UI for users to manage the handoff process.

## Functional Requirements
- **Manifest V3 Foundation:**
    - Configure `manifest.json` with necessary permissions (`sidePanel`, `storage`, `scripting`, `activeTab`).
    - Implement a Background Service Worker to manage the WebSocket connection.
- **WebSocket Communication:**
    - Establish a secure connection to `ws://127.0.0.1:8080/ext`.
    - Implement a "WebSocket Pings" strategy to maintain the connection and keep the service worker alive.
    - Handle secure authentication. Since direct file access is restricted in browser extensions, the extension will attempt to detect the token if passed via a specific mechanism or prompt the user for manual entry if auto-detection fails.
- **Side Panel UI:**
    - Implement a Side Panel using the `chrome.sidePanel` API.
    - **Copy Prompt Button:** A one-click button to copy the structured research prompt from the CLI to the clipboard.
    - **Copy Context Button:** A button to copy the codebase context (e.g., compressed or text-based) to the clipboard.
    - **Web Response Input:** A text area for users to paste the final response from Gemini, which is then sent back to the CLI via the WebSocket.
- **Content Scripts:**
    - Use content scripts solely for monitoring the DOM state of `gemini.google.com` to provide relevant status updates or alerts in the side panel.

## Non-Functional Requirements
- **Security:** Ensure all data moved to the clipboard is handled securely via explicit user gestures.
- **TOS Compliance:** Avoid automated DOM injection or manipulation on `gemini.google.com`.
- **Reliability:** Implement robust reconnection logic for the WebSocket connection.

## Acceptance Criteria
- The extension can be loaded into Chrome as an unpacked extension.
- The Side Panel correctly opens and displays status information.
- The extension successfully connects to the local WebSocket daemon using a valid token.
- Clicking "Copy Prompt" correctly places the prompt in the user's clipboard.
- Pasting a response into the input field and submitting it correctly sends the data back to the CLI.
- The service worker remains active throughout a 5-minute research task using the keep-alive strategy.

## Out of Scope
- Automated submission of prompts to the Gemini web interface.
- Advanced local codebase indexing within the extension.
