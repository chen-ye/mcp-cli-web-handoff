# Initial Concept

# Product Definition: Gemini-to-Web Handoff

## Vision
The Gemini-to-Web Handoff project aims to provide a seamless and secure bridge between the official Google Gemini CLI (@google/gemini-cli) and the gemini.google.com web interface. By leveraging a local Node.js MCP server and a Chrome Extension, the tool allows users to transition complex research or web-native tasks from their terminal directly into the rich, interactive browser environment. This approach respects Google's Terms of Service by relying on manual clipboard handoffs and explicit user gestures, thus avoiding automated DOM manipulation.

## Target Audience
- **Developers:** Users who primarily work in the terminal but need the advanced capabilities or visual feedback of the Gemini web interface for specific sub-tasks.
- **Researchers:** Users who require extensive web search and analysis that the CLI's current agentic loop may find challenging or cost-prohibitive.
- **Power Users:** Individuals who value a cohesive, integrated experience between their local development tools and web-based AI services.

## Core Goals
1. **Seamless Transitions:** Provide a "1-click" experience for handing off prompts from the CLI to the browser.
2. **Security & Privacy:** Ensure all communication between the CLI and the extension is authenticated via secure, one-time tokens.
3. **TOS Compliance:** Strictly avoid automated interactions with gemini.google.com by using human-in-the-loop (HITL) clipboard mechanisms.
4. **Reliability:** Implement robust "keep-alive" and reconnection logic for long-running research tasks.
5. **Bidirectional Communication:** Facilitate a smooth flow of information from the CLI to the web for research and back to the CLI for final integration.

## Key Features
- **Local MCP Server:** A Node.js-based server that acts as the CLI-side bridge, which spawns or connects to a canonical WebSocket daemon to manage secure, token-based authentication and routing between multiple CLI instances.
- **Chrome Extension (Manifest V3):** A background service worker to maintain the WebSocket connection and a Side Panel for user interactions.
- **Side Panel Interface:** A dedicated UI providing "Copy Prompt" and "Copy Context" buttons (CLI-to-Web), along with a "Paste Web Response" input field (Web-to-CLI) to return content to the CLI agent.
- **Manual Clipboard Integration:** Uses the `navigator.clipboard` API for moving structured prompts, OS-native absolute project paths (for bulk codebase uploads), and targeted, in-memory ZIP archives of up to 10 specific context files into the user's clipboard for easy pasting into Gemini.
- **Suspension Loop:** A two-step blocking mechanism (`delegate` -> `get_result`) that effectively pauses the CLI agent's execution while browser-side research is in progress, ensuring the agent waits for the results before proceeding.
- **Completion Notifications:** Monitors the Gemini web interface for response completion and sends a native system notification to the user, reducing the need for constant polling.
- **Proactive Agent Assistance:** The Gemini CLI agent is equipped with specific instructions to proactively identify tasks that are better suited for the browser and suggest using the handoff tool.

## Success Metrics
- **User Efficiency:** Reduction in manual steps (copying, pasting, context-switching) required to move a task from the terminal to the browser.
- **Reliability:** Zero connection drops or failures during handoff for 99% of tasks.
- **Security:** Verified token-based authentication prevents unauthorized local access.
