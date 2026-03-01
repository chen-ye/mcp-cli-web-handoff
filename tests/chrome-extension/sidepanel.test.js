/**
 * @jest-environment jsdom
 */
const { chrome } = require('jest-chrome');
global.chrome = chrome;

describe('Side Panel JavaScript Logic', () => {
  let sidepanel;
  let messageListener;

  beforeEach(() => {
    // Ensure it's a mock
    if (!jest.isMockFunction(chrome.runtime.onMessage.addListener)) {
      chrome.runtime.onMessage.addListener = jest.fn();
    }
    chrome.runtime.onMessage.addListener.mockImplementation((listener) => {
      messageListener = listener;
    });
    document.body.innerHTML = `
      <div id="status-dot"></div>
      <span id="status-text"></span>
      <div id="prompt-display"></div>
      <button id="copy-prompt-btn"></button>
      <button id="copy-context-btn"></button>
      <textarea id="web-response"></textarea>
      <button id="submit-response-btn"></button>
      <input id="token-input" type="password">
      <button id="save-token-btn"></button>
    `;
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('should update the prompt display when receiving a newPrompt message', () => {
    // Initial sidepanel load logic
    require('../../chrome-extension/sidepanel.js');

    const mockPrompt = "New Test Prompt";
    const message = { type: 'newPrompt', data: mockPrompt };
    
    // Trigger the listener
    messageListener(message);

    expect(document.getElementById('prompt-display').textContent).toBe(mockPrompt);
    expect(document.getElementById('copy-prompt-btn').disabled).toBe(false);
  });

  it('should save the token when the save button is clicked', () => {
    require('../../chrome-extension/sidepanel.js');

    const tokenInput = document.getElementById('token-input');
    const saveBtn = document.getElementById('save-token-btn');
    const mockToken = "secret-token";

    tokenInput.value = mockToken;
    saveBtn.click();

    expect(chrome.storage.local.set).toHaveBeenCalledWith({ token: mockToken }, expect.any(Function));
  });
});
