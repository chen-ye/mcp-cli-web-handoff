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
const client_1 = require("../client");
const cp = __importStar(require("child_process"));
const fs = __importStar(require("fs"));
const ws_1 = require("ws");
jest.mock("child_process");
jest.mock("fs");
jest.mock("ws");
describe("client", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe("ensureDaemonRunning", () => {
        it("should resolve token if daemon is already running", async () => {
            const mockWs = {
                on: jest.fn().mockImplementation((event, callback) => {
                    if (event === "open") {
                        callback();
                    }
                }),
                close: jest.fn(),
            };
            ws_1.WebSocket.mockImplementation(() => mockWs);
            fs.readFileSync.mockReturnValue("existing-token");
            const token = await (0, client_1.ensureDaemonRunning)();
            expect(token).toBe("existing-token");
            expect(mockWs.close).toHaveBeenCalled();
        });
        it("should spawn daemon if connection is refused", async () => {
            jest.useFakeTimers();
            let errorCallback;
            const mockWs = {
                on: jest.fn().mockImplementation((event, callback) => {
                    if (event === "error") {
                        errorCallback = callback;
                    }
                }),
                close: jest.fn(),
            };
            ws_1.WebSocket.mockImplementation(() => mockWs);
            const mockChild = { unref: jest.fn() };
            cp.spawn.mockReturnValue(mockChild);
            fs.readFileSync.mockReturnValue("new-token");
            const promise = (0, client_1.ensureDaemonRunning)();
            // Simulate connection refused
            errorCallback({ code: "ECONNREFUSED" });
            expect(cp.spawn).toHaveBeenCalled();
            expect(mockChild.unref).toHaveBeenCalled();
            // Fast forward the setTimeout
            jest.runAllTimers();
            const token = await promise;
            expect(token).toBe("new-token");
            jest.useRealTimers();
        });
    });
    describe("sendPromptToDaemon", () => {
        it("should send prompt and resolve when connected", async () => {
            const mockWs = {
                on: jest.fn().mockImplementation((event, callback) => {
                    if (event === "open") {
                        callback();
                    }
                }),
                send: jest.fn(),
                close: jest.fn(),
            };
            ws_1.WebSocket.mockImplementation(() => mockWs);
            await (0, client_1.sendPromptToDaemon)("test prompt");
            expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify({ type: "prompt", data: "test prompt" }));
            expect(mockWs.close).toHaveBeenCalled();
        });
    });
});
