# Specification: Blocking Handoff Logic

## Overview
Currently, the `delegate_web_research` tool returns immediately after sending a prompt to the daemon. This causes the Gemini CLI agent to treat the tool as "finished" and move on to other tasks or tools while the research is still happening in the browser. To ensure the agent waits for the results without breaking MCP client compatibility, this track implements a two-step handoff: `delegate_web_research` initiates the task and returns a `handoff_id`, and a new `get_research_result` tool blocks until the research is submitted.

## Functional Requirements
1. **Tool Refactoring**:
   - **`delegate_web_research`**:
     - Update to return a status message and a unique `handoff_id`.
     - It should still transmit the payload to the daemon but will no longer block.
   - **`get_research_result` (New)**:
     - Accepts a `handoff_id`.
     - Blocks until the daemon receives a response associated with that ID from the extension.
     - Implements a generous timeout (30 minutes).
2. **Protocol & Daemon Updates**:
   - Update the WebSocket protocol to include `handoff_id` in both payloads and responses.
   - Update the daemon to store pending results by `handoff_id` and notify the blocked `get_research_result` call when the matching response arrives.
3. **Blocking MCP Client**:
   - Update `mcp-server/src/client.ts` to support waiting for a specific ID.
4. **Agent Guidance**:
   - Update `GEMINI.md` to instruct the agent to *always* call `get_research_result` immediately after `delegate_web_research` and await its output.

## Non-Functional Requirements
- **Reliability**: Ensure the agent cannot "skip" the result phase.
- **Compatibility**: The two-step process ensures standard MCP clients (like `mcp-cli`) don't hang on the initiation call.

## Out of Scope
- Persisting research results across daemon restarts.
