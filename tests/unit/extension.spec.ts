import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const SIDE_PANEL_JS = fs.readFileSync(
  path.resolve(__dirname, '../../chrome-extension/sidepanel.js'),
  'utf8',
);
const BACKGROUND_JS = fs.readFileSync(
  path.resolve(__dirname, '../../chrome-extension/background.js'),
  'utf8',
);

test.describe('Extension Unit Tests', () => {
  test.describe('Side Panel Logic', () => {
    test('should update UI when receiving a newPayload message', async ({
      page,
    }) => {
      // 1. Setup mock chrome environment and load sidepanel.js
      await page.setContent(`
        <div id="status-dot"></div>
        <div id="status-text"></div>
        <div id="prompt-display"></div>
        <button id="copy-prompt-btn"></button>
        <button id="copy-project-path-btn"></button>
        <button id="copy-context-btn"></button>
        <textarea id="web-response"></textarea>
        <button id="submit-response-btn"></button>
        <input id="token-input" type="password">
        <button id="save-token-btn"></button>
      `);

      await page.evaluate((script) => {
        // Mock chrome API
        // biome-ignore lint/suspicious/noExplicitAny: mocking global chrome
        (window as any).chrome = {
          storage: {
            local: {
              get: (_keys, cb) => cb({}),
              set: (_data, cb) => cb?.(),
            },
          },
          runtime: {
            onMessage: {
              addListener: (listener) => {
                // biome-ignore lint/suspicious/noExplicitAny: mocking listener
                (window as any).messageListener = listener;
              },
            },
            sendMessage: () => {},
          },
        };

        // Execute sidepanel.js logic
        const scriptEl = document.createElement('script');
        scriptEl.textContent = script;
        document.body.appendChild(scriptEl);
      }, SIDE_PANEL_JS);

      // 2. Simulate newPayload message
      const mockPayload = {
        prompt: 'Test Prompt',
        projectPath: '/test/path',
        zipData: 'mock-zip',
      };

      await page.evaluate((payload) => {
        // biome-ignore lint/suspicious/noExplicitAny: triggering mock listener
        (window as any).messageListener({ type: 'newPayload', data: payload });
      }, mockPayload);

      // 3. Assertions
      const promptText = await page.$eval(
        '#prompt-display',
        (el) => el.textContent,
      );
      expect(promptText).toBe('Test Prompt');

      const isPromptEnabled = await page.$eval(
        '#copy-prompt-btn',
        (el) => !el.disabled,
      );
      expect(isPromptEnabled).toBe(true);
    });
  });

  test.describe('Background Logic', () => {
    test('should attempt connection when token is available', async ({
      page,
    }) => {
      const mockToken = 'test-token';

      const logs = await page.evaluate(
        // biome-ignore lint/suspicious/useAwait: evaluating in browser
        async ({ script, token }) => {
          const logs: string[] = [];
          const _originalConsoleLog = console.log;
          console.log = (...args) => logs.push(args.join(' '));

          // Mock chrome API
          // biome-ignore lint/suspicious/noExplicitAny: mocking global chrome
          (window as any).chrome = {
            storage: {
              local: {
                get: (_keys, cb) => cb({ token }),
                set: () => {},
                onChanged: { addListener: () => {} },
              },
            },
            runtime: {
              onMessage: { addListener: () => {} },
              onInstalled: { addListener: () => {} },
              sendMessage: () => {},
            },
            sidePanel: { setPanelBehavior: () => Promise.resolve() },
          };

          // Mock WebSocket
          // biome-ignore lint/suspicious/noExplicitAny: mocking global WebSocket
          (window as any).WebSocket = class {
            constructor(url) {
              logs.push(`WebSocket connecting to: ${url}`);
            }
          };

          // Execute background.js
          const scriptEl = document.createElement('script');
          scriptEl.textContent = script;
          document.body.appendChild(scriptEl);

          return logs;
        },
        { script: BACKGROUND_JS, token: mockToken },
      );

      expect(logs.some((l) => l.includes(`token=${mockToken}`))).toBe(true);
    });
  });
});
