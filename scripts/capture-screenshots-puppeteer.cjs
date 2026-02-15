const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshots() {
  // Find Chrome on macOS
  const chromePaths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    process.env.CHROME_PATH
  ].filter(Boolean);

  let executablePath;
  for (const chromePath of chromePaths) {
    if (fs.existsSync(chromePath)) {
      executablePath = chromePath;
      console.log(`Found Chrome at: ${chromePath}`);
      break;
    }
  }

  if (!executablePath) {
    throw new Error('Chrome not found. Please install Google Chrome or set CHROME_PATH environment variable.');
  }

  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const screenshotsDir = path.join(__dirname, '..', 'docs', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  try {
    // 1. Dashboard (Light Mode)
    console.log('Capturing Dashboard (Light Mode)...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    await delay(2000);
    await page.screenshot({
      path: path.join(screenshotsDir, 'dashboard-light.png'),
      fullPage: false
    });
    console.log('  Saved: dashboard-light.png');

    // 2. Dashboard (Dark Mode)
    console.log('Capturing Dashboard (Dark Mode)...');
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
    });
    await page.reload({ waitUntil: 'networkidle2' });
    await delay(2000);
    await page.screenshot({
      path: path.join(screenshotsDir, 'dashboard-dark.png'),
      fullPage: false
    });
    console.log('  Saved: dashboard-dark.png');

    // 3. Requirements List (Light Mode)
    console.log('Capturing Requirements List (Light Mode)...');
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
    });
    await page.goto('http://localhost:3000/requirements', { waitUntil: 'networkidle2' });
    await delay(2000);
    await page.screenshot({
      path: path.join(screenshotsDir, 'requirements-list-light.png'),
      fullPage: false
    });
    console.log('  Saved: requirements-list-light.png');

    // 4. Requirements List with Filters Open
    console.log('Capturing Requirements List with Filters...');
    try {
      await page.click('button');
      await delay(500);
      // Try to find and click Filters button
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Filters')) {
          await btn.click();
          break;
        }
      }
      await delay(1000);
    } catch (e) {
      console.log('  Note: Could not click Filters button');
    }
    await page.screenshot({
      path: path.join(screenshotsDir, 'requirements-filters.png'),
      fullPage: false
    });
    console.log('  Saved: requirements-filters.png');

    // 5. Export Dropdown
    console.log('Capturing Export Dropdown...');
    try {
      // Close any open dropdowns first
      await page.keyboard.press('Escape');
      await delay(500);
      // Try to find and click Export button
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Export')) {
          await btn.click();
          break;
        }
      }
      await delay(500);
    } catch (e) {
      console.log('  Note: Could not click Export button');
    }
    await page.screenshot({
      path: path.join(screenshotsDir, 'export-dropdown.png'),
      fullPage: false
    });
    console.log('  Saved: export-dropdown.png');

    // 6. Requirements List (Dark Mode)
    console.log('Capturing Requirements List (Dark Mode)...');
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
    });
    await page.reload({ waitUntil: 'networkidle2' });
    await delay(2000);
    await page.screenshot({
      path: path.join(screenshotsDir, 'requirements-list-dark.png'),
      fullPage: false
    });
    console.log('  Saved: requirements-list-dark.png');

    // 7. Theme Toggle Demo
    console.log('Capturing Theme Toggle Demo...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
    });
    await page.reload({ waitUntil: 'networkidle2' });
    await delay(2000);

    // Take screenshot of header with theme toggle
    const themeToggle = await page.$('header');
    if (themeToggle) {
      await themeToggle.screenshot({
        path: path.join(screenshotsDir, 'theme-toggle.png')
      });
      console.log('  Saved: theme-toggle.png');
    }

    console.log('\n========================================');
    console.log('All screenshots captured successfully!');
    console.log(`Screenshots saved to: ${screenshotsDir}`);
    console.log('========================================');

  } catch (error) {
    console.error('Error capturing screenshots:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

takeScreenshots().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
