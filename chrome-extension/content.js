// Content Script for gemini.google.com

console.log("Gemini Web Handoff Content Script Loaded");

// Function to check if the Gemini interface is ready
function checkGeminiStatus() {
  const inputArea = document.querySelector('rich-textarea');
  if (inputArea) {
    chrome.runtime.sendMessage({ type: "geminiStatus", ready: true });
  } else {
    chrome.runtime.sendMessage({ type: "geminiStatus", ready: false });
  }
}

// Observe changes to detect when the interface might be ready
const observer = new MutationObserver(() => {
  checkGeminiStatus();
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial check
checkGeminiStatus();
