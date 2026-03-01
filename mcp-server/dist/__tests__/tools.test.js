"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tools_1 = require("../tools");
jest.mock("../client", () => ({
    ensureDaemonRunning: jest.fn().mockResolvedValue("mock-token"),
    sendPromptToDaemon: jest.fn().mockResolvedValue(undefined),
}));
describe("delegate_web_research tool", () => {
    it("should validate the input schema", () => {
        const result = tools_1.delegateWebResearchSchema.safeParse({ prompt: "What is the latest React version?" });
        expect(result.success).toBe(true);
    });
    it("should fail validation if prompt is missing", () => {
        const result = tools_1.delegateWebResearchSchema.safeParse({});
        expect(result.success).toBe(false);
    });
    it("should return a suspension message when handled", async () => {
        const response = await (0, tools_1.handleDelegateWebResearch)({ prompt: "test" });
        expect(response.isError).toBeUndefined();
        expect(response.content[0].text).toContain("Delegated web research");
        expect(response.content[0].text).toContain("mock-token");
    });
});
