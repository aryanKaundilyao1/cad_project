const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Login first if needed, but assuming dev server might not need auth if we mock it, or we can just try to hit the page directly. 
  // Wait, if it's protected by Auth, we need to bypass or login.
  // Actually, we can just inject a mock auth state via localStorage.
  
  await page.setViewport({ width: 1440, height: 900 });
  
  // Set localStorage to bypass auth (Supabase auth token mock)
  await page.goto('http://localhost:8080', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    localStorage.setItem('sb-local-auth-token', JSON.stringify({
      access_token: 'mock',
      user: { id: 'mock-admin', role: 'authenticated' }
    }));
  });
  
  // Go to templates page
  await page.goto('http://localhost:8080/admin', { waitUntil: 'networkidle0' });
  
  // We need to click the Templates tab. In Admin.tsx it's TabsTrigger value="templates"
  await page.click('button[value="templates"]');
  await new Promise(r => setTimeout(r, 1000));
  
  // 1. Screenshot of the new Templates page (Master Lead Schema Manager)
  await page.screenshot({ path: '/Users/aryankaundilya/.gemini/antigravity-ide/brain/9415edac-8caa-4a2e-b7d9-b8b5c7a2e560/templates_page.png' });
  
  // The first section (Google Maps) is visible by default.
  // We can just scroll to ensure it's in view if needed, but it should be at the top.
  
  // 2. Expand Website Intelligence
  const websiteTrigger = await page.$('button[data-state="closed"] span:contains("Website Intelligence")');
  if (websiteTrigger) await websiteTrigger.click();
  // Using xpath for better finding
  const websiteAccordions = await page.$x("//span[contains(text(), 'Website Intelligence')]");
  if (websiteAccordions.length > 0) {
    await websiteAccordions[0].click();
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: '/Users/aryankaundilya/.gemini/antigravity-ide/brain/9415edac-8caa-4a2e-b7d9-b8b5c7a2e560/website_intelligence.png' });
    await websiteAccordions[0].click(); // close it
  }
  
  // 3. Expand LinkedIn
  const linkedinAccordions = await page.$x("//span[contains(text(), 'LinkedIn Intelligence')]");
  if (linkedinAccordions.length > 0) {
    await linkedinAccordions[0].click();
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: '/Users/aryankaundilya/.gemini/antigravity-ide/brain/9415edac-8caa-4a2e-b7d9-b8b5c7a2e560/linkedin_intelligence.png' });
    await linkedinAccordions[0].click();
  }

  // 4. Expand Decision Maker
  const dmAccordions = await page.$x("//span[contains(text(), 'Decision Maker')]");
  if (dmAccordions.length > 0) {
    await dmAccordions[0].click();
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: '/Users/aryankaundilya/.gemini/antigravity-ide/brain/9415edac-8caa-4a2e-b7d9-b8b5c7a2e560/decision_maker.png' });
  }

  await browser.close();
})();
