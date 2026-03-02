# Implementation Plan: Tune Agent Proactivity

## Phase 1: Tool Description Update
- [ ] Task: Update `delegate_web_research` description
    - [ ] **Implement:** Update `mcp-server/src/tools.ts` with the new value-oriented description.
    - [ ] **Verify:** Run the MCP server and inspect the tool schema using `mcp-cli` to ensure the description is updated.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Tool Description Update' (Protocol in workflow.md)

## Phase 2: Agent Skill Implementation
- [ ] Task: Create Agent Skill
    - [ ] **Implement:** Create the `skills/web-handoff/SKILL.md` file with the specified use cases and suggestion interaction pattern.
    - [ ] **Verify:** Manually test the agent in Gemini CLI by providing a prompt that matches one of the use cases (e.g., "Do deep research on recent breakthroughs in fusion energy") and confirming it suggests the handoff.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Agent Skill Implementation' (Protocol in workflow.md)

## Phase 3: Final Integration and Documentation
- [ ] Task: Finalize Extension Manifest
    - [ ] **Verify:** Ensure `gemini-extension.json` correctly points to all necessary resources (though skills are auto-discovered).
- [ ] Task: Update README
    - [ ] **Implement:** Add a section to `README.md` about agent proactivity and how the user can tune it.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Final Integration and Documentation' (Protocol in workflow.md)