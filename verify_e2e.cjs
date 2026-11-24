const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function runE2E() {
  console.log('Starting GenStudio E2E Browser Verification...');
  
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,960']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 960 });

  // 1. Navigate to frontend
  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });

  // 2. Verify Title and Header
  const title = await page.title();
  console.log('Page title:', title);

  const headerText = await page.$eval('.studio-header', el => el.innerText);
  console.log('Header content:\n', headerText);

  // 3. Open Viva Modal & Verify
  console.log('Opening Viva Syllabus Guide Modal...');
  const vivaBtn = await page.$('button.btn-secondary:has(svg)');
  await vivaBtn.click();
  await page.waitForSelector('.modal-card', { visible: true });
  const modalText = await page.$eval('.modal-card', el => el.innerText);
  console.log('Viva Guide Modal opened! Contains concepts:\n', modalText.slice(0, 200) + '...');
  
  // Close modal
  const closeBtn = await page.$('.modal-card .speech-btn');
  await closeBtn.click();
  await page.waitForSelector('.modal-card', { hidden: true });
  console.log('Viva Guide Modal closed successfully.');

  // 4. Test RAG Prompt Enhancement
  console.log('Clicking "Enhance with RAG"...');
  const enhanceBtn = await page.$('button[title*="Embed prompt"]');
  await enhanceBtn.click();

  console.log('Waiting for RAG enhancement response...');
  await page.waitForSelector('.rag-box', { visible: true, timeout: 45000 });
  const enhancedContent = await page.$eval('.rag-content', el => el.innerText);
  console.log('RAG Enhanced Prompt:\n', enhancedContent);

  const snippetTags = await page.$$eval('.snippet-tag', tags => tags.map(t => t.innerText));
  console.log('Retrieved Style Snippets:', snippetTags);

  // 5. Apply Enhanced Prompt to Generator
  console.log('Applying enhanced prompt...');
  const applyBtn = await page.$('.rag-box button.btn-secondary');
  await applyBtn.click();
  
  const currentPrompt = await page.$eval('.prompt-input', el => el.value);
  console.log('Current input textarea prompt:', currentPrompt.slice(0, 100) + '...');

  // 6. Set 1 Step for fast generation test
  await page.select('select.control-select', '1');

  // 7. Click Generate
  console.log('Clicking "Generate with GenStudio"...');
  const genBtn = await page.$('button.btn-primary');
  await genBtn.click();

  // 8. Wait for Generation and Multimodal evaluation
  console.log('Waiting for image generation, BLIP captioning, and CLIP score...');
  await page.waitForSelector('img.image-frame', { visible: true, timeout: 90000 });

  const captionText = await page.$eval('.caption-text', el => el.innerText);
  console.log('Generated BLIP Caption:', captionText);

  const clipBadgeText = await page.$eval('.clip-badge', el => el.innerText);
  console.log('CLIP Evaluation Score:', clipBadgeText);

  const metricsRow = await page.$eval('.metrics-row', el => el.innerText);
  console.log('Metrics Row:', metricsRow);

  // 9. Verify History Table
  await page.waitForSelector('.history-table tbody tr', { visible: true });
  const historyRowCount = await page.$$eval('.history-table tbody tr', rows => rows.length);
  console.log(`History Table entries recorded: ${historyRowCount}`);

  // 10. Capture Screenshot
  const screenshotPath = path.join(__dirname, 'genstudio_e2e_verified.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Full-page screenshot captured at:', screenshotPath);

  await browser.close();
  console.log('✅ ALL E2E TESTS PASSED SUCCESSFULLY!');
}

runE2E().catch(err => {
  console.error('E2E Verification Error:', err);
  process.exit(1);
});
