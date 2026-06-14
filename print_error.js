const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    console.log("Navigating to http://localhost:3000...");
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

    // Upload the video
    console.log("Uploading test.mp4...");
    const path = require('path');
    const filePath = path.resolve(__dirname, 'test.mp4');
    const fileInput = await page.$('input[type="file"]');
    await fileInput.uploadFile(filePath);

    console.log("Waiting 6 seconds...");
    await new Promise(r => setTimeout(r, 6000));

    const text = await page.evaluate(() => document.body.innerText);
    console.log("------------------- PAGE TEXT -------------------");
    console.log(text);
    console.log("-------------------------------------------------");

  } catch (error) {
    console.error(error);
  } finally {
    await browser.close();
  }
})();
