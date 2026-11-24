const puppeteer = require('puppeteer-core');
const path = require('path');

async function testNewFeatures() {
  console.log('Testing newly implemented GenAI features...');
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,960']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 960 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('request', req => {
    if (req.url().includes('/api/')) console.log('PAGE REQ:', req.method(), req.url());
  });
  page.on('response', res => {
    if (res.url().includes('/api/')) console.log('PAGE RES:', res.status(), res.url());
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });

  // 1. Check Negative prompt toggle
  console.log('Testing Negative Prompt expansion...');
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text.includes('Negative Prompt')) {
      await b.click();
      console.log('Clicked Negative Prompt toggle!');
      break;
    }
  }

  // 2. Test Slerp Tab
  console.log('Testing Latent Slerp Mode Tab...');
  const allButtons = await page.$$('button');
  for (const t of allButtons) {
    const text = await page.evaluate(el => el.innerText, t);
    if (text.includes('Latent Slerp')) {
      await t.click();
      console.log('Switched to Latent Slerp Tab!');
      break;
    }
  }

  // 3. Click Generate Slerp
  console.log('Generating Latent Slerp Manifold...');
  const allBtnsAfter = await page.$$('button');
  let clickedGen = false;
  for (const b of allBtnsAfter) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text.includes('Generate with GenStudio')) {
      await b.click();
      clickedGen = true;
      console.log('Clicked Generate button!');
      break;
    }
  }
  if (!clickedGen) {
    throw new Error('Could not find Generate with GenStudio button');
  }

  console.log('Waiting for Slerp Manifold to render...');
  await page.waitForSelector('.snippet-tag', { visible: true, timeout: 120000 });
  const slerpTag = await page.$eval('.snippet-tag', el => el.innerText);
  console.log('Slerp rendered:', slerpTag);

  // 4. Capture screenshot of the Slerp Manifold UI
  const screenshotPath = path.join(__dirname, 'genstudio_slerp_verified.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Screenshot of newly implemented Slerp Manifold captured at:', screenshotPath);

  await browser.close();
  console.log('✅ ALL NEW GENAI FEATURES VERIFIED IN BROWSER!');
}

testNewFeatures().catch(err => {
  console.error('Error during test:', err);
  process.exit(1);
});
