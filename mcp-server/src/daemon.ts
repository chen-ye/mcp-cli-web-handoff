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
    if (role === "mcp") {
      // Message from MCP client (e.g. a new prompt)
      // Route to extension
      if (extClients.size > 0) {
        extClients.forEach(ext => ext.send(message.toString()));
      } else {
        // Buffer if no extensions are connected yet
        try {
          const parsed = JSON.parse(message.toString());
          if (parsed.type === "payload" && parsed.data) {
            pendingPayloads.push(parsed.data);
          }
        } catch(e) {
          // ignore invalid json
        }
      }
    } else if (role === "ext") {
      // Message from Extension (e.g. response from web)
      // Route back to MCP clients
      mcpClients.forEach(mcp => mcp.send(message.toString()));
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
