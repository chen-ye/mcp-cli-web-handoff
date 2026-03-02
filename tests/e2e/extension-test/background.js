console.log("Gemini Web Handoff Background Service Worker Initialized");

let socket = null;
let pingInterval = null;
const DAEMON_URL = "ws://127.0.0.1:8080/ext";

function startKeepAlive() {
  if (pingInterval) clearInterval(pingInterval);
  pingInterval = setInterval(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "ping" }));
    }
  }, 20000); // Ping every 20 seconds
}

function stopKeepAlive() {
  if (pingInterval) clearInterval(pingInterval);
  pingInterval = null;
}

function connect() {
  chrome.storage.local.get(["token"], (result) => {
    const token = result.token;
    if (!token) {
      console.log("No token found in storage. Awaiting user input in side panel.");
      return;
    }

    console.log("Connecting to WebSocket daemon...");
    socket = new WebSocket(`${DAEMON_URL}?token=${token}`);

    socket.onopen = () => {
      console.log("WebSocket connected to daemon.");
      chrome.storage.local.set({ connected: true });
      chrome.runtime.sendMessage({ type: "connectionStatus", connected: true });
      startKeepAlive();
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "payload") {
          console.log("Received payload from CLI");
          // Store the full payload
          chrome.storage.local.set({ 
            pendingPrompt: message.data.prompt,
            projectPath: message.data.projectPath,
            zipData: message.data.zipData
          }, () => {
            // Notify side panel if it's open
            chrome.runtime.sendMessage({ 
              type: "newPayload", 
              data: message.data 
            });
          });
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected. Retrying in 5 seconds...");
      chrome.storage.local.set({ connected: false });
      chrome.runtime.sendMessage({ type: "connectionStatus", connected: false });
      stopKeepAlive();
      setTimeout(connect, 5000);
    };
  });
}

// Handle messages from content script or side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "webResponse") {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "response", data: message.data }));
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: "WebSocket not connected" });
    }
  } else if (message.type === "responseComplete") {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "Gemini Web Handoff",
      message: "Gemini has finished generating the response.",
      priority: 2
    });
  }
});

// Initial connection attempt
connect();

// Listen for token updates from side panel
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.token) {
    console.log("Token updated, reconnecting...");
    if (socket) socket.close();
    connect();
  }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});

// Setup side panel behavior
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));
