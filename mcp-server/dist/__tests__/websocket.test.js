"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const websocket_1 = require("../websocket");
describe("WebSocket Server", () => {
    let port = 8080;
    afterEach(() => {
        (0, websocket_1.stopWebSocketServer)();
    });
    it("should generate a secure token", () => {
        const token = (0, websocket_1.generateToken)();
        expect(typeof token).toBe("string");
        expect(token.length).toBeGreaterThan(16);
    });
    it("should start the websocket server and reject without token", (done) => {
        (0, websocket_1.startWebSocketServer)(port);
        const ws = new ws_1.WebSocket(`ws://localhost:${port}`);
        ws.on("error", (err) => {
            done();
        });
        ws.on("unexpected-response", (req, res) => {
            expect(res.statusCode).toBe(401);
            done();
        });
    });
    it("should accept connection with valid token in query params", (done) => {
        const token = (0, websocket_1.generateToken)();
        (0, websocket_1.startWebSocketServer)(port);
        const ws = new ws_1.WebSocket(`ws://localhost:${port}?token=${token}`);
        ws.on("open", () => {
            expect((0, websocket_1.verifyToken)(token)).toBe(true);
            ws.close();
            done();
        });
    });
    it("should reject connection with invalid token", (done) => {
        (0, websocket_1.generateToken)(); // generate a valid token but don't use it
        (0, websocket_1.startWebSocketServer)(port);
        const ws = new ws_1.WebSocket(`ws://localhost:${port}?token=invalid`);
        ws.on("error", (err) => {
            done();
        });
        ws.on("unexpected-response", (req, res) => {
            expect(res.statusCode).toBe(401);
            done();
        });
    });
    it("should receive pending prompt upon connection", (done) => {
        const token = (0, websocket_1.generateToken)();
        (0, websocket_1.setPendingPrompt)("Test research prompt");
        (0, websocket_1.startWebSocketServer)(port);
        const ws = new ws_1.WebSocket(`ws://localhost:${port}?token=${token}`);
        ws.on("message", (data) => {
            const parsed = JSON.parse(data.toString());
            expect(parsed.type).toBe("prompt");
            expect(parsed.data).toBe("Test research prompt");
            ws.close();
            done();
        });
    });
});
