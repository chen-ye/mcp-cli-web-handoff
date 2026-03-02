# Tech Stack: mcp-gemini-cli-web-handoff

## Programming Language
- **Node.js (TypeScript):** The language for building the MCP server and its associated tools.
- **Browser-based JavaScript (TypeScript):** The language for building the Chrome Extension, including the background service worker and the Side Panel UI.

## Frameworks & Libraries
- **Chrome Extension (Manifest V3):** The standard framework for building browser extensions, providing a secure and performant way to interact with the web interface.
- **Model Context Protocol (MCP) Server SDK:** The official SDK for building MCP servers, allowing for seamless integration with the Gemini CLI.
- **WebSocket (`ws` library):** A lightweight library for implementing the local WebSocket server within the Node.js MCP server and for managing communication with the browser extension.
- **adm-zip:** A lightweight library used by the local MCP server to construct in-memory ZIP archives of context files for clipboard transfer.

## Architecture
- **Local MCP Server & WebSocket Daemon (Node.js):** A server that exposes specific tools (e.g., `delegate_web_research`) to the Gemini CLI. It automatically spawns a standalone canonical WebSocket daemon to manage secure, token-based authentication and message routing between multiple CLI instances and the browser extension.
- **Chrome Extension Background Service Worker (Browser):** A Manifest V3 background process that runs in the browser, connecting to the local WebSocket server and maintaining the connection via a "keep-alive" mechanism.
- **Chrome Side Panel UI:** A dedicated interface for user interactions (copy/paste), interacting with the background worker to move content between the CLI and the web interface.

## Development & Tooling
- **npm Workspaces:** Unified project management using npm workspaces to manage dependencies for both the MCP server and the Chrome Extension from a single root.
- **Git:** Version control for tracking project changes and collaborating with other developers.
- **ESLint / Prettier:** Linting and formatting tools to maintain code quality and consistency.
- **Jest & specialized environments:** Unit testing using Jest, enhanced with `jest-chrome` for mocking browser APIs.
- **Playwright:** High-fidelity end-to-end (E2E) testing framework used to verify the full handoff loop and extension UI in a real browser environment.
- **GitHub Actions:** Continuous Integration (CI) platform for automating the execution of unit and E2E tests on every code change.
