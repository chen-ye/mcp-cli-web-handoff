import { WebSocketServer, WebSocket } from "ws";
import * as http from "http";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const PORT = 8080;
const TOKEN_FILE_PATH = path.join(os.homedir(), ".gemini", "web-handoff-token");
const IDLE_TIMEOUT_MS = 60000;

let currentToken: string = "";
let server: http.Server;
let wss: WebSocketServer;

const mcpClients = new Set<WebSocket>();
const extClients = new Set<WebSocket>();
let pendingPayloads: unknown[] = [];
let idleTimeout: NodeJS.Timeout | null = null;

// Track waiting MCP clients by handoff_id
const waitingMcpClients = new Map<string, Set<WebSocket>>();
// Store results that haven't been picked up yet
const pendingResults = new Map<string, string>();

function generateToken() {
  currentToken = crypto.randomBytes(32).toString("hex");
  // Ensure directory exists
  fs.mkdirSync(path.dirname(TOKEN_FILE_PATH), { recursive: true });
  fs.writeFileSync(TOKEN_FILE_PATH, currentToken, { mode: 0o600 });
}

function cleanup() {
  if (fs.existsSync(TOKEN_FILE_PATH)) {
    fs.unlinkSync(TOKEN_FILE_PATH);
  }
  process.exit(0);
}

function resetIdleTimeout() {
  if (idleTimeout) clearTimeout(idleTimeout);
  
  if (mcpClients.size === 0 && extClients.size === 0) {
    idleTimeout = setTimeout(() => {
      console.log("No active connections for 60 seconds. Shutting down.");
      cleanup();
    }, IDLE_TIMEOUT_MS);
  }
}

generateToken();

server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("MCP Web Handoff Daemon");
});

wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  try {
    const url = new URL(request.url || "", `http://${request.headers.host}`);
    const pathname = url.pathname;

    if (pathname === "/ext") {
      const token = url.searchParams.get("token");
      if (!token || token !== currentToken) {
        socket.write("HTTP/1.1 401 Unauthorized\\r\\n\\r\\n");
        socket.destroy();
        return;
      }
      wss.handleUpgrade(request, socket, head, (ws) => {
        extClients.add(ws);
        wss.emit("connection", ws, request, "ext");
      });
    } else if (pathname === "/mcp") {
      // Local MCP clients connect here
      wss.handleUpgrade(request, socket, head, (ws) => {
        mcpClients.add(ws);
        wss.emit("connection", ws, request, "mcp");
      });
    } else {
      socket.write("HTTP/1.1 404 Not Found\\r\\n\\r\\n");
      socket.destroy();
    }
  } catch (err) {
    socket.write("HTTP/1.1 400 Bad Request\\r\\n\\r\\n");
    socket.destroy();
  }
});

wss.on("connection", (ws: WebSocket, request: http.IncomingMessage, role: "ext" | "mcp") => {
  resetIdleTimeout();

  if (role === "ext") {
    console.log("Extension connected.");
    // Send any pending payloads
    while (pendingPayloads.length > 0) {
      const payload = pendingPayloads.shift();
      ws.send(JSON.stringify({ type: "payload", data: payload }));
    }
  } else if (role === "mcp") {
    console.log("MCP Client connected.");
  }

  ws.on("message", (message: string) => {
    resetIdleTimeout();
    console.log(`Daemon: Message received from ${role}: ${message.toString().slice(0, 100)}...`);
    
    try {
      const parsed = JSON.parse(message.toString());

      if (role === "mcp") {
        if (parsed.type === "payload" && parsed.data) {
          // Route to extension
          if (extClients.size > 0) {
            console.log(`Daemon: Routing MCP payload to ${extClients.size} extension(s)`);
            extClients.forEach(ext => ext.send(message.toString()));
          } else {
            console.log("Daemon: Buffering payload (no extensions connected)");
            pendingPayloads.push(parsed.data);
          }
        } else if (parsed.type === "subscribe" && parsed.handoff_id) {
          const id = parsed.handoff_id;
          console.log(`Daemon: MCP client subscribing to result for ${id}`);
          
          // If result already arrived, send it immediately
          if (pendingResults.has(id)) {
            console.log(`Daemon: Sending cached result for ${id} immediately`);
            ws.send(JSON.stringify({ type: "response", handoff_id: id, data: pendingResults.get(id) }));
            pendingResults.delete(id);
          } else {
            // Otherwise add to waiting list
            if (!waitingMcpClients.has(id)) {
              waitingMcpClients.set(id, new Set());
            }
            waitingMcpClients.get(id)!.add(ws);
          }
        }
      } else if (role === "ext") {
        if (parsed.type === "response" && parsed.handoff_id) {
          const id = parsed.handoff_id;
          const result = parsed.data;
          console.log(`Daemon: Received response for ${id} from extension`);

          const waiters = waitingMcpClients.get(id);
          if (waiters && waiters.size > 0) {
            console.log(`Daemon: Routing response to ${waiters.size} waiting MCP client(s)`);
            waiters.forEach(mcp => {
              mcp.send(JSON.stringify({ type: "response", handoff_id: id, data: result }));
            });
            waitingMcpClients.delete(id);
          } else {
            console.log(`Daemon: No waiters for ${id}, caching result`);
            pendingResults.set(id, result);
          }
        }
      }
    } catch(e) {
      console.error("Daemon: Error handling message:", e);
    }
  });

  ws.on("close", () => {
    if (role === "ext") extClients.delete(ws);
    if (role === "mcp") mcpClients.delete(ws);
    resetIdleTimeout();
  });
});

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Daemon listening on 127.0.0.1:${PORT}`);
  resetIdleTimeout();
});
