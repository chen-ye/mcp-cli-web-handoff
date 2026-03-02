import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { delegateWebResearchSchema, handleDelegateWebResearch } from "./tools";

// Initialize the MCP server
const server = new McpServer({
  name: "gemini-web-handoff",
  version: "1.0.0"
});

// Register the tool
server.tool(
  "delegate_web_research", 
  delegateWebResearchSchema.shape, 
  (args) => handleDelegateWebResearch(args)
);

// Start the server on stdio
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("Gemini Web Handoff MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main:", error);
  process.exit(1);
});
