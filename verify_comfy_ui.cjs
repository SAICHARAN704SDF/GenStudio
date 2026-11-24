const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function verifyComfyUI() {
  console.log('--- Starting ComfyUI Interface & Inspector Verification ---');

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  try {
    console.log('1. Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });

    // Verify Title and Titlebar
    const titleBar = await page.$eval('.comfy-title-bar', (el) => el.innerText);
    console.log('Title Bar detected:', titleBar.replace(/\n+/g, ' '));

    // Verify Mode Selector
    const modePills = await page.$$eval('.comfy-mode-pill', (els) => els.map((e) => e.innerText.trim()));
    console.log('Workflow Modes:', modePills);

    // Verify Graph Nodes
    const nodeCount = await page.$$eval('.react-flow__node', (els) => els.length);
    console.log(`ReactFlow Node count on canvas: ${nodeCount}`);

    // Verify Viva Guide is NOT present in UI
    const vivaGuideElements = await page.$$eval('*', (els) =>
      els.filter((e) => e.innerText && e.innerText.toLowerCase().includes('viva guide') && e.tagName !== 'SCRIPT').map((e) => e.innerText)
    );
    console.log('Viva Guide text elements in UI:', vivaGuideElements.length);

    // Verify Right Inspector Panel is present
    await page.waitForSelector('.comfy-inspector', { visible: true });
    const inspectorTitle = await page.$eval('.comfy-inspector-header', (el) => el.innerText);
    console.log('Inspector Panel Header:', inspectorTitle.replace(/\n+/g, ' '));

    const stepCards = await page.$$eval('.comfy-step-card', (els) =>
      els.map((e) => e.querySelector('div')?.innerText?.slice(0, 40))
    );
    console.log('Inspector Steps available:', stepCards);

    // 2. Click "▷ Run" button to trigger generation
    console.log('2. Clicking "▷ Run" to trigger live diffusion execution...');
    const runBtn = await page.$('.comfy-run-btn');
    await runBtn.click();

    // Check for active progress bar
    await page.waitForSelector('.comfy-progress-indicator', { timeout: 5000 });
    const activeText = await page.$eval('.comfy-progress-content', (el) => el.innerText);
    console.log('Progress bar during execution:', activeText.replace(/\n+/g, ' '));

    // Wait for generation to finish (wait for Idle status)
    console.log('Waiting for MPS generation to complete (up to 180s)...');
    await page.waitForFunction(() => {
      const runBtn = document.querySelector('.comfy-run-btn');
      return runBtn && runBtn.innerText.includes('▷ Run');
    }, { timeout: 180000 });

    console.log('Generation completed successfully!');

    // Wait a brief moment for image DOM rendering
    await new Promise((r) => setTimeout(r, 1200));

    // Check generated image in SaveImageNode
    const saveImg = await page.$('.comfy-node img');
    if (saveImg) {
      const src = await page.evaluate((img) => img.src, saveImg);
      console.log('Output image rendered! Data URL prefix:', src.slice(0, 40));
    }

    // Check BLIP caption & OpenCLIP score
    const blipCaption = await page.$eval('.comfy-node', (el) => {
      const text = el.innerText;
      return text.includes('BLIP') ? text.slice(text.indexOf('BLIP'), text.indexOf('BLIP') + 120) : 'BLIP not found';
    });
    console.log('BLIP Perception block:', blipCaption.replace(/\n+/g, ' '));

    // 3. Test Clicking KSampler node on canvas to update Right Inspector
    console.log('3. Clicking KSampler node on canvas to inspect its details...');
    const ksamplerNode = await page.$('.react-flow__node[data-id="ksampler"]');
    if (ksamplerNode) {
      await ksamplerNode.click();
      await new Promise((r) => setTimeout(r, 800));
      const activeInspectorStep = await page.$eval('.comfy-step-card.active-step', (el) => el.innerText);
      console.log('Active step in Inspector after clicking node:\n', activeInspectorStep.slice(0, 180));
    }

    // 4. Capture screenshot
    const screenshotPath = '/Users/charankailasa/.gemini/antigravity/brain/b4a1e067-4c8b-4476-8a73-3c48156dea8c/genstudio_comfy_verified.png';
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`Saved screenshot to ${screenshotPath}`);

  } catch (err) {
    console.error('Verification failed:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

verifyComfyUI().then(() => console.log('ComfyUI verification finished!'));
