# Implementation Plan: Implement Phase 1: Gemini CLI Extension & MCP Server Configuration

## Phase 1: Core MCP Server and WebSocket Foundation [checkpoint: af79c21]
- [x] b8e5361 Task: Initialize Node.js project for the MCP server
    - [x] Create `package.json` with required dependencies (@google/mcp-server-sdk, ws)
    - [x] Configure TypeScript and basic build scripts
- [x] d4e5175 Task: Implement the `delegate_web_research` tool
    - [x] Define the tool's input schema (e.g., research prompt)
    - [x] Implement the core tool logic in the MCP server
- [x] 2032e43 Task: Implement the WebSocket server and token generation
    - [x] Develop a secure, one-time token generation mechanism
    - [x] Integrate the WebSocket server into the MCP tool invocation logic
- [x] 00c9449 Task: Implement CLI suspension and prompt formulation
    - [x] Formulate the highly structured research prompt for the browser extension
    - [x] Return the correct suspension message to the CLI agent
- [x] af79c21 Task: Conductor - User Manual Verification 'Phase 1: Core MCP Server and WebSocket Foundation' (Protocol in workflow.md)

## Multi-instance Support
- [x] 4ae8f6b Task: Refactor architecture to use a canonical WebSocket daemon
    - [x] Create a standalone WebSocket daemon script with routing and idle timeout
    - [x] Implement MCP server logic to spawn (if free) or connect to the daemon
    - [x] Update tool logic to communicate via the daemon
