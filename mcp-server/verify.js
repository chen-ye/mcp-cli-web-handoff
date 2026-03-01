const { handleDelegateWebResearch } = require("./dist/tools.js");
const { WebSocket } = require("ws");
const fs = require("fs");
const path = require("path");
const os = require("os");

async function verify() {
  console.log("Simulating Instance 1...");
  const res1 = await handleDelegateWebResearch({ prompt: "Prompt from Instance 1" });
  console.log("Instance 1 Response:", res1.content[0].text);

  console.log("Waiting a bit to ensure daemon is fully up...");
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log("Simulating Instance 2...");
  const res2 = await handleDelegateWebResearch({ prompt: "Prompt from Instance 2" });
  console.log("Instance 2 Response:", res2.content[0].text);

  console.log("Verifying token file...");
  const tokenPath = path.join(os.homedir(), ".gemini", "web-handoff-token");
  const token = fs.readFileSync(tokenPath, "utf-8");
  console.log("Token:", token);

  console.log("Connecting Extension Client...");
  const extWs = new WebSocket(`ws://127.0.0.1:8080/ext?token=${token}`);
  
  let promptsReceived = 0;
  extWs.on("message", (data) => {
    console.log("Extension received:", data.toString());
    promptsReceived++;
    if (promptsReceived === 2) {
      console.log("Verification successful! Closing.");
      extWs.close();
      process.exit(0);
    }
  });

  extWs.on("error", (err) => {
    console.error("Extension WS Error:", err);
    process.exit(1);
  });
}

verify().catch(err => {
  console.error(err);
  process.exit(1);
});
