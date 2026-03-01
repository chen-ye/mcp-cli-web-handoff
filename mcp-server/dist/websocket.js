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
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
exports.startWebSocketServer = startWebSocketServer;
exports.stopWebSocketServer = stopWebSocketServer;
const ws_1 = require("ws");
const http = __importStar(require("http"));
const crypto = __importStar(require("crypto"));
const url_1 = require("url");
let wss = null;
let server = null;
let currentToken = null;
function generateToken() {
    currentToken = crypto.randomBytes(32).toString("hex");
    return currentToken;
}
function verifyToken(token) {
    return currentToken !== null && token === currentToken;
}
function startWebSocketServer(port = 8080) {
    if (server) {
        return; // Already running
    }
    server = http.createServer((req, res) => {
        // Basic HTTP handler
        res.writeHead(200);
        res.end("MCP WebSocket Server");
    });
    wss = new ws_1.WebSocketServer({ noServer: true });
    server.on("upgrade", (request, socket, head) => {
        try {
            const url = new url_1.URL(request.url || "", `http://${request.headers.host}`);
            const token = url.searchParams.get("token");
            if (!token || !verifyToken(token)) {
                socket.write("HTTP/1.1 401 Unauthorized\\r\\n\\r\\n");
                socket.destroy();
                return;
            }
            wss?.handleUpgrade(request, socket, head, (ws) => {
                wss?.emit("connection", ws, request);
            });
        }
        catch (err) {
            socket.write("HTTP/1.1 400 Bad Request\\r\\n\\r\\n");
            socket.destroy();
        }
    });
    wss.on("connection", (ws) => {
        console.log("Browser extension connected securely via WebSocket.");
        ws.on("message", (message) => {
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
function stopWebSocketServer() {
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
