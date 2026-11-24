const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900', '--user-data-dir=/tmp/live_exec_view_' + Date.now()]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));

  // Go to history and click the newly generated first item
  const navButtons = await page.$$('nav button');
  if (navButtons.length >= 2) {
    await navButtons[1].click(); // History
    await new Promise(r => setTimeout(r, 1000));
    const firstCard = await page.$('.history-card');
    if (firstCard) {
      await firstCard.click(); // Click to load newly generated tea house
      await new Promise(r => setTimeout(r, 1500));
      await page.screenshot({ path: '/Users/charankailasa/Documents/AURA/new/demo_results/screenshots/live_03_generated_result.png' });
      console.log('Saved live_03_generated_result.png');
    }
  }

  // Click "Review with AI" to trigger Visual Critic
  const actionButtons = await page.$$('.result-actions button');
  if (actionButtons.length >= 2) {
    console.log('Clicking Review with AI button...');
    await actionButtons[1].click();
    await page.waitForSelector('.result-details .enhancement', { visible: true, timeout: 25000 });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: '/Users/charankailasa/Documents/AURA/new/demo_results/screenshots/live_04_ai_critic_review.png' });
    console.log('Saved live_04_ai_critic_review.png');
  }

  await browser.close();
})();
