"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delegateWebResearchSchema = void 0;
exports.handleDelegateWebResearch = handleDelegateWebResearch;
const zod_1 = require("zod");
const client_1 = require("./client");
exports.delegateWebResearchSchema = zod_1.z.object({
    prompt: zod_1.z.string().describe("The research prompt to delegate to the web interface"),
});
async function handleDelegateWebResearch(args) {
    try {
        const token = await (0, client_1.ensureDaemonRunning)();
        await (0, client_1.sendPromptToDaemon)(args.prompt);
        return {
            content: [{
                    type: "text",
                    text: `Delegated web research. Awaiting response via WebSocket.\nConnect Chrome Extension using ws://127.0.0.1:8080/ext?token=${token}`
                }]
        };
    }
    catch (error) {
        return {
            content: [{
                    type: "text",
                    text: `Failed to delegate web research: ${error.message}`
                }],
            isError: true
        };
    }
}
