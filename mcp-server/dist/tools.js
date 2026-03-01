"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delegateWebResearchSchema = void 0;
exports.handleDelegateWebResearch = handleDelegateWebResearch;
const zod_1 = require("zod");
exports.delegateWebResearchSchema = zod_1.z.object({
    prompt: zod_1.z.string().describe("The research prompt to delegate to the web interface"),
});
async function handleDelegateWebResearch(args) {
    // We will return a specific message to the CLI agent that instructs it to pause execution
    // while the local WebSocket Server waits for a response from the browser extension.
    return {
        content: [{ type: "text", text: "Delegated web research. Awaiting response via WebSocket." }]
    };
}
