const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR]: ${error.message}`);
  });
  
  page.on('requestfailed', request => {
    console.log(`[REQUEST FAILED]: ${request.url()} - ${request.failure()?.errorText}`);
  });
  
  console.log("Navigating to http://localhost:3000...");
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });
  } catch (e) {
    console.log("[GOTO ERROR]:", e.message);
  }
  
  await new Promise(r => setTimeout(r, 5000));
  console.log("Done waiting.");
  await browser.close();
})();
