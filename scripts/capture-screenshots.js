const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function takeScreenshots() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const screenshotsDir = path.join(__dirname, 'docs', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  try {
    // 1. Dashboard (Light Mode)
    console.log('Capturing Dashboard (Light Mode)...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(screenshotsDir, 'dashboard-light.png'),
      fullPage: false
    });

    // 2. Dashboard (Dark Mode)
    console.log('Capturing Dashboard (Dark Mode)...');
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
      window.location.reload();
    });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(screenshotsDir, 'dashboard-dark.png'),
      fullPage: false
    });

    // 3. Requirements List (Light Mode)
    console.log('Capturing Requirements List (Light Mode)...');
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
      window.location.reload();
    });
    await page.goto('http://localhost:3000/requirements', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(screenshotsDir, 'requirements-list-light.png'),
      fullPage: false
    });

    // 4. Requirements List with Filters Open
    console.log('Capturing Requirements List with Filters...');
    await page.click('button:has-text("Filters")');
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(screenshotsDir, 'requirements-filters.png'),
      fullPage: false
    });

    // 5. Export Dropdown
    console.log('Capturing Export Dropdown...');
    await page.click('button:has-text("Filters")'); // Close filters
    await page.waitForTimeout(500);
    await page.click('button:has-text("Export")');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(screenshotsDir, 'export-dropdown.png'),
      fullPage: false
    });

    // 6. Requirements List (Dark Mode)
    console.log('Capturing Requirements List (Dark Mode)...');
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
      window.location.reload();
    });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(screenshotsDir, 'requirements-list-dark.png'),
      fullPage: false
    });

    // 7. Theme Toggle Demo
    console.log('Capturing Theme Toggle Demo...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
      window.location.reload();
    });
    await page.waitForTimeout(2000);

    // Take screenshot of header with theme toggle
    const themeToggle = await page.$('header');
    if (themeToggle) {
      await themeToggle.screenshot({
        path: path.join(screenshotsDir, 'theme-toggle.png')
      });
    }

    console.log('All screenshots captured successfully!');
    console.log(`Screenshots saved to: ${screenshotsDir}`);

  } catch (error) {
    console.error('Error capturing screenshots:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshots();
