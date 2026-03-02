# Implementation Plan: Context ZIP Compression & Handoff

## Phase 1: MCP Server Updates [checkpoint: a938723]
- [x] c68b074 Task: Update `delegate_web_research` input schema
    - [x] **Write Tests:** Ensure validation fails and returns an error when >10 files are provided in `context_files`.
    - [x] **Implement:** Add the optional `context_files` array to the tool schema and enforce the limit.
- [x] 42341b4 Task: Implement in-memory ZIP generation
    - [x] **Write Tests:** Verify the ability to read requested files and compress them into an in-memory buffer.
    - [x] **Implement:** Integrate a ZIP library (e.g., `adm-zip` or `jszip`) to compress the requested files.
- [x] 63af145 Task: Implement OS-native project path resolution
    - [x] **Write Tests:** Verify the absolute path to the project root is accurately resolved and formatted for the Host OS.
    - [x] **Implement:** Update the WebSocket payload to include the OS-native project path and the generated ZIP buffer (if any).
- [x] a938723 Task: Conductor - User Manual Verification 'Phase 1: MCP Server Updates' (Protocol in workflow.md)

## Phase 2: Chrome Extension Updates [checkpoint: a707e0c]
- [x] cfdc972 Task: Add "Copy Project Path" UI
    - [x] **Implement:** Update `sidepanel.html` and `sidepanel.css` to add the "Copy Project Path" button.
    - [x] **Implement:** Update `sidepanel.js` to receive the path from the background worker and use `navigator.clipboard.writeText()` when the button is clicked.
- [x] cfdc972 Task: Implement "Copy Context ZIP" functionality
    - [x] **Implement:** Handle the incoming ZIP payload in `background.js` and forward it to the Side Panel.
    - [x] **Implement:** Construct a `ClipboardItem` in `sidepanel.js` using the received ZIP data (with the correct MIME type).
    - [x] **Implement:** Enable the existing "Copy Context" button and attach a click listener to use `navigator.clipboard.write()` to copy the ZIP file to the clipboard.
- [x] a707e0c Task: Conductor - User Manual Verification 'Phase 2: Chrome Extension Updates' (Protocol in workflow.md)

## Phase: Review Fixes
- [x] 9025552 Task: Apply review suggestions