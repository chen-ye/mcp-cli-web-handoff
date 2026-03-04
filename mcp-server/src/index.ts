import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  delegateWebResearchSchema,
  getResearchResultSchema,
  handleDelegateWebResearch,
  handleGetResearchResult,
} from './tools.js';

const server = new McpServer({
  name: 'gemini-web-handoff',
  version: '1.0.0',
});

// Register the tools
server.tool('delegate_web_research', delegateWebResearchSchema.shape, (args) =>
  handleDelegateWebResearch(args),
);

server.tool('get_research_result', getResearchResultSchema.shape, (args) =>
  handleGetResearchResult(args),
);

// Start the server on stdio
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log('Gemini Web Handoff MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main:', error);
  process.exit(1);
});
