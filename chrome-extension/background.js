console.log("Gemini Web Handoff Background Service Worker Initialized");

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});

// Setup side panel behavior
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));
