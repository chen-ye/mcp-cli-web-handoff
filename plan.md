## Technical Architecture and Implementation Strategy

Implementing a seamless, robust, and strictly TOS-compliant handoff between the official Google Gemini CLI (`@google/gemini-cli`) and the `gemini.google.com` web interface requires a lightweight, locally-networked architecture. To avoid the OS-level installation friction associated with the Native Messaging API and to strictly bypass anti-bot DOM manipulation constraints, the optimal solution utilizes a local WebSocket server coupled with a Chrome Side Panel featuring manual clipboard controls.

The implementation strategy is divided into five distinct operational phases.

### Phase 1: Gemini CLI Extension & MCP Server Configuration

The official Gemini CLI utilizes extensions to bundle custom slash commands, context files (such as `GEMINI.md`), and Model Context Protocol (MCP) servers into versionable packages. The handoff mechanism begins by engineering a local MCP server that handles the suspension of the CLI and the initialization of the local network bridge.

1. **Build the MCP Tool:** Create a local Node.js MCP server that exposes a specific tool, for example, `delegate_web_research`. When the local CLI agent determines that a task requires expansive ecosystem research or web-native capabilities, it invokes this tool.
    
2. **WebSocket Initialization:** Upon invocation, the MCP server script launches a local WebSocket server (e.g., `ws://localhost:8080`). To prevent unauthorized local applications or malicious websites from hijacking the connection, the server generates a secure, one-time authentication token.
    
3. **Execution Suspension:** The MCP tool formulates a highly structured research prompt. It then returns a message to the CLI agent to pause its execution loop, effectively putting the terminal in a waiting state until the WebSocket receives the completed research payload back from the browser.
    

### Phase 2: Chrome Extension Foundation (Manifest V3 & WebSocket)

The browser extension acts as the secure, visual bridge between the local WebSocket and the web interface.

1. **Manifest Permissions:** The `manifest.json` must request the `"sidePanel"` permission to host the user interface, `"notifications"` for completion alerts, and `"scripting"`/`"activeTab"` to inject content scripts solely for the purpose of monitoring the DOM state of `gemini.google.com`.
    
2. **Background Service Worker (The Bridge):** Establish the WebSocket connection strictly inside the background service worker (`background.js`). Attempting to open a WebSocket directly from a content script or side panel often results in strict Content Security Policy (CSP) blocking errors. The service worker connects to `ws://localhost:8080?token=[auth_token]` to authenticate.
    
3. **Keep-Alive Polling:** Chrome service workers natively terminate after 30 seconds of inactivity. Because a "Deep Research" task can take several minutes, the service worker will sever the WebSocket connection if it sleeps. The extension must implement a keep-alive function that periodically sends ping messages across the WebSocket to maintain the background process.
    

### Phase 3: Side Panel UI & Clipboard Handoff

The Chrome Side Panel provides the ergonomic, Human-in-the-Loop (HITL) interface. By relying on manual user actions (copy and paste) rather than programmatic DOM injection, the extension strictly avoids triggering anti-bot protections or violating "automated means" clauses.

1. **Prompt Copy Button:** The side panel retrieves the pending, highly structured prompt from the background worker. It displays a "1-Click Copy Prompt" button. When clicked, it utilizes the native `navigator.clipboard.writeText()` API. Because this action is triggered by an explicit user gesture, it bypasses browser security restrictions.
    
2. **Context ZIP Copy Button:** In scenarios where the CLI agent determines the web subagent needs read-only access to the local codebase, the local MCP server compresses the relevant directory into a `.zip` archive (ensuring it stays within Gemini's 10-file ZIP upload limits) and transmits the blob over the WebSocket. The side panel exposes a "Copy Context ZIP" button. When activated, the extension writes the file to the clipboard using the `navigator.clipboard.write()` method with a `ClipboardItem` object.
    
3. **Manual Paste:** The user navigates to the active `gemini.google.com` tab and manually pastes both the prompt text and the copied ZIP archive directly into the rich-textarea chat input.  
    

### Phase 4: Execution & Asynchronous State Monitoring

Because complex generation tasks and Deep Research can take a considerable amount of time to synthesize, the extension must asynchronously monitor the web UI to alert the developer when the task is complete.

1. **Manual Trigger:** The user manually clicks the "Deep Research" button or submits the prompt to initiate the search.
    
2. **Completion Observation:** The extension's content script attaches a `MutationObserver` to the Gemini Web DOM. It passively watches for specific visual state changes indicating completion. The most robust way to test this is to check for the presence and subsequent disappearance of the `button` element. For longer deep research tasks, it also involves waiting for the definitive "Report Ready" indicator that populates next to the chat thread when a Deep Research cycle finishes.  
    
3. **Push Notification:** Upon detecting the completion state, the content script alerts the background worker. The worker utilizes the `chrome.notifications.create()` API to trigger a system-level desktop notification (e.g., "Gemini Research Complete: Ready for CLI Handoff"). This allows the user to navigate away and focus on other tasks while the web agent processes the request.
    

### Phase 5: The Return Handoff

The final phase securely routes the synthesized data back to the waiting CLI environment.

1. **Manual Extraction:** The user utilizes Gemini Web's native "Copy" control located beneath the completed response, which automatically captures the generated output in clean Markdown format.
    
2. **CLI Resumption:** The user opens the extension's side panel, pastes the Markdown into a dedicated "Return to CLI" text area, and clicks "Send."
    
3. **Closing the Loop:** The side panel passes the data to the background worker, which transmits it over the authenticated WebSocket connection. The local MCP server receives the payload, resolves the suspended `delegate_web_research` tool call, and feeds the synthesized data back to the Gemini CLI. The CLI incorporates the research into its context and seamlessly resumes generating code.
