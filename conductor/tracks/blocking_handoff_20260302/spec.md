# Specification: Blocking Handoff Logic

## Overview
Currently, the `delegate_web_research` tool returns immediately after sending a prompt to the daemon. This causes the Gemini CLI agent to treat the tool as "finished" and move on to other tasks or tools while the research is still happening in the browser. This track implements a blocking mechanism where the MCP tool call remains open until the user submits the response in the browser extension.

## Functional Requirements
1. **Blocking MCP Client**:
   - Update `sendPayloadToDaemon` in `mcp-server/src/client.ts` to keep the WebSocket connection open.
   - It must listen for a `response` type message from the daemon.
   - It should only resolve once the response is received or a timeout occurs.
2. **Protocol Update**:
   - Explicitly define the `response` message type in the internal WebSocket protocol.
   - Ensure the `DaemonPayload` supports returning the result string.
3. **Tool Handler Update**:
   - Update `handleDelegateWebResearch` in `mcp-server/src/tools.ts` to await the result from `sendPayloadToDaemon`.
   - Return the actual research text to the agent, allowing it to synthesize the final answer immediately.
4. **Agent Guidance**:
   - Update `GEMINI.md` to inform the agent that the tool is blocking and it should wait for the result.

## Non-Functional Requirements
- **Timeout Management**: Implement a reasonable timeout (e.g., 5 minutes) to prevent the tool from hanging indefinitely if the user closes the browser.
- **Robustness**: Ensure the WebSocket connection is closed cleanly after the response is received.

## Out of Scope
- Automatic resumption if the CLI process is restarted.
- Multi-client result tracking (the daemon broadcasts, which is sufficient for simple single-user local setups).
