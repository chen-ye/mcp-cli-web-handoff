const puppeteer = require('puppeteer');
const path = require('path');

const EXTENSION_PATH = path.resolve(__dirname, '../../chrome-extension');

async function runTest() {
  console.log('Starting Extension E2E Test...');
  const browser = await puppeteer.launch({
    // In Puppeteer 22+, headless: true uses the new headless mode which supports extensions.
    // However, some extensions might still need headful mode in certain environments.
    // We'll use the new headless mode explicitly.
    headless: process.env.HEADLESS === 'false' ? false : true,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--enable-extensions',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  try {
    console.log('Finding extension ID via chrome://extensions...');
    const dummyPage = await browser.newPage();
    await dummyPage.goto('chrome://extensions');
    
    // Enable developer mode to see IDs easily (using a little hack in the extensions page)
    const extensionId = await dummyPage.evaluate(() => {
      const extensions = document.querySelector('extensions-manager').shadowRoot
        .querySelector('extensions-item-list').shadowRoot
        .querySelectorAll('extensions-item');
      
      for (const ext of extensions) {
        const name = ext.shadowRoot.querySelector('#name').textContent.trim();
        if (name === 'Gemini Web Handoff') {
           return ext.id;
        }
      }
      return null;
    });

    if (!extensionId) {
      throw new Error("Could not find Gemini Web Handoff extension ID in chrome://extensions");
    }

    // 2. Open the Side Panel directly via its URL
    const sidePanelUrl = `chrome-extension://${extensionId}/sidepanel.html`;
    console.log(`Opening Side Panel: ${sidePanelUrl}`);
    
    const page = await browser.newPage();
    await page.goto(sidePanelUrl);
    
    // 3. Verify Initial State (Buttons should be disabled)
    console.log('Verifying initial state...');
    await page.waitForSelector('#copy-prompt-btn');
    
    const isPromptBtnDisabled = await page.$eval('#copy-prompt-btn', el => el.disabled);
    const isPathBtnDisabled = await page.$eval('#copy-project-path-btn', el => el.disabled);
    const isZipBtnDisabled = await page.$eval('#copy-context-btn', el => el.disabled);
    
    if (!isPromptBtnDisabled || !isPathBtnDisabled || !isZipBtnDisabled) {
       throw new Error("Buttons should be disabled initially");
    }
    
    // 4. Simulate a payload by calling the updatePayloadUI directly in the page context
    // Since we are inside the side panel page, we can directly dispatch to its window
    // or simulate the chrome.runtime.onMessage event.
    console.log('Simulating incoming payload...');
    await page.evaluate(() => {
      // Direct call to the function we know exists in sidepanel.js
      window.updatePayloadUI({
        prompt: 'E2E Test Prompt',
        projectPath: '/test/path',
        zipData: 'mockbase64data'
      });
    });
    
    // 5. Verify the UI updates correctly
    console.log('Verifying updated state...');
    // Wait for the UI to update
    await page.waitForFunction(() => {
      const el = document.getElementById('prompt-display');
      return el && el.textContent === 'E2E Test Prompt';
    }, { timeout: 5000 });

    const isPromptBtnEnabled = await page.$eval('#copy-prompt-btn', el => !el.disabled);
    const isPathBtnEnabled = await page.$eval('#copy-project-path-btn', el => !el.disabled);
    const isZipBtnEnabled = await page.$eval('#copy-context-btn', el => !el.disabled);

    if (!isPromptBtnEnabled || !isPathBtnEnabled || !isZipBtnEnabled) {
       throw new Error("Buttons failed to enable after payload was received");
    }

    console.log('✅ Extension E2E Test Passed!');
  } catch (error) {
    console.error('❌ Test Failed:', error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runTest();
