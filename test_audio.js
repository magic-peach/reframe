const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log("Launching headless browser...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors', '--disable-web-security']
  });

  try {
    const page = await browser.newPage();
    await page.setBypassCSP(true);

    // Set download behavior
    const downloadPath = path.resolve(__dirname, 'downloads');
    if (!fs.existsSync(downloadPath)){
        fs.mkdirSync(downloadPath);
    }
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: downloadPath
    });

    // Capture console errors
    page.on('console', msg => {
      console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
    });
    page.on('pageerror', error => {
      console.log(`[BROWSER ERROR]: ${error.message}`);
    });
    page.on('requestfailed', request => {
      console.log(`[REQUEST FAILED] ${request.url()}: ${request.failure()?.errorText || 'Unknown error'}`);
    });
    page.on('response', response => {
      if (response.url().includes('unpkg') || response.url().includes('ffmpeg')) {
        console.log(`[HTTP RESPONSE] ${response.status()} ${response.url()}`);
      }
    });

    console.log("Navigating to http://localhost:3000...");
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });

    const isIsolated = await page.evaluate(() => window.crossOriginIsolated);
    console.log(`[PAGE STATE] crossOriginIsolated: ${isIsolated}`);

    // 1. Upload the video
    console.log("Uploading test.mp4...");
    const filePath = path.resolve(__dirname, 'test.mp4');
    if (!fs.existsSync(filePath)) {
      throw new Error(`test.mp4 not found at ${filePath}`);
    }
    const fileInput = await page.$('input[type="file"]');
    await fileInput.uploadFile(filePath);

    console.log("Waiting for video preview to load...");
    await new Promise(r => setTimeout(r, 6000));

    // Dismiss onboarding tour if present
    console.log("Checking for 'Skip tour' button...");
    const initialButtons = await page.$$('button');
    let skipTourButton = null;
    for (const btn of initialButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes("Skip tour")) {
        skipTourButton = btn;
        break;
      }
    }

    if (skipTourButton) {
      console.log("Clicking 'Skip tour'...");
      await skipTourButton.click();
      await new Promise(r => setTimeout(r, 1000));
    } else {
      console.log("'Skip tour' button not found/already dismissed.");
    }

    // Log all buttons
    console.log("Listing all buttons on the page after tour dismissal:");
    const allButtons = await page.$$('button');
    for (const btn of allButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      const ariaLabel = await page.evaluate(el => el.getAttribute('aria-label'), btn);
      console.log(`Button: "${text.trim()}", aria-label: "${ariaLabel}"`);
    }

    // 2. Select format: MP3
    console.log("Selecting MP3 format...");
    let mp3Button = null;
    for (const btn of allButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.trim() === "MP3") {
        mp3Button = btn;
        break;
      }
    }

    if (!mp3Button) {
      throw new Error("Could not find MP3 format button");
    }
    await mp3Button.click();
    console.log("MP3 format selected.");

    // Open export accordion section if needed
    // Let's click on the "Export" accordion title to expand it
    console.log("Expanding Export section...");
    let exportAccordionTitle = null;
    const accordionButtons = await page.$$('button');
    for (const btn of accordionButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes("Export")) {
        exportAccordionTitle = btn;
        break;
      }
    }
    if (exportAccordionTitle) {
      await exportAccordionTitle.click();
      console.log("Export section expanded.");
      await new Promise(r => setTimeout(r, 1000));
    }

    // Take screenshot of selected state
    await page.screenshot({ path: 'selected_format.png' });
    console.log("Screenshot saved as selected_format.png");

    // 3. Click Export Button inside the export section
    console.log("Clicking export button...");
    const finalButtons = await page.$$('button');
    let exportButton = null;
    for (const btn of finalButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      const style = await page.evaluate(el => el.className, btn);
      if (text.toLowerCase().includes("export") && style.includes("bg-film-600")) {
        exportButton = btn;
        break;
      }
    }

    if (!exportButton) {
      // Fallback to any button that says EXPORT
      for (const btn of finalButtons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text.trim() === "Export" || text.trim() === "EXPORT") {
          exportButton = btn;
          break;
        }
      }
    }

    if (!exportButton) {
      throw new Error("Could not find Export button");
    }
    await exportButton.click();
    console.log("Export started.");

    // 4. Monitor export progress
    console.log("Monitoring progress...");
    let done = false;
    let attempts = 0;
    while (!done && attempts < 60) {
      await new Promise(r => setTimeout(r, 2000));
      attempts++;

      // Check if export overlay is finished
      const text = await page.evaluate(() => document.body.textContent);
      if (text.includes("Export complete") || text.includes("Download") || text.includes("Success")) {
        console.log("Export successful!");
        done = true;
        break;
      }

      if (text.includes("Error") || text.includes("failed")) {
        console.log("Export failed with an error visible on UI!");
        break;
      }

      console.log(`Still exporting... (checking UI state, attempt ${attempts})`);
    }

    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: 'export_result.png' });
    console.log("Final screenshot saved as export_result.png");

    // Check downloads directory
    const files = fs.readdirSync(downloadPath);
    console.log("Downloads folder content:", files);

  } catch (error) {
    console.error("Test encountered an error:", error);
  } finally {
    await browser.close();
    console.log("Browser closed.");
  }
})();
