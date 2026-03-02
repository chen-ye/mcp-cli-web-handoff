// Side Panel UI Logic

const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const promptDisplay = document.getElementById('prompt-display');
const copyPromptBtn = document.getElementById('copy-prompt-btn');
const copyProjectPathBtn = document.getElementById('copy-project-path-btn');
const copyContextBtn = document.getElementById('copy-context-btn');
const webResponse = document.getElementById('web-response');
const submitResponseBtn = document.getElementById('submit-response-btn');
const tokenInput = document.getElementById('token-input');
const saveTokenBtn = document.getElementById('save-token-btn');

let currentProjectPath = null;
let currentZipData = null;

// Initialize UI from storage
chrome.storage.local.get(['token', 'pendingPrompt', 'projectPath', 'zipData', 'connected'], (result) => {
  if (result.token) {
    tokenInput.value = result.token;
  }
  if (result.pendingPrompt) {
    updatePayloadUI({
      prompt: result.pendingPrompt,
      projectPath: result.projectPath,
      zipData: result.zipData
    });
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

function updatePayloadUI(payload) {
  promptDisplay.textContent = payload.prompt || '';
  copyPromptBtn.disabled = !payload.prompt;
  
  currentProjectPath = payload.projectPath;
  copyProjectPathBtn.disabled = !currentProjectPath;

  currentZipData = payload.zipData;
  copyContextBtn.disabled = !currentZipData;
}

// Handle messages from background worker
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'newPayload') {
    updatePayloadUI(message.data);
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

// Helper for copy buttons
async function handleCopy(btn, action) {
  const originalText = btn.textContent;
  try {
    await action();
    btn.textContent = 'Copied!';
  } catch (err) {
    console.error('Failed to copy:', err);
    btn.textContent = 'Error!';
  }
  setTimeout(() => {
    btn.textContent = originalText;
  }, 2000);
}

// Copy Prompt to Clipboard
copyPromptBtn.addEventListener('click', () => {
  const prompt = promptDisplay.textContent;
  if (prompt) {
    handleCopy(copyPromptBtn, () => navigator.clipboard.writeText(prompt));
  }
});

// Copy Project Path to Clipboard
copyProjectPathBtn.addEventListener('click', () => {
  if (currentProjectPath) {
    handleCopy(copyProjectPathBtn, () => navigator.clipboard.writeText(currentProjectPath));
  }
});

// Copy Context ZIP to Clipboard
function base64ToBlob(base64, mime) {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mime });
}

copyContextBtn.addEventListener('click', () => {
  if (currentZipData) {
    handleCopy(copyContextBtn, async () => {
      const blob = base64ToBlob(currentZipData, 'application/zip');
      const item = new ClipboardItem({ 'application/zip': blob });
      await navigator.clipboard.write([item]);
    });
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
