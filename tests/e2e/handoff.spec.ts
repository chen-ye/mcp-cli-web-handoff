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

  test.beforeEach(async ({ page }) => {
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

    // Start coverage tracking for any page opened in this context
    context.on('page', async (page) => {
      await page.coverage.startJSCoverage().catch(() => {});
    });
  });

  test.afterEach(async ({}, testInfo) => {
    for (const page of context.pages()) {
      try {
        const coverage = await page.coverage.stopJSCoverage();
        await testInfo.attach('v8-coverage', {
          body: JSON.stringify(coverage),
          contentType: 'application/json',
        });
      } catch (_e) {}
    }

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

  test('should persist token across browser restarts', async () => {
    // 1. Initial setup to start daemon and get a token
    const setup = spawnTool('delegate_web_research', {
      prompt: 'Persistence setup',
    });
    const tokenPath = path.join(os.homedir(), '.gemini', 'web-handoff-token');

    // Wait for token file to be created
    for (let i = 0; i < 20 && !fs.existsSync(tokenPath); i++) {
      await new Promise((r) => setTimeout(r, 500));
    }
    const token = fs.readFileSync(tokenPath, 'utf8').trim();

    // 2. Open side panel and save token
    const sidePanelPage = await context.newPage();
    await sidePanelPage.goto(
      `chrome-extension://${extensionId}/sidepanel.html`,
    );
    await sidePanelPage.locator('#token-input').fill(token);
    await sidePanelPage.locator('#save-token-btn').click();

    // Ensure connection is established
    await expect(sidePanelPage.locator('#status-dot')).toHaveClass(
      /connected/,
      { timeout: 10000 },
    );

    // Clean up setup process
    await sidePanelPage.locator('#web-response').fill('done');
    await sidePanelPage.locator('#submit-response-btn').click();
    await setup.result;

    // 3. Restart browser (close current context, open a new one with same user data dir)
    await context.close();
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

    // 4. Re-open side panel and verify it auto-connects without manual input
    const newSidePanelPage = await context.newPage();
    await newSidePanelPage.goto(
      `chrome-extension://${extensionId}/sidepanel.html`,
    );

    // Wait a moment for background script to initialize and connect
    await new Promise((r) => setTimeout(r, 1000));

    // Verify the token input field has the token populated
    await expect(newSidePanelPage.locator('#token-input')).toHaveValue(token);

    // Verify it successfully connected using the persisted token
    await expect(newSidePanelPage.locator('#status-dot')).toHaveClass(
      /connected/,
      { timeout: 10000 },
    );
  });
});
