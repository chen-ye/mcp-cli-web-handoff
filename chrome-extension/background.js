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
      startKeepAlive();
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "prompt") {
          console.log("Received prompt from CLI:", message.data);
          chrome.storage.local.set({ pendingPrompt: message.data }, () => {
            // Notify side panel if it's open
            chrome.runtime.sendMessage({ type: "newPrompt", data: message.data });
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
      stopKeepAlive();
      setTimeout(connect, 5000);
    };
  });
}

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
