import * as cp from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { WebSocket } from 'ws';

const PORT = 8080;
const TOKEN_FILE_PATH = path.join(os.homedir(), '.gemini', 'web-handoff-token');

export interface ClientDependencies {
  WebSocket: typeof WebSocket;
  spawn: typeof cp.spawn;
  readFileSync: typeof fs.readFileSync;
}

const defaultDeps: ClientDependencies = {
  WebSocket,
  spawn: cp.spawn,
  readFileSync: fs.readFileSync,
};

export function ensureDaemonRunning(
  deps: ClientDependencies = defaultDeps,
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Try to connect to see if it's already running
    const ws = new deps.WebSocket(`ws://127.0.0.1:${PORT}/mcp`);

    ws.on('open', () => {
      // Daemon is running. Read the token file.
      ws.close();
      resolveToken();
    });

    ws.on('error', (err: { code?: string }) => {
      if (err.code === 'ECONNREFUSED') {
        // Not running, spawn it
        startDaemon();
      } else {
        reject(err);
      }
    });

    function resolveToken() {
      try {
        const token = deps.readFileSync(TOKEN_FILE_PATH, 'utf-8');
        resolve(token);
      } catch (_e) {
        reject(
          new Error('Daemon is running but token file could not be read.'),
        );
      }
    }

    function startDaemon() {
      const daemonPath = path.join(__dirname, 'daemon.js');
      const logPath = path.join(
        os.homedir(),
        '.gemini',
        'web-handoff-daemon.log',
      );
      const out = fs.openSync(logPath, 'a');
      const err = fs.openSync(logPath, 'a');

      const child = deps.spawn(process.execPath, [daemonPath], {
        detached: true,
        stdio: ['ignore', out, err],
      });
      child.unref();

      // Wait a moment for it to start and write the token file
      setTimeout(() => {
        resolveToken();
      }, 500);
    }
  });
}

export interface DaemonPayload {
  handoff_id: string;
  prompt: string;
  projectPath: string;
  zipData?: string; // base64 encoded
}

/**
 * Sends the payload to the daemon without blocking for the research result.
 */
export function sendPayloadToDaemon(
  payload: DaemonPayload,
  deps: ClientDependencies = defaultDeps,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const ws = new deps.WebSocket(`ws://127.0.0.1:${PORT}/mcp`);

    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'payload', data: payload }));
      ws.close();
      resolve();
    });

    ws.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Blocks and waits for the research result associated with a handoff_id.
 */
export function waitForResult(
  handoff_id: string,
  deps: ClientDependencies = defaultDeps,
  timeoutMs: number = 30 * 60 * 1000, // Default 30 minutes
): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log(`Client: Connecting to daemon to wait for ${handoff_id}...`);
    const ws = new deps.WebSocket(`ws://127.0.0.1:${PORT}/mcp`);

    let timeout: NodeJS.Timeout;

    ws.on('open', () => {
      console.log(
        `Client: Connected to daemon, subscribing to ${handoff_id}...`,
      );
      // Send a request to the daemon to wait for this ID
      ws.send(JSON.stringify({ type: 'subscribe', handoff_id }));

      timeout = setTimeout(() => {
        ws.close();
        reject(
          new Error('Timeout waiting for research response from browser.'),
        );
      }, timeoutMs);
    });

    ws.on('message', (data) => {
      console.log(
        `Client: Message received from daemon: ${data.toString().slice(0, 100)}...`,
      );
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'response' && message.handoff_id === handoff_id) {
          console.log(
            `Client: Matching response found for ${handoff_id}, resolving.`,
          );
          clearTimeout(timeout);
          ws.close();
          resolve(message.data);
        }
      } catch (_e) {
        // ignore invalid json
      }
    });

    ws.on('error', (err) => {
      console.error(`Client: WebSocket error:`, err);
      clearTimeout(timeout);
      reject(err);
    });

    ws.on('close', () => {
      console.log(`Client: WebSocket closed.`);
      clearTimeout(timeout);
    });
  });
}
