// Content Script for gemini.google.com

console.log('Gemini Web Handoff Content Script Loaded');

// Function to check if the Gemini interface is ready
function checkGeminiStatus() {
  const inputArea = document.querySelector('rich-textarea');
  if (inputArea) {
    chrome.runtime.sendMessage({ type: 'geminiStatus', ready: true });
  } else {
    chrome.runtime.sendMessage({ type: 'geminiStatus', ready: false });
  }
}

let isGenerating = false;

// Function to monitor response completion
function monitorCompletion() {
  const stopButton = document.querySelector(
    'button[aria-label="Stop generating"]',
  );

  if (stopButton && !isGenerating) {
    console.log('Gemini started generating...');
    isGenerating = true;
  } else if (!stopButton && isGenerating) {
    console.log('Gemini finished generating!');
    isGenerating = false;
    chrome.runtime.sendMessage({ type: 'responseComplete' });
  }
}

// Observe changes to detect when the interface might be ready or finished generating
const observer = new MutationObserver(() => {
  checkGeminiStatus();
  monitorCompletion();
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial check
checkGeminiStatus();
