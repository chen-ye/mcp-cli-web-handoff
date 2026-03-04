const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const v8toIstanbul = require('v8-to-istanbul');
const libCoverage = require('istanbul-lib-coverage');
const libReport = require('istanbul-lib-report');
const reports = require('istanbul-reports');

async function collect() {
  console.log('Running extension unit tests to collect V8 coverage...');
  
  // 1. Run playwright tests and output to a JSON file
  const reportPath = 'coverage/chrome-extension/playwright-report.json';
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  
  try {
    execSync(`npx playwright test tests/unit --reporter=json > ${reportPath}`, { stdio: 'inherit' });
  } catch (e) {
    // Playwright might exit with non-zero if tests fail, but we still want coverage
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const coverageMap = libCoverage.createCoverageMap();

  // 2. Extract v8-coverage attachments
  function processSuite(suite) {
    if (suite.specs) {
      for (const spec of suite.specs) {
        for (const test of spec.tests) {
          for (const result of test.results) {
            if (!result.attachments) continue;
            for (const attachment of result.attachments) {
              if (attachment.name === 'v8-coverage') {
                const decodedBody = Buffer.from(attachment.body, 'base64').toString('utf8');
                const v8Coverage = JSON.parse(decodedBody);
                for (const entry of v8Coverage) {
                  if (entry.url && entry.url.includes('http://extension/')) {
                    // Map http://extension/ back to local path
                    const fileName = entry.url.replace('http://extension/', '');
                    const filePath = path.resolve(__dirname, '../chrome-extension/dist', fileName);
                    
                    if (fs.existsSync(filePath)) {
                      v8CoverageList.push({ entry, filePath });
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    if (suite.suites) {
      for (const subSuite of suite.suites) {
        processSuite(subSuite);
      }
    }
  }

  const v8CoverageList = [];
  for (const suite of report.suites) {
    processSuite(suite);
  }

  for (const { entry, filePath } of v8CoverageList) {
    console.log(`Processing coverage for: ${filePath}`);
    const converter = v8toIstanbul(filePath);
    await converter.load();
    converter.applyCoverage(entry.functions);
    coverageMap.merge(converter.toIstanbul());
  }

  // 3. Generate reports
  const context = libReport.createContext({
    dir: 'coverage/chrome-extension',
    defaultSummarizer: 'nested',
    watermarks: libReport.getDefaultWatermarks(),
    coverageMap,
  });

  reports.create('html').execute(context);
  reports.create('lcovonly', { file: 'lcov.info' }).execute(context);
  reports.create('text-summary').execute(context);

  console.log('Chrome Extension coverage reports generated in coverage/chrome-extension/');

  // 4. Enforce 80% threshold
  const summary = coverageMap.getCoverageSummary();
  const statements = summary.toJSON().statements.pct;
  const THRESHOLD = 80;
  
  if (statements < THRESHOLD) {
    console.error(`ERROR: Chrome Extension coverage (${statements.toFixed(2)}%) is below the ${THRESHOLD}% threshold.`);
    // In CI, we exit with non-zero
    if (process.env.CI) {
      process.exit(1);
    }
  }
}

collect().catch(console.error);
