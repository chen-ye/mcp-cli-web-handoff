# Specification: Context ZIP Compression & Handoff

## Overview
This track implements the functionality required to provide the Gemini Web interface with local context. To comply with Gemini Web's 10-file limit per ZIP archive and support bulk codebase uploads efficiently, the solution is split into two parts: an ergonomic "Copy Project Path" feature for bulk uploads, and a targeted "Context ZIP" feature containing up to 10 specific files chosen by the CLI agent.

## Functional Requirements
1. **MCP Tool Update (`delegate_web_research`)**:
   - Update the tool's input schema to accept an optional array of `context_files` (string paths).
   - Enforce a strict limit of 10 files. If the array contains more than 10 files, the tool call must **fail** and return an error message instructing the agent to narrow down its selection.
2. **ZIP Generation (MCP Server)**:
   - When valid files are provided, the MCP server must read these files and compress them into an in-memory ZIP archive.
   - The payload must be formatted for transmission over the existing WebSocket connection to the Chrome Extension.
3. **Project Path Provision (MCP Server)**:
   - The MCP Server must determine the absolute path to the current project root.
   - The path string must be formatted to match the Host OS (e.g., `C:\Projects\...` vs `/home/...`) to ensure it works seamlessly with native OS file upload dialogs.
   - Transmit this path to the extension alongside the prompt and optional ZIP payload.
4. **Side Panel UI Updates**:
   - Add a new "Copy Project Path" button to the UI.
   - Enable the existing (but currently disabled) "Copy Context" button when a ZIP payload is received.
5. **Clipboard Integration (Extension)**:
   - Clicking "Copy Project Path" must write the OS-native path string to the clipboard.
   - Clicking "Copy Context" must construct a `ClipboardItem` from the received ZIP data and write the ZIP file to the user's clipboard.

## Non-Functional Requirements
- **Performance**: ZIP compression should be performed in-memory to avoid unnecessary disk I/O.
- **Security**: Only the explicitly requested files within the workspace should be accessed and zipped by the MCP server.

## Out of Scope
- Automated uploading of the files or path to the web UI (this must remain a manual user action via the clipboard).
- Compressing the entire workspace.