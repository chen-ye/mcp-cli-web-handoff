const { chrome } = require('jest-chrome');
global.chrome = chrome;

// Mock chrome.sidePanel if not present
if (!chrome.sidePanel) {
  chrome.sidePanel = {
    setPanelBehavior: jest.fn().mockResolvedValue(undefined)
  };
}

// Mock WebSocket
global.WebSocket = jest.fn();
global.WebSocket.OPEN = 1;

describe('Background Service Worker WebSocket Logic', () => {
  let background;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetModules();
    jest.clearAllMocks();
    // We'll require the background script in each test to trigger its initialization
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should attempt to connect to the WebSocket server on initialization if token is present', () => {
    const mockToken = 'test-token';
    // We'll simulate token being in storage
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ token: mockToken });
    });

    background = require('../background.js');

    expect(global.WebSocket).toHaveBeenCalledWith(`ws://127.0.0.1:8080/ext?token=${mockToken}`);
  });

  it('should handle incoming prompt messages from WebSocket', () => {
    const mockToken = 'test-token';
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ token: mockToken });
    });

    const mockWs = {
      send: jest.fn(),
      onmessage: null,
      onopen: null,
      onerror: null,
      onclose: null,
      readyState: global.WebSocket.OPEN,
    };
    global.WebSocket.mockReturnValue(mockWs);

    background = require('../background.js');

    // Simulate WebSocket open
    mockWs.onopen();

    // Simulate receiving a prompt
    const mockPrompt = "Test research prompt";
    const event = { data: JSON.stringify({ type: 'prompt', data: mockPrompt }) };
    mockWs.onmessage(event);

    // Verify storage was updated with the new prompt
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ pendingPrompt: mockPrompt }, expect.any(Function));
  });

  it('should send periodic pings to keep the connection and service worker alive', () => {
    const mockToken = 'test-token';
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ token: mockToken });
    });

    const mockWs = {
      send: jest.fn(),
      onmessage: null,
      onopen: null,
      onerror: null,
      onclose: null,
      readyState: global.WebSocket.OPEN,
    };
    global.WebSocket.mockReturnValue(mockWs);

    background = require('../background.js');
    mockWs.onopen();

    // Fast forward 30 seconds
    jest.advanceTimersByTime(30000);

    expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify({ type: 'ping' }));
  });
});
