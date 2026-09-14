const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto('http://localhost:8080/tenders', { waitUntil: 'networkidle2' });
  const html = await page.evaluate(() => document.body.innerHTML);
  console.log('HTML Length:', html.length);
  if (html.length < 500) {
    console.log('HTML Content:', html);
  } else {
    console.log('HTML is populated! Length:', html.length);
  }
  await browser.close();
})();
