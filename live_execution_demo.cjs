const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  console.log('--- Starting Live Execution Demo in Browser ---');
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900', '--user-data-dir=/tmp/live_exec_' + Date.now()]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

  // 1. Open app
  console.log('1. Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));

  // 2. Type Prompt
  console.log('2. Entering prompt...');
  const promptInput = await page.$('#prompt');
  await promptInput.click({ clickCount: 3 });
  await promptInput.type('A serene Japanese tea house amidst cherry blossoms at dawn, cinematic lighting');

  // 3. Test RAG Enhancement live
  console.log('3. Triggering RAG prompt enhancement...');
  const enhanceBtn = await page.$('.prompt-footer button.text-button');
  if (enhanceBtn) {
    await enhanceBtn.click();
    console.log('Waiting for Ollama Qwen2.5 prompt enhancement...');
    await page.waitForSelector('.enhancement', { visible: true, timeout: 25000 });
    await page.screenshot({ path: '/Users/charankailasa/Documents/AURA/new/demo_results/screenshots/live_01_rag_enhanced_prompt.png' });
    console.log('Saved RAG prompt enhancement screenshot!');

    // Click "Use this prompt"
    const useBtn = await page.$('.enhancement button.text-button');
    if (useBtn) await useBtn.click();
    await new Promise(r => setTimeout(r, 500));
  }

  // 4. Click Generate Image
  console.log('4. Clicking Generate Image...');
  const genBtn = await page.$('button.generate-button');
  await genBtn.click();

  // Capture loading state
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: '/Users/charankailasa/Documents/AURA/new/demo_results/screenshots/live_02_generating_state.png' });
  console.log('Saved live generating state screenshot!');

  // Wait for generation to complete (up to 45s)
  console.log('Waiting for MPS generation to complete on Mac...');
  await page.waitForSelector('.result-details', { visible: true, timeout: 60000 });
  await new Promise(r => setTimeout(r, 1500));

  await page.screenshot({ path: '/Users/charankailasa/Documents/AURA/new/demo_results/screenshots/live_03_generated_result.png' });
  console.log('Saved generated result screenshot!');

  // 5. Click "Review with AI" (Visual Critic)
  console.log('5. Clicking Review with AI (Visual Critic)...');
  const buttons = await page.$$('.result-actions button');
  if (buttons.length >= 2) {
    await buttons[1].click(); // Review with AI
    console.log('Waiting for Critic diagnosis from Ollama...');
    await page.waitForSelector('.result-details .enhancement', { visible: true, timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: '/Users/charankailasa/Documents/AURA/new/demo_results/screenshots/live_04_ai_critic_review.png' });
    console.log('Saved AI Critic review screenshot!');
  }

  // 6. View updated History
  console.log('6. Viewing updated history list...');
  const navButtons = await page.$$('nav button');
  if (navButtons.length >= 2) {
    await navButtons[1].click();
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: '/Users/charankailasa/Documents/AURA/new/demo_results/screenshots/live_05_updated_history.png' });
    console.log('Saved updated history screenshot!');
  }

  await browser.close();
  console.log('--- Live Execution Demo Completed Successfully ---');
})();
