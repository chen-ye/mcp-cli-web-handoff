import { WebSocketServer, WebSocket } from "ws";
import * as http from "http";
import * as crypto from "crypto";
import { URL } from "url";

let wss: WebSocketServer | null = null;
let server: http.Server | null = null;
let currentToken: string | null = null;
let pendingPrompt: string | null = null;

export function generateToken(): string {
  currentToken = crypto.randomBytes(32).toString("hex");
  return currentToken;
}

export function setPendingPrompt(prompt: string): void {
  pendingPrompt = prompt;
}

export function verifyToken(token: string): boolean {
  return currentToken !== null && token === currentToken;
}

export function startWebSocketServer(port: number = 8080): void {
  if (server) {
    return; // Already running
  }

  server = http.createServer((req, res) => {
    // Basic HTTP handler
    res.writeHead(200);
    res.end("MCP WebSocket Server");
  });

  wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    try {
      const url = new URL(request.url || "", `http://${request.headers.host}`);
      const token = url.searchParams.get("token");

      if (!token || !verifyToken(token)) {
        socket.write("HTTP/1.1 401 Unauthorized\\r\\n\\r\\n");
        socket.destroy();
        return;
      }

      wss?.handleUpgrade(request, socket, head, (ws) => {
        wss?.emit("connection", ws, request);
      });
    } catch (err) {
      socket.write("HTTP/1.1 400 Bad Request\\r\\n\\r\\n");
      socket.destroy();
    }
  });

  wss.on("connection", (ws: WebSocket) => {
    console.log("Browser extension connected securely via WebSocket.");
    
    // Send pending prompt if it exists
    if (pendingPrompt) {
      ws.send(JSON.stringify({ type: "prompt", data: pendingPrompt }));
      pendingPrompt = null; // Clear after sending
    }

    ws.on("message", (message: string) => {
      // Logic for handling messages from the browser extension
      console.log("Received from browser:", message.toString());
    });
    ws.on("close", () => {
      console.log("Browser extension disconnected.");
    });
  });

  server.listen(port, () => {
    console.log(`WebSocket server listening on port ${port}`);
  });
}

export function stopWebSocketServer(): void {
  if (wss) {
    wss.close();
    wss = null;
  }
  if (server) {
    server.close();
    server = null;
  }
  currentToken = null;
}
