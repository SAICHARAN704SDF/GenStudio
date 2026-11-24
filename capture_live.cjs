const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900', '--user-data-dir=/tmp/live_ui_' + Date.now()]
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  const snapPath = '/Users/charankailasa/Documents/AURA/new/demo_results/screenshots/live_app_create.png';
  await page.screenshot({ path: snapPath });
  console.log('Saved live app create tab screenshot to', snapPath);

  // Click on History tab
  const buttons = await page.$$('nav button');
  if (buttons.length >= 2) {
    await buttons[1].click();
    await new Promise(r => setTimeout(r, 1200));
    const histSnap = '/Users/charankailasa/Documents/AURA/new/demo_results/screenshots/live_app_history.png';
    await page.screenshot({ path: histSnap });
    console.log('Saved live history tab screenshot to', histSnap);
  }

  // Click on the first history card to load it into canvas
  const firstCard = await page.$('.history-card');
  if (firstCard) {
    await firstCard.click();
    await new Promise(r => setTimeout(r, 1200));
    const loadedSnap = '/Users/charankailasa/Documents/AURA/new/demo_results/screenshots/live_app_loaded_result.png';
    await page.screenshot({ path: loadedSnap });
    console.log('Saved loaded result view screenshot to', loadedSnap);
  }

  await browser.close();
})();
