# Specification: Tune Agent Proactivity

## Overview
This track focuses on improving the user experience by enabling Gemini CLI agents to proactively identify and suggest the use of the `delegate_web_research` tool. Currently, the tool's description is too technical, and agents lack guidance on when it's appropriate to hand off a task to the browser. This improvement will provide agents with clear use cases and a suggested interaction model.

## Functional Requirements
1. **Enhanced Tool Description (MCP Server)**:
   - Update the `delegate_web_research` tool description in `mcp-server/src/tools.ts` to be more value-oriented.
   - It should emphasize advanced reasoning, web browsing, and multi-modal capabilities that exceed the CLI's current scope.
2. **Agent Skill Definition (`skills/web-handoff/SKILL.md`)**:
   - Create a dedicated skill for the extension.
   - **Detailed Use Cases:** Include specific scenarios for handoff (e.g., extensive research, "Project"/"Gems" features, complex visual analysis, large-scale synthesis).
   - **Proactive Suggestion Pattern:** Instruct the agent to proactively suggest handoff when these use cases are detected.
   - **Contextual Phrasing:** The suggestion should follow the pattern: *"This task seems well-suited for the Gemini Web interface [because...]. Would you like me to hand this off to your browser using the web-handoff tool?"*
3. **User Tuning Visibility**:
   - Include a note in the Skill and/or documentation that the user can tune this proactivity by providing feedback or modifying their settings (e.g., "Always suggest handoff for research tasks").

## Non-Functional Requirements
- **Maintainability:** Ensure the skill is easy to update as Gemini Web's capabilities evolve.
- **Clarity:** The agent's suggestions must be helpful and not intrusive (Moderate/Context-aware approach).

## Out of Scope
- Implementing automated threshold logic (e.g., after 3 failed local searches).
- Adding complex configuration settings for proactivity levels.