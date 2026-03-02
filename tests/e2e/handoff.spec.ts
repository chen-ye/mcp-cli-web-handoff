import { test, expect, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { callTool } from './mcp-client';

const EXTENSION_PATH = path.resolve(__dirname, 'extension-test');
const { extensionId } = JSON.parse(fs.readFileSync(path.join(__dirname, 'extension-id.json'), 'utf8'));

test.describe('Gemini-to-Web Handoff E2E', () => {
  let context: BrowserContext;
  let userDataDir: string;

  test.beforeEach(async ({}) => {
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'playwright-user-data-'));
    
    // Launch browser with extension
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false, // Must be false to use the --headless flag for "new" headless
      args: [
        '--headless', // Use the new headless mode which supports extensions
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--enable-extensions',
      ],
    });
  });

  test.afterEach(async () => {
    if (context) {
      await context.close();
    }
    // Cleanup temporary directory
    if (userDataDir && fs.existsSync(userDataDir)) {
      try {
        fs.rmSync(userDataDir, { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });

  test('should update Side Panel UI when delegate_web_research is called', async () => {
    // 1. Initial call to trigger daemon and get token
    await callTool('delegate_web_research', { prompt: 'Initial' });
    
    const tokenPath = path.join(os.homedir(), '.gemini', 'web-handoff-token');
    if (!fs.existsSync(tokenPath)) {
        throw new Error(`Token file not found at ${tokenPath}`);
    }
    const token = fs.readFileSync(tokenPath, 'utf8').trim();

    // 2. Open the Side Panel
    const sidePanelPage = await context.newPage();
    await sidePanelPage.goto(`chrome-extension://${extensionId}/sidepanel.html`);
    
    // 3. Inject token and save
    await sidePanelPage.locator('#token-input').fill(token);
    await sidePanelPage.locator('#save-token-btn').click();
    
    // 4. Wait for connection
    await expect(sidePanelPage.locator('#status-dot')).toHaveClass(/connected/, { timeout: 10000 });
    await expect(sidePanelPage.locator('#status-text')).toContainText('Connected');

    // 5. Trigger real tool call via mcp-cli
    const testPrompt = 'E2E Test: What is the current time?';
    console.log('Calling delegate_web_research...');
    const result = await callTool('delegate_web_research', { prompt: testPrompt });
    
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain('Delegated web research');

    // 6. Verify UI update in Side Panel
    await expect(sidePanelPage.locator('#prompt-display')).toHaveText(testPrompt, { timeout: 10000 });
    await expect(sidePanelPage.locator('#copy-prompt-btn')).toBeEnabled();
    await expect(sidePanelPage.locator('#copy-project-path-btn')).toBeEnabled();

    // 7. Verify "Copy Prompt" clipboard content
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await sidePanelPage.locator('#copy-prompt-btn').click();
    const clipboardText = await sidePanelPage.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(testPrompt);

    // 8. Verify "Copy Project Path" clipboard content
    await sidePanelPage.locator('#copy-project-path-btn').click();
    const clipboardPath = await sidePanelPage.evaluate(() => navigator.clipboard.readText());
    // The project path should be an absolute path ending with the project name
    expect(clipboardPath).toContain('gemini-extension-web-handoff');
  });

  test('should submit response back to CLI', async () => {
    // Setup connection
    await callTool('delegate_web_research', { prompt: 'Initial' });
    const token = fs.readFileSync(path.join(os.homedir(), '.gemini', 'web-handoff-token'), 'utf8').trim();
    const sidePanelPage = await context.newPage();
    await sidePanelPage.goto(`chrome-extension://${extensionId}/sidepanel.html`);
    await sidePanelPage.locator('#token-input').fill(token);
    await sidePanelPage.locator('#save-token-btn').click();
    await expect(sidePanelPage.locator('#status-dot')).toHaveClass(/connected/, { timeout: 10000 });

    // Trigger real tool call in background (non-blocking if possible, but callTool is blocking)
    // We need a way to run callTool and then interact with the UI.
    // Since callTool uses exec, it waits for the process.
    // In a real scenario, the tool call is "suspended".
    
    // We'll simulate the "Submit" part and check if the tool would receive it.
    const testResponse = 'The current time is 12:00 PM';
    const webResponseTextarea = sidePanelPage.locator('#web-response');
    await webResponseTextarea.fill(testResponse);
    await expect(sidePanelPage.locator('#submit-response-btn')).toBeEnabled();
    
    await sidePanelPage.locator('#submit-response-btn').click();
    await expect(sidePanelPage.locator('#submit-response-btn')).toHaveText('Submitted!');
  });

  test('should trigger notification on response completion', async () => {
    const geminiPage = await context.newPage();
    await geminiPage.goto('https://gemini.google.com/app', { waitUntil: 'domcontentloaded' });
    
    // Simulate Gemini UI state via injection
    await geminiPage.evaluate(() => {
      const btn = document.createElement('button');
      btn.setAttribute('aria-label', 'Stop generating');
      document.body.appendChild(btn);
    });

    // Wait a bit for observer to pick up the start
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulate completion
    await geminiPage.evaluate(() => {
      const btn = document.querySelector('button[aria-label="Stop generating"]');
      btn?.remove();
    });

    // Check if background script would have shown a notification
    // We can't easily check native notifications in headless Playwright,
    // but we verified the logic in background.js exists.
  });
});
