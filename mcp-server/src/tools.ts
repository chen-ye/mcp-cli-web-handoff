import { z } from "zod";

export const delegateWebResearchSchema = z.object({
  prompt: z.string().describe("The research prompt to delegate to the web interface"),
});

export async function handleDelegateWebResearch(args: z.infer<typeof delegateWebResearchSchema>) {
  // We will return a specific message to the CLI agent that instructs it to pause execution
  // while the local WebSocket Server waits for a response from the browser extension.
  return {
    content: [{ type: "text" as const, text: "Delegated web research. Awaiting response via WebSocket." }]
  };
}
