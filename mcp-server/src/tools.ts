import { z } from "zod";
import { ensureDaemonRunning, sendPromptToDaemon } from "./client";
import fs from "fs";
import AdmZip from "adm-zip";
import path from "path";

export const delegateWebResearchSchema = z.object({
  prompt: z.string().describe("The research prompt to delegate to the web interface"),
  context_files: z.array(z.string()).max(10, "Array must contain at most 10 element(s)").optional().describe("An optional array of up to 10 specific local file paths to be provided to the web interface as Context ZIP"),
});

export async function handleDelegateWebResearch(args: z.infer<typeof delegateWebResearchSchema>) {
  try {
    const token = await ensureDaemonRunning();
    
    let zipBuffer: Buffer | undefined;
    
    if (args.context_files && args.context_files.length > 0) {
      const zip = new AdmZip();
      for (const filePath of args.context_files) {
        if (fs.existsSync(filePath)) {
          const fileContent = fs.readFileSync(filePath);
          zip.addFile(path.basename(filePath), fileContent);
        } else {
          console.warn(`File not found: ${filePath}, skipping...`);
        }
      }
      zipBuffer = zip.toBuffer();
    }
    
    // In the next task, we will send the zipBuffer to the daemon. For now, we just pass the prompt.
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
