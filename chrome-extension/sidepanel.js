// Side Panel UI Logic

const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const promptDisplay = document.getElementById('prompt-display');
const copyPromptBtn = document.getElementById('copy-prompt-btn');
const copyContextBtn = document.getElementById('copy-context-btn');
const webResponse = document.getElementById('web-response');
const submitResponseBtn = document.getElementById('submit-response-btn');
const tokenInput = document.getElementById('token-input');
const saveTokenBtn = document.getElementById('save-token-btn');

// Initialize UI from storage
chrome.storage.local.get(['token', 'pendingPrompt', 'connected'], (result) => {
  if (result.token) {
    tokenInput.value = result.token;
  }
  if (result.pendingPrompt) {
    updatePromptUI(result.pendingPrompt);
  }
  updateConnectionStatus(result.connected || false);
});

function updateConnectionStatus(connected) {
  if (connected) {
    statusDot.classList.add('connected');
    statusText.textContent = 'Connected';
  } else {
    statusDot.classList.remove('connected');
    statusText.textContent = 'Disconnected';
  }
}

function updatePromptUI(prompt) {
  promptDisplay.textContent = prompt;
  copyPromptBtn.disabled = !prompt;
  // Context button logic will be added in a later phase
  copyContextBtn.disabled = true; 
}

// Handle messages from background worker
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'newPrompt') {
    updatePromptUI(message.data);
  } else if (message.type === 'connectionStatus') {
    updateConnectionStatus(message.connected);
  } else if (message.type === 'geminiStatus') {
    if (message.ready) {
      statusText.textContent = 'Connected (Gemini Ready)';
    } else if (statusText.textContent.includes('Connected')) {
      statusText.textContent = 'Connected';
    }
  }
});

// Copy Prompt to Clipboard
copyPromptBtn.addEventListener('click', async () => {
  const prompt = promptDisplay.textContent;
  if (prompt) {
    try {
      await navigator.clipboard.writeText(prompt);
      const originalText = copyPromptBtn.textContent;
      copyPromptBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyPromptBtn.textContent = originalText;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
  }
});

// Save Token
saveTokenBtn.addEventListener('click', () => {
  const token = tokenInput.value.trim();
  if (token) {
    chrome.storage.local.set({ token }, () => {
      const originalText = saveTokenBtn.textContent;
      saveTokenBtn.textContent = 'Saved!';
      setTimeout(() => {
        saveTokenBtn.textContent = originalText;
      }, 2000);
    });
  }
});

// Handle Response Submission
webResponse.addEventListener('input', () => {
  submitResponseBtn.disabled = !webResponse.value.trim();
});

submitResponseBtn.addEventListener('click', () => {
  const response = webResponse.value.trim();
  if (response) {
    // Send response to background to forward to CLI
    chrome.runtime.sendMessage({ type: 'webResponse', data: response }, () => {
      webResponse.value = '';
      submitResponseBtn.disabled = true;
      const originalText = submitResponseBtn.textContent;
      submitResponseBtn.textContent = 'Submitted!';
      setTimeout(() => {
        submitResponseBtn.textContent = originalText;
      }, 2000);
    });
  }
});
