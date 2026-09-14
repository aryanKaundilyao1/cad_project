const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:8080/tenders', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: '/Users/aryankaundilya/.gemini/antigravity-ide/brain/269db057-23dd-43d9-accc-e240cfd14760/artifacts/screenshot.png' });
  console.log('Screenshot taken!');
  await browser.close();
})();
