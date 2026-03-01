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
exports.ensureDaemonRunning = ensureDaemonRunning;
exports.sendPromptToDaemon = sendPromptToDaemon;
const cp = __importStar(require("child_process"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const ws_1 = require("ws");
const PORT = 8080;
const TOKEN_FILE_PATH = path.join(os.homedir(), ".gemini", "web-handoff-token");
async function ensureDaemonRunning() {
    return new Promise((resolve, reject) => {
        // Try to connect to see if it's already running
        const ws = new ws_1.WebSocket(`ws://127.0.0.1:${PORT}/mcp`);
        ws.on("open", () => {
            // Daemon is running. Read the token file.
            ws.close();
            resolveToken();
        });
        ws.on("error", (err) => {
            if (err.code === "ECONNREFUSED") {
                // Not running, spawn it
                startDaemon();
            }
            else {
                reject(err);
            }
        });
        function resolveToken() {
            try {
                const token = fs.readFileSync(TOKEN_FILE_PATH, "utf-8");
                resolve(token);
            }
            catch (e) {
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
function sendPromptToDaemon(prompt) {
    return new Promise((resolve, reject) => {
        const ws = new ws_1.WebSocket(`ws://127.0.0.1:${PORT}/mcp`);
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
