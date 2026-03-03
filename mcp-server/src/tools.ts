import { z } from "zod";
import * as client from "./client";
import fs from "fs";
import AdmZip from "adm-zip";
import path from "path";
import * as crypto from "crypto";

export const delegateWebResearchSchema = z.object({
  prompt: z.string().describe("The comprehensive research prompt or task to delegate to the Gemini web interface. Use this when the task requires advanced reasoning, extensive web browsing, multi-modal analysis, or features like 'Projects' and 'Gems' that are better handled in the browser."),
  context_files: z.array(z.string()).max(10, "Array must contain at most 10 element(s)").optional().describe("An optional array of up to 10 specific local file paths to provide as a Context ZIP for targeted analysis. For entire codebase uploads, the user will be prompted to use the 'Copy Project Path' button in the side panel."),
});

export const getResearchResultSchema = z.object({
  handoff_id: z.string().describe("The unique ID of the research task to retrieve results for."),
});

export interface ToolDependencies {
  ensureDaemonRunning: typeof client.ensureDaemonRunning;
  sendPayloadToDaemon: typeof client.sendPayloadToDaemon;
  waitForResult: typeof client.waitForResult;
  existsSync: typeof fs.existsSync;
  readFileSync: typeof fs.readFileSync;
  Zip: typeof AdmZip;
}

const defaultDeps: ToolDependencies = {
  ensureDaemonRunning: client.ensureDaemonRunning,
  sendPayloadToDaemon: client.sendPayloadToDaemon,
  waitForResult: client.waitForResult,
  existsSync: fs.existsSync,
  readFileSync: fs.readFileSync,
  Zip: AdmZip,
};

export async function handleDelegateWebResearch(
  args: z.infer<typeof delegateWebResearchSchema>,
  deps: ToolDependencies = defaultDeps
) {
  try {
    // Ensure daemon is running
    const token = await deps.ensureDaemonRunning();
    
    let zipBuffer: Buffer | undefined;
    
    if (args.context_files && args.context_files.length > 0) {
      const zip = new deps.Zip();
      for (const filePath of args.context_files) {
        if (deps.existsSync(filePath)) {
          const fileContent = deps.readFileSync(filePath);
          zip.addFile(path.basename(filePath), fileContent);
        } else {
          console.warn(`File not found: ${filePath}, skipping...`);
        }
      }
      zipBuffer = zip.toBuffer();
    }
    
    const handoff_id = crypto.randomUUID();
    // The current working directory is considered the project root in this context.
    const projectPath = process.cwd();
    
    await deps.sendPayloadToDaemon({
      handoff_id,
      prompt: args.prompt,
      projectPath: projectPath,
      zipData: zipBuffer ? zipBuffer.toString("base64") : undefined
    });
    
    return {
      content: [{ 
        type: "text" as const, 
        text: `Research task delegated to browser with ID: ${handoff_id}.\n\n` +
              `1. Connect your Chrome Extension to: ws://127.0.0.1:8080/ext?token=${token}\n` +
              `2. Perform the research in your browser.\n` +
              `3. Submit the result back via the Side Panel.\n\n` +
              `**CRITICAL:** You must now call 'get_research_result' with handoff_id: "${handoff_id}" to await and receive the final research data.`
      }]
    };
  } catch (error: unknown) {
    return {
      content: [{
        type: "text" as const,
        text: `Failed to delegate web research: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}

export async function handleGetResearchResult(
  args: z.infer<typeof getResearchResultSchema>,
  deps: ToolDependencies = defaultDeps
) {
  try {
    await deps.ensureDaemonRunning();
    
    const result = await deps.waitForResult(args.handoff_id);
    
    return {
      content: [{
        type: "text" as const,
        text: result
      }]
    };
  } catch (error: unknown) {
    return {
      content: [{
        type: "text" as const,
        text: `Failed to get research result: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}
