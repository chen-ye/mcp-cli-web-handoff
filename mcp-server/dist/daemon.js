"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const http = __importStar(require("http"));
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const PORT = 8080;
const TOKEN_FILE_PATH = path.join(os.homedir(), ".gemini", "web-handoff-token");
const IDLE_TIMEOUT_MS = 60000;
let currentToken = "";
let server;
let wss;
const mcpClients = new Set();
const extClients = new Set();
let pendingPrompts = [];
let idleTimeout = null;
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
    if (idleTimeout)
        clearTimeout(idleTimeout);
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
wss = new ws_1.WebSocketServer({ noServer: true });
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
        }
        else if (pathname === "/mcp") {
            // Local MCP clients connect here
            wss.handleUpgrade(request, socket, head, (ws) => {
                mcpClients.add(ws);
                wss.emit("connection", ws, request, "mcp");
            });
        }
        else {
            socket.write("HTTP/1.1 404 Not Found\\r\\n\\r\\n");
            socket.destroy();
        }
    }
    catch (err) {
        socket.write("HTTP/1.1 400 Bad Request\\r\\n\\r\\n");
        socket.destroy();
    }
});
wss.on("connection", (ws, request, role) => {
    resetIdleTimeout();
    if (role === "ext") {
        console.log("Extension connected.");
        // Send any pending prompts
        while (pendingPrompts.length > 0) {
            const prompt = pendingPrompts.shift();
            ws.send(JSON.stringify({ type: "prompt", data: prompt }));
        }
    }
    else if (role === "mcp") {
        console.log("MCP Client connected.");
    }
    ws.on("message", (message) => {
        resetIdleTimeout();
        if (role === "mcp") {
            // Message from MCP client (e.g. a new prompt)
            // Route to extension
            if (extClients.size > 0) {
                extClients.forEach(ext => ext.send(message.toString()));
            }
            else {
                // Buffer if no extensions are connected yet
                try {
                    const parsed = JSON.parse(message.toString());
                    if (parsed.type === "prompt" && typeof parsed.data === "string") {
                        pendingPrompts.push(parsed.data);
                    }
                }
                catch (e) {
                    // ignore invalid json
                }
            }
        }
        else if (role === "ext") {
            // Message from Extension (e.g. response from web)
            // Route back to MCP clients
            mcpClients.forEach(mcp => mcp.send(message.toString()));
        }
    });
    ws.on("close", () => {
        if (role === "ext")
            extClients.delete(ws);
        if (role === "mcp")
            mcpClients.delete(ws);
        resetIdleTimeout();
    });
});
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
server.listen(PORT, "127.0.0.1", () => {
    console.log(`Daemon listening on 127.0.0.1:${PORT}`);
    resetIdleTimeout();
});
