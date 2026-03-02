# Gemini Web Handoff

Seamlessly hand off research tasks from the Gemini CLI to the `gemini.google.com` web interface via a specialized Chrome Extension.

## Key Features

- **High-Fidelity Research:** Leverage the full power of Gemini Web's browsing, multi-modal analysis, and long-context features (Projects/Gems).
- **Automated Setup:** Easily link and install as a standard Gemini CLI extension.
- **Agent Proactivity:** The CLI agent identifies when a task is better suited for the browser and proactively suggests a handoff.
- **Robust E2E Testing:** Fully verified with a Playwright-based testing suite.

## Installation

1.  **Build the MCP Server:**
    ```bash
    cd mcp-server && npm install && npm run build
    ```
2.  **Install the Extension:**
    ```bash
    # From the project root
    gemini extension link .
    ```
3.  **Install the Chrome Extension:**
    - Open Chrome and navigate to `chrome://extensions`.
    - Enable "Developer mode".
    - Click "Load unpacked" and select the `chrome-extension` directory in this project.

## Usage

When the Gemini CLI agent identifies a complex research task, it will ask:
> "This task seems well-suited for the Gemini Web interface... Would you like me to hand this off to your browser using the web-handoff tool?"

Type "yes" to initiate the handoff. You can then copy the prompt and context from the Chrome Side Panel and paste them directly into Gemini Web.

## Agent Proactivity & Tuning

By default, the agent is instructed to suggest handoffs for:
- Extensive web research.
- Tasks requiring advanced reasoning or long-context synthesis.
- Multi-modal analysis of complex layouts or UIs.

### Customization
You can tune the agent's proactivity by providing feedback during your session:
- *"Always suggest handoff for research tasks."*
- *"Don't suggest handoff unless I explicitly ask for it."*

## Development & Testing

Run the full suite of unit and E2E tests:
```bash
npm test
```
