const puppeteer = require('puppeteer-core');
const assert = require('node:assert/strict');
(async () => {
 const browser = await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try {
 const page = await browser.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.setViewport({width:1440,height:1080});
 const pixel='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
 let entries=[], payload, fail=false;
 await page.setRequestInterception(true);
 page.on('request',req=>{
  const endpoint=new URL(req.url()).pathname;
  if (!endpoint.startsWith('/api/')) return req.continue();
  let data={}; let status=200;
  if(endpoint.endsWith('health')) data={status:'healthy',ollama:{connected:true}};
  if(endpoint.endsWith('history')) {if(req.method()==='DELETE') entries=[];data={history:entries};}
  if(endpoint.endsWith('enhance')) data={enhanced_prompt:'An enhanced mountain landscape in morning light'};
  if(endpoint.endsWith('generate')) {payload=JSON.parse(req.postData()); if(fail){status=422;data={detail:[{loc:['body','prompt'],msg:'Invalid prompt'}]};}else{data={id:'test',image:pixel,prompt:payload.prompt,caption:'A mountain landscape',clip_score:.32,generation_time:1.2};entries=[data];}}
  if(endpoint.endsWith('slerp'))data={frames:[0,.33,.67,1].map(lambda=>({lambda,image:pixel}))};
  if(endpoint.endsWith('critique'))data={critique:'Try stronger lighting.',refined_prompt:'Mountain with strong light',negative_prompt:'blur'};
  req.respond({status,contentType:'application/json',body:JSON.stringify(data)});
 });
 const click=async text=>{const found=await page.evaluate(t=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.includes(t));if(!b) return false;b.click();return true;},text);assert(found,`Button ${text}`);};
 await page.goto('http://127.0.0.1:5173',{waitUntil:'networkidle0'});
 assert(await page.$eval('.generate-button',e=>e.disabled));
 await page.screenshot({path:'studio-desktop.png',fullPage:true});
 await click('Architecture'); await click('Enhance prompt'); await page.waitForSelector('.enhancement'); await click('Use this prompt');
 await page.$eval('input[type=number]',e=>{const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(e,'0');e.dispatchEvent(new Event('input',{bubbles:true}));});
 await click('Generate image');await page.waitForSelector('.generated-image');assert.equal(payload.seed,0);assert.equal(payload.prompt,'An enhanced mountain landscape in morning light');
 await click('Review with AI');await page.waitForSelector('.result-details .enhancement');await click('Use refined prompt');assert.equal(await page.$eval('#prompt',e=>e.value),'Mountain with strong light');
 await click('History');await page.waitForSelector('.history-card');await click('Clear history');await page.waitForSelector('.history-empty');await click('Create your first image');
 await click('Image to image');assert(await page.$eval('.generate-button',e=>e.disabled));
 await page.evaluate(p=>{const bytes=Uint8Array.from(atob(p.split(',')[1]),c=>c.charCodeAt(0));const dt=new DataTransfer();dt.items.add(new File([bytes],'reference.png',{type:'image/png'}));const input=document.querySelector('input[type=file]');input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));},pixel);
 await page.waitForSelector('.reference-preview');await click('Generate image');await page.waitForFunction(()=>!document.querySelector('fieldset').disabled);assert(payload.init_image.startsWith('data:image/png'));
 await click('Seed exploration');await click('Explore seeds');await page.waitForSelector('.frames');assert.equal(await page.$$eval('.frames button',e=>e.length),4);await page.click('[aria-label="View frame 4"]');assert.equal(await page.$eval('[aria-label="View frame 4"]',e=>e.getAttribute('aria-pressed')),'true');
 await click('Text to image');fail=true;await click('Generate image');await page.waitForSelector('[role=alert]');assert.match(await page.$eval('[role=alert]',e=>e.textContent),/prompt: Invalid prompt/);
 await page.setViewport({width:390,height:844});await page.screenshot({path:'studio-mobile.png',fullPage:true});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
 console.log('PASS: prompt enhancement, seed zero, generation, AI review, history clearing, reference upload, interpolation frames, validation errors, mobile overflow, no runtime errors. API responses mocked; no inference performed.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
