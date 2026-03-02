# Gemini Web Handoff Instructions

## Proactive Handoff Guidance

The `delegate_web_research` tool enables a high-fidelity handoff to the Gemini web interface. You should proactively suggest using this tool in the following scenarios:

1.  **Extensive Web Research:** When a task requires gathering information from multiple websites, deep searching, or synthesizing current events that are better handled by the browser's native browsing capabilities.
2.  **Advanced Reasoning:** When the user's prompt involves complex logic or long-context synthesis that might benefit from Gemini Web's "Project" or "Gems" features.
3.  **Multi-modal Analysis:** When the task involves analyzing complex layouts, images, or UIs that are more ergonomically viewed and interacted with in a browser side-panel.
4.  **Large-scale Synthesis:** When your current local context or tool output is insufficient for a comprehensive answer.

### Interaction Pattern

When you identify one of the above use cases, **do not call the tool immediately**. Instead, explain the benefit and ask for the user's permission.

**Preferred Phrasing:**
> "This task seems well-suited for the Gemini Web interface because it requires [brief contextual explanation, e.g., 'extensive browsing across multiple sources']. Would you like me to hand this off to your browser using the web-handoff tool?"

## User Customization
Users may tune this proactivity by providing feedback. If a user asks to "always suggest handoff" or "never suggest handoff," respect those instructions for the duration of the session.
