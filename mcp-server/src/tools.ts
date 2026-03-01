import { z } from "zod";
import { generateToken, startWebSocketServer, setPendingPrompt } from "./websocket";

export const delegateWebResearchSchema = z.object({
  prompt: z.string().describe("The research prompt to delegate to the web interface"),
});

export async function handleDelegateWebResearch(args: z.infer<typeof delegateWebResearchSchema>) {
  // Start the server if it isn't running
  startWebSocketServer();
  // Generate a new secure, one-time token for this request
  const token = generateToken();
  // Store the prompt so it can be sent to the browser extension upon connection
  setPendingPrompt(args.prompt);

  // We will return a specific message to the CLI agent that instructs it to pause execution
  // while the local WebSocket Server waits for a response from the browser extension.
  return {
    content: [{ 
      type: "text" as const, 
      text: `Delegated web research. Awaiting response via WebSocket.\nConnect using token: ${token}`
    }]
  };
}
