import * as cp from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { WebSocket } from "ws";

const PORT = 8080;
const TOKEN_FILE_PATH = path.join(os.homedir(), ".gemini", "web-handoff-token");

export async function ensureDaemonRunning(): Promise<string> {
  return new Promise((resolve, reject) => {
    // Try to connect to see if it's already running
    const ws = new WebSocket(`ws://127.0.0.1:${PORT}/mcp`);
    
    ws.on("open", () => {
      // Daemon is running. Read the token file.
      ws.close();
      resolveToken();
    });

    ws.on("error", (err: any) => {
      if (err.code === "ECONNREFUSED") {
        // Not running, spawn it
        startDaemon();
      } else {
        reject(err);
      }
    });

    function resolveToken() {
      try {
        const token = fs.readFileSync(TOKEN_FILE_PATH, "utf-8");
        resolve(token);
      } catch (e) {
        reject(new Error("Daemon is running but token file could not be read."));
      }
    }

    function startDaemon() {
      const daemonPath = path.join(__dirname, "daemon.js");
      const child = cp.spawn(process.execPath, [daemonPath], {
        detached: true,
        stdio: "ignore",
      });
      child.unref();

      // Wait a moment for it to start and write the token file
      setTimeout(() => {
        resolveToken();
      }, 500);
    }
  });
}

export function sendPromptToDaemon(prompt: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${PORT}/mcp`);
    
    ws.on("open", () => {
      ws.send(JSON.stringify({ type: "prompt", data: prompt }));
      ws.close();
      resolve();
    });

    ws.on("error", (err) => {
      reject(err);
    });
  });
}
