import { exec, spawn, ChildProcess } from 'child_process';
import path from 'path';
import util from 'util';

const execPromise = util.promisify(exec);
const ROOT_DIR = path.resolve(__dirname, '../../');
const CONFIG_PATH = path.join(ROOT_DIR, 'tests/e2e/mcp-config.json');

export interface ToolResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

/**
 * Wraps mcp-cli to call tools on the web-handoff server.
 */
export async function callTool(toolName: string, args: object): Promise<ToolResult> {
  // Ensure the server is built
  await execPromise('npm run build', { cwd: path.join(ROOT_DIR, 'mcp-server') });

  const argsString = JSON.stringify(args);
  const command = `mcp-cli --config ${CONFIG_PATH} call-tool web-handoff:${toolName} --args '${argsString}'`;

  try {
    const { stdout, stderr } = await execPromise(command);
    if (stderr && !stdout) {
       throw new Error(`mcp-cli error: ${stderr}`);
    }
    return JSON.parse(stdout) as ToolResult;
  } catch (error: any) {
    if (error.stdout) {
        // If it's a valid JSON error response from the tool
        try {
            return JSON.parse(error.stdout) as ToolResult;
        } catch (e) {
            throw new Error(`Failed to parse mcp-cli output: ${error.stdout}`);
        }
    }
    throw error;
  }
}

/**
 * Spawns mcp-cli to call tools asynchronously.
 * Returns a promise that resolves when the tool call completes.
 */
export function spawnTool(toolName: string, args: object): { process: ChildProcess, result: Promise<ToolResult> } {
  const argsString = JSON.stringify(args);
  const cp = spawn('mcp-cli', ['--config', CONFIG_PATH, 'call-tool', `web-handoff:${toolName}`, '--args', argsString]);
  
  let stdout = '';
  let stderr = '';

  const result = new Promise<ToolResult>((resolve, reject) => {
    cp.stdout.on('data', (data) => { stdout += data.toString(); });
    cp.stderr.on('data', (data) => { stderr += data.toString(); });
    
    cp.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(stdout));
        } catch (e) {
          reject(new Error(`Failed to parse mcp-cli output: ${stdout}`));
        }
      } else {
        // Try to parse error response if any
        try {
            resolve(JSON.parse(stdout));
        } catch (e) {
            reject(new Error(`mcp-cli exited with code ${code}. Stderr: ${stderr}`));
        }
      }
    });
  });

  return { process: cp, result };
}
