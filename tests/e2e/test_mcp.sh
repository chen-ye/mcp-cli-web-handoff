#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Running E2E test for MCP Server using mcp-cli..."

# Run the mcp-cli to call the delegate_web_research tool
OUTPUT=$(mcp-cli --config tests/e2e/mcp-config.json call-tool web-handoff:delegate_web_research --args '{"prompt": "E2E Test Prompt", "context_files": ["mcp-server/package.json"]}')

echo "Output from mcp-cli:"
echo "$OUTPUT"

# Simple assertions
if echo "$OUTPUT" | grep -q "Delegated web research"; then
    echo "✅ Success: Received expected suspension message."
else
    echo "❌ Error: Did not receive expected suspension message."
    exit 1
fi

echo "✅ MCP Server E2E test passed!"
