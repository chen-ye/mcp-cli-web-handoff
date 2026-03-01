"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const tools_1 = require("./tools");
// Initialize the MCP server
const server = new mcp_js_1.McpServer({
    name: "gemini-web-handoff",
    version: "1.0.0"
});
// Register the tool
server.tool("delegate_web_research", tools_1.delegateWebResearchSchema.shape, tools_1.handleDelegateWebResearch);
// Start the server on stdio
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.log("Gemini Web Handoff MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in main:", error);
    process.exit(1);
});
