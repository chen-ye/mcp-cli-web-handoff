# Specification: Side Panel UI Redesign

## Overview
This track focuses on modernizing the Chrome Extension's Side Panel UI. The goal is to move away from the current "hacker green" aesthetic and align the visual design with the modern Google Gemini web interface and standard Chrome UI patterns.

## Functional Requirements
- **Visual Redesign:** Implement a "Gemini Modern" theme characterized by clean lines, ample whitespace, and a professional look.
- **Accent System:** Use "Chrome Blue" (#1a73e8 or equivalent) as the primary accent color for active states, primary buttons, and focus indicators.
- **Component Styling:**
    - Update all buttons to be "Modern Rounded" (pill-shaped/high border-radius).
    - Update input fields and textareas to have significant rounding and subtle borders.
- **Adaptive Theming:** Implement full support for Light and Dark modes using the `prefers-color-scheme` media query.
- **Typography:** Transition to a modern sans-serif font stack (e.g., Inter, system-ui) for all labels and controls, keeping mono fonts only for the code/prompt display areas.

## Non-Functional Requirements
- **Accessibility:** Ensure all color combinations meet WCAG 2.2 Level AA contrast requirements in both light and dark modes.
- **Maintainability:** Use CSS variables for all colors and spacing to ensure the theme is easily adjustable.
- **Consistency:** Ensure the UI feels like a native part of the Chrome browser and the Gemini ecosystem.

## Acceptance Criteria
- [ ] The "hacker green" color scheme is completely removed.
- [ ] The UI automatically switches between Light and Dark modes based on system settings.
- [ ] Primary buttons are pill-shaped and use the Chrome Blue accent.
- [ ] Typography is clean and readable (sans-serif for UI, monospace for prompts).
- [ ] Color contrast passes WCAG 2.2 AA in both modes.

## Out of Scope
- Adding new functional buttons or logic to the sidepanel.
- Redesigning the background worker or MCP server logic.
- Complex animations or transitions between states.
