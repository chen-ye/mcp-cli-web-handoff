# Specification: High-Fidelity E2E Testing Infrastructure

## Overview
This track implements a robust, high-fidelity end-to-end (E2E) testing suite for the entire Gemini-to-Web Handoff project. The goal is to provide reliable, repeatable, and automated verification of the full handoff loop both locally and in a CI environment (GitHub Actions).

## Functional Requirements
1. **Testing Framework (Playwright)**:
   - Implement the browser-side and extension E2E tests using Playwright.
   - Utilize `launchPersistentContext` to load the Chrome Extension in a clean, isolated profile.
   - Leverage Playwright's Trace Viewer for high-fidelity debugging of test failures.
2. **MCP Server & Daemon Testing**:
   - Implement functional tests for all MCP tools (`delegate_web_research`).
   - Implement tests to verify the lifecycle of the WebSocket daemon:
     - Spawning logic (lazy startup).
     - Connection management (token authentication).
     - Idle timeout and cleanup logic.
   - Implement concurrency tests simulating multiple CLI agents communicating with the same daemon.
3. **Full Handoff Loop Verification**:
   - Verify that prompts are correctly received by the extension and that responses are correctly returned to the MCP server.
   - Use `@wong2/mcp-cli` to trigger tool calls programmatically within the E2E suite.
4. **Testing Harmonization (Tech Debt Reduction)**:
   - **Migrate and Replace:** Replace the existing `tests/e2e/test_mcp.sh` and `tests/e2e/test_extension.js` with integrated Playwright tests to maintain a single, consistent E2E entry point.
   - **Configuration Cleanup:** Consolidate E2E configurations (like `mcp-config.json`) into the Playwright project structure where applicable.
5. **CI Integration (GitHub Actions)**:
   - Configure a GitHub Actions workflow (`.github/workflows/e2e.yml`) to run the full test suite on every push and pull request.
   - Ensure necessary dependencies (browsers, Node.js, xvfb if required) are correctly set up in the CI environment.
   - Upload test artifacts (traces, screenshots) on failure for easy debugging.

## Non-Functional Requirements
- **Ergonomics**: Tests should be easy to run locally with a single command (e.g., `npm run test:e2e`).
- **Reliability**: Implement robust retries and wait strategies to eliminate flakiness in browser-based tests.
- **Portability**: The testing infrastructure must work consistently across macOS, Linux, and Windows.

## Out of Scope
- Testing against the live `gemini.google.com` production site.
- Testing hardware-specific clipboard behaviors beyond what Playwright/Chrome provides.