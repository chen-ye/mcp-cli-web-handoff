import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const SIDE_PANEL_JS_PATH = path.resolve(__dirname, '../../chrome-extension/dist/sidepanel.js');
const SIDE_PANEL_JS = fs.readFileSync(SIDE_PANEL_JS_PATH, 'utf8');

const BACKGROUND_JS_PATH = path.resolve(__dirname, '../../chrome-extension/dist/background.js');
const BACKGROUND_JS = fs.readFileSync(BACKGROUND_JS_PATH, 'utf8');

test.describe('Extension Unit Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.coverage.startJSCoverage();
  });

  test.afterEach(async ({ page }, testInfo) => {
    const coverage = await page.coverage.stopJSCoverage();
    for (const entry of coverage) {
      if (entry.url === 'http://extension/sidepanel.js') {
        entry.source = fs.readFileSync(SIDE_PANEL_JS_PATH, 'utf8');
      } else if (entry.url === 'http://extension/background.js') {
        entry.source = fs.readFileSync(BACKGROUND_JS_PATH, 'utf8');
      }
    }
    await testInfo.attach('v8-coverage', {
      body: JSON.stringify(coverage),
      contentType: 'application/json',
    });
  });

  test.describe('Side Panel Logic', () => {
    test('should update UI when receiving a newPayload message', async ({
      page,
    }) => {
      // 1. Setup mock chrome environment and load sidepanel.js with inline sourcemap
      const sidepanelMap = fs.readFileSync(SIDE_PANEL_JS_PATH + '.map', 'utf8');
      const sidepanelInline = SIDE_PANEL_JS + `\n//# sourceMappingURL=data:application/json;base64,${Buffer.from(sidepanelMap).toString('base64')}\n//# sourceURL=http://extension/sidepanel.js`;

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
              get: (_keys: any, cb: any) => cb({}),
              set: (_data: any, cb: any) => cb?.(),
            },
          },
          runtime: {
            onMessage: {
              addListener: (listener: any) => {
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
      }, sidepanelInline);

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
      const backgroundMap = fs.readFileSync(BACKGROUND_JS_PATH + '.map', 'utf8');
      const backgroundInline = BACKGROUND_JS + `\n//# sourceMappingURL=data:application/json;base64,${Buffer.from(backgroundMap).toString('base64')}\n//# sourceURL=http://extension/background.js`;

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
                get: (_keys: any, cb: any) => cb({ token }),
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
            constructor(url: string) {
              logs.push(`WebSocket connecting to: ${url}`);
            }
          };

          // Execute background.js
          const scriptEl = document.createElement('script');
          scriptEl.textContent = script;
          document.body.appendChild(scriptEl);

          return logs;
        },
        { script: backgroundInline, token: mockToken },
      );

      expect(logs.some((l) => l.includes(`token=${mockToken}`))).toBe(true);
    });
  });
});
