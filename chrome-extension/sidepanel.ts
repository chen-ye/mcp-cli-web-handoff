// Side Panel UI Logic

const statusDot = document.getElementById('status-dot') as HTMLDivElement;
const statusText = document.getElementById('status-text') as HTMLSpanElement;
const promptDisplay = document.getElementById('prompt-display') as HTMLDivElement;
const copyPromptBtn = document.getElementById(
  'copy-prompt-btn',
) as HTMLButtonElement;
const copyProjectPathBtn = document.getElementById(
  'copy-project-path-btn',
) as HTMLButtonElement;
const copyContextBtn = document.getElementById(
  'copy-context-btn',
) as HTMLButtonElement;
const webResponse = document.getElementById('web-response') as HTMLTextAreaElement;
const submitResponseBtn = document.getElementById(
  'submit-response-btn',
) as HTMLButtonElement;
const tokenInput = document.getElementById('token-input') as HTMLInputElement;
const saveTokenBtn = document.getElementById(
  'save-token-btn',
) as HTMLButtonElement;

let currentProjectPath: string | null = null;
let currentZipData: string | null = null;
let currentHandoffId: string | null = null;

// Initialize UI from storage
chrome.storage.local.get(
  [
    'token',
    'pendingPrompt',
    'projectPath',
    'zipData',
    'handoffId',
    'connected',
  ],
  (result) => {
    if (result['token']) {
      tokenInput.value = result['token'];
    }
    if (result['pendingPrompt']) {
      updatePayloadUI({
        prompt: result['pendingPrompt'],
        projectPath: result['projectPath'],
        zipData: result['zipData'],
        handoff_id: result['handoffId'],
      });
    }
    updateConnectionStatus(result['connected'] || false);
  },
);

function updateConnectionStatus(connected: boolean) {
  if (connected) {
    statusDot.classList.add('connected');
    statusText.textContent = 'Connected';
  } else {
    statusDot.classList.remove('connected');
    statusText.textContent = 'Disconnected';
  }
}

interface Payload {
  prompt?: string;
  projectPath?: string;
  zipData?: string;
  handoff_id?: string;
}

function updatePayloadUI(payload: Payload) {
  promptDisplay.textContent = payload.prompt || '';
  copyPromptBtn.disabled = !payload.prompt;

  currentProjectPath = payload.projectPath || null;
  copyProjectPathBtn.disabled = !currentProjectPath;

  currentZipData = payload.zipData || null;
  copyContextBtn.disabled = !currentZipData;

  currentHandoffId = payload.handoff_id || null;
}

// Handle messages from background worker
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'newPayload') {
    console.log(
      'Sidepanel: Received newPayload with ID:',
      message.data.handoff_id,
    );
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
async function handleCopy(btn: HTMLButtonElement, action: () => Promise<void>) {
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
    handleCopy(copyProjectPathBtn, () =>
      navigator.clipboard.writeText(currentProjectPath as string),
    );
  }
});

// Copy Context ZIP to Clipboard
function base64ToBlob(base64: string, mime: string) {
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
      const blob = base64ToBlob(currentZipData as string, 'application/zip');
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
    chrome.runtime.sendMessage(
      {
        type: 'webResponse',
        data: response,
        handoffId: currentHandoffId,
      },
      (result) => {
        if (result?.success) {
          webResponse.value = '';
          submitResponseBtn.disabled = true;
          const originalText = submitResponseBtn.textContent;
          submitResponseBtn.textContent = 'Submitted!';
          setTimeout(() => {
            submitResponseBtn.textContent = originalText;
            submitResponseBtn.disabled = false;
          }, 2000);
        } else {
          alert(`Failed to submit: ${result?.error || 'Unknown error'}`);
        }
      },
    );
  }
});
