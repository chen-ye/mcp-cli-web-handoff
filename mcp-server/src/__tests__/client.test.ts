import { ensureDaemonRunning, sendPromptToDaemon } from "../client";
import * as cp from "child_process";
import * as fs from "fs";
import { WebSocket } from "ws";

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
      (WebSocket as unknown as jest.Mock).mockImplementation(() => mockWs);
      (fs.readFileSync as jest.Mock).mockReturnValue("existing-token");

      const token = await ensureDaemonRunning();
      expect(token).toBe("existing-token");
      expect(mockWs.close).toHaveBeenCalled();
    });

    it("should spawn daemon if connection is refused", async () => {
      jest.useFakeTimers();

      let errorCallback: Function;
      const mockWs = {
        on: jest.fn().mockImplementation((event, callback) => {
          if (event === "error") {
            errorCallback = callback;
          }
        }),
        close: jest.fn(),
      };
      (WebSocket as unknown as jest.Mock).mockImplementation(() => mockWs);

      const mockChild = { unref: jest.fn() };
      (cp.spawn as jest.Mock).mockReturnValue(mockChild);
      (fs.readFileSync as jest.Mock).mockReturnValue("new-token");

      const promise = ensureDaemonRunning();
      
      // Simulate connection refused
      errorCallback!({ code: "ECONNREFUSED" });
      
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
      (WebSocket as unknown as jest.Mock).mockImplementation(() => mockWs);

      await sendPromptToDaemon("test prompt");
      
      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify({ type: "prompt", data: "test prompt" }));
      expect(mockWs.close).toHaveBeenCalled();
    });
  });
});
