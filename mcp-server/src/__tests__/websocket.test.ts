import { WebSocketServer, WebSocket } from "ws";
import { startWebSocketServer, generateToken, verifyToken, stopWebSocketServer } from "../websocket";
import * as http from "http";

describe("WebSocket Server", () => {
  let port = 8080;

  afterEach(() => {
    stopWebSocketServer();
  });

  it("should generate a secure token", () => {
    const token = generateToken();
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(16);
  });

  it("should start the websocket server and reject without token", (done) => {
    startWebSocketServer(port);
    const ws = new WebSocket(`ws://localhost:${port}`);
    ws.on("error", (err) => {
      done();
    });
    ws.on("unexpected-response", (req, res) => {
      expect(res.statusCode).toBe(401);
      done();
    });
  });

  it("should accept connection with valid token in query params", (done) => {
    const token = generateToken();
    startWebSocketServer(port);
    
    const ws = new WebSocket(`ws://localhost:${port}?token=${token}`);
    ws.on("open", () => {
      expect(verifyToken(token)).toBe(true);
      ws.close();
      done();
    });
  });

  it("should reject connection with invalid token", (done) => {
    generateToken(); // generate a valid token but don't use it
    startWebSocketServer(port);
    
    const ws = new WebSocket(`ws://localhost:${port}?token=invalid`);
    ws.on("error", (err) => {
      // ws package might emit error on unexpected response
      done();
    });
    ws.on("unexpected-response", (req, res) => {
      expect(res.statusCode).toBe(401);
      done();
    });
  });
});
