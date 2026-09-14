const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto('http://localhost:8080/tenders', { waitUntil: 'networkidle2' });
  const html = await page.evaluate(() => document.body.innerHTML);
  console.log(html.substring(0, 1000));
  await browser.close();
})();
