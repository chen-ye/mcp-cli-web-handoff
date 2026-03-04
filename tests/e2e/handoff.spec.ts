import { exec } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import util from 'node:util';
import { type BrowserContext, chromium, expect, test } from '@playwright/test';
import { spawnTool } from './mcp-client';

const execPromise = util.promisify(exec);
const EXTENSION_PATH = path.resolve(__dirname, 'extension-test');
const { extensionId } = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'extension-id.json'), 'utf8'),
);

test.describe('Gemini-to-Web Handoff E2E (Two-Step Flow)', () => {
  let context: BrowserContext;
  let userDataDir: string;

  test.setTimeout(60000);

  test.beforeAll(async () => {
    // Build server once
    await execPromise('npm run build', {
      cwd: path.resolve(__dirname, '../../mcp-server'),
    });
  });

  test.beforeEach(async () => {
    userDataDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'playwright-user-data-'),
    );

    // Launch browser with extension
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        '--headless',
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
    if (userDataDir && fs.existsSync(userDataDir)) {
      try {
        fs.rmSync(userDataDir, { recursive: true, force: true });
      } catch (_e) {}
    }
  });

  test('should delegate research and then retrieve result blocking', async () => {
    // 1. Initial call to trigger daemon and get token
    const setup = spawnTool('delegate_web_research', { prompt: 'Setup' });

    const tokenPath = path.join(os.homedir(), '.gemini', 'web-handoff-token');
    for (let i = 0; i < 20 && !fs.existsSync(tokenPath); i++)
      await new Promise((r) => setTimeout(r, 500));

    const token = fs.readFileSync(tokenPath, 'utf8').trim();

    const sidePanelPage = await context.newPage();
    await sidePanelPage.goto(
      `chrome-extension://${extensionId}/sidepanel.html`,
    );

    await sidePanelPage.locator('#token-input').fill(token);
    await sidePanelPage.locator('#save-token-btn').click();
    await expect(sidePanelPage.locator('#status-dot')).toHaveClass(
      /connected/,
      { timeout: 10000 },
    );

    // Unblock setup
    await sidePanelPage.locator('#web-response').fill('done');
    await sidePanelPage.locator('#submit-response-btn').click();
    await setup.result;

    // 2. Delegate a real research task
    const testPrompt = 'E2E Two-Step Test';
    const delegateCall = spawnTool('delegate_web_research', {
      prompt: testPrompt,
    });
    const delegateResult = await delegateCall.result;

    const text = delegateResult.content[0].text;
    expect(text).toContain('Research task delegated');
    const handoffIdMatch = text.match(/handoff_id: "([a-z0-9-]+)"/);
    if (!handoffIdMatch)
      throw new Error(`Could not find handoff_id in output: ${text}`);
    const handoffId = handoffIdMatch[1];

    // 3. Side panel should have updated
    await expect(sidePanelPage.locator('#prompt-display')).toHaveText(
      testPrompt,
      { timeout: 10000 },
    );

    // 4. Start the blocking result tool call
    const testResponse = 'This is the research result.';
    const resultCall = spawnTool('get_research_result', {
      handoff_id: handoffId,
    });

    // 5. Submit response in side panel
    const webResponseTextarea = sidePanelPage.locator('#web-response');
    await webResponseTextarea.fill(testResponse);
    await sidePanelPage.locator('#submit-response-btn').click();
    await expect(sidePanelPage.locator('#submit-response-btn')).toHaveText(
      'Submitted!',
    );

    // 6. The blocking call should now resolve with the result
    const finalResult = await resultCall.result;
    expect(finalResult.content[0].text).toBe(testResponse);
  });

  test('should trigger notification on response completion', async () => {
    const geminiPage = await context.newPage();
    await geminiPage.goto('https://gemini.google.com/app', {
      waitUntil: 'domcontentloaded',
    });

    await geminiPage.evaluate(() => {
      const btn = document.createElement('button');
      btn.setAttribute('aria-label', 'Stop generating');
      document.body.appendChild(btn);
    });

    await new Promise((resolve) => setTimeout(resolve, 500));

    await geminiPage.evaluate(() => {
      const btn = document.querySelector(
        'button[aria-label="Stop generating"]',
      );
      btn?.remove();
    });
  });
});
