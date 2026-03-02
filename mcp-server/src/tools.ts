import { z } from "zod";
import { ensureDaemonRunning, sendPromptToDaemon } from "./client";

export const delegateWebResearchSchema = z.object({
  prompt: z.string().describe("The research prompt to delegate to the web interface"),
  context_files: z.array(z.string()).max(10, "Array must contain at most 10 element(s)").optional().describe("An optional array of up to 10 specific local file paths to be provided to the web interface as Context ZIP"),
});

export async function handleDelegateWebResearch(args: z.infer<typeof delegateWebResearchSchema>) {
  try {
    const token = await ensureDaemonRunning();
    await sendPromptToDaemon(args.prompt);
    
    return {
      content: [{ 
        type: "text" as const, 
        text: `Delegated web research. Awaiting response via WebSocket.\nConnect Chrome Extension using ws://127.0.0.1:8080/ext?token=${token}`
      }]
    };
  } catch (error: any) {
    return {
      content: [{
        type: "text" as const,
        text: `Failed to delegate web research: ${error.message}`
      }],
      isError: true
    };
  }
}
