const puppeteer = require('puppeteer-core');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, '../docs/screenshots');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureScreenshots() {
  console.log('🚀 Starting screenshot capture for Project Chat feature...\n');
  
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: false,
    args: ['--window-size=1920,1080', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    // ========================================
    // STEP 1: Navigate to app
    // ========================================
    console.log('📍 Step 1: Navigate to application...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(2000);
    console.log('  ✓ Loaded homepage\n');

    // ========================================
    // STEP 2: Go to Requirements page
    // ========================================
    console.log('📍 Step 2: Navigate to Requirements...');
    await page.goto(`${BASE_URL}/requirements`, { waitUntil: 'networkidle0', timeout: 15000 });
    await sleep(2000);
    console.log('  ✓ On Requirements page\n');

    // ========================================
    // STEP 3: Click on a requirement to see detail
    // ========================================
    console.log('📍 Step 3: Click on first requirement...');
    try {
      // Wait for requirements list to load
      await page.waitForSelector('article, [class*="requirement"], li', { timeout: 5000 });
      
      // Try to find a clickable requirement item
      const requirementItem = await page.$('article, [class*="requirement"]:first-of-type, li:first-of-type');
      if (requirementItem) {
        await requirementItem.click();
        await sleep(2000);
        console.log('  ✓ Clicked first requirement\n');
      }
    } catch (e) {
      console.log('  ⚠️  Could not click requirement:', e.message.substring(0, 50), '\n');
    }

    // ========================================
    // STEP 4: Capture the "Project Status & Chat" button
    // ========================================
    console.log('📍 Step 4: Capture chat button location...');
    await sleep(1000);
    
    // Take a screenshot showing the requirement detail with the chat button
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'chat-button.png'),
      fullPage: false
    });
    console.log('  ✓ chat-button.png (showing button on requirement detail page)\n');

    // ========================================
    // STEP 5: Navigate directly to Project Chat page
    // ========================================
    console.log('📍 Step 5: Navigate to Project Chat page...');
    await page.goto(`${BASE_URL}/projects/1/chat`, { waitUntil: 'networkidle0', timeout: 15000 });
    await sleep(2000);
    console.log('  ✓ On Project Chat page\n');

    // ========================================
    // STEP 6: Send a test message to show chat in action
    // ========================================
    console.log('📍 Step 6: Send test messages...');
    try {
      const textarea = await page.$('textarea');
      if (textarea) {
        // First message
        await textarea.type('Hello! This is a test message for the screenshot.');
        await sleep(300);
        await page.keyboard.press('Enter');
        await sleep(1500);
        
        // Second message
        await textarea.type('The Project Chat feature allows real-time communication.');
        await sleep(300);
        await page.keyboard.press('Enter');
        await sleep(1500);
        
        console.log('  ✓ Sent test messages\n');
      } else {
        console.log('  ⚠️  Could not find textarea\n');
      }
    } catch (e) {
      console.log('  ⚠️  Could not send messages:', e.message.substring(0, 50), '\n');
    }

    // ========================================
    // STEP 7: Capture Light Mode screenshots
    // ========================================
    console.log('📍 Step 7: Capture light mode screenshots...');
    
    // Full page
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'project-chat-light.png'),
      fullPage: false
    });
    console.log('  ✓ project-chat-light.png');

    // Chat interface close-up (right side)
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'chat-interface.png'),
      clip: { x: 400, y: 100, width: 1120, height: 880 }
    });
    console.log('  ✓ chat-interface.png');

    // Status panel (left side)
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'status-panel.png'),
      clip: { x: 0, y: 100, width: 400, height: 880 }
    });
    console.log('  ✓ status-panel.png\n');

    // ========================================
    // STEP 8: Toggle to Dark Mode
    // ========================================
    console.log('  🌙 Capturing dark mode...');
    
    try {
      // Look for theme toggle button
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const ariaLabel = await page.evaluate(el => el.getAttribute('aria-label') || '', btn);
        const className = await page.evaluate(el => el.className, btn);
        
        if (ariaLabel.toLowerCase().includes('theme') || 
            ariaLabel.toLowerCase().includes('dark') || 
            ariaLabel.toLowerCase().includes('light') ||
            className.includes('theme')) {
          await btn.click();
          await sleep(1500);
          console.log('    ✓ Toggled theme');
          break;
        }
      }
    } catch (e) {
      // Try to set dark mode via localStorage
      await page.evaluate(() => {
        localStorage.setItem('theme', 'dark');
      });
      await page.reload({ waitUntil: 'networkidle0' });
      await sleep(2000);
      console.log('    ✓ Set dark mode via localStorage');
    }
    
    // ========================================
    // STEP 9: Capture Dark Mode screenshot
    // ========================================
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'project-chat-dark.png'),
      fullPage: false
    });
    console.log('    ✓ project-chat-dark.png\n');

    console.log('✅ All screenshots captured successfully!\n');
    console.log('📸 Screenshots saved to: docs/screenshots/');
    console.log('   - project-chat-light.png');
    console.log('   - project-chat-dark.png');
    console.log('   - chat-interface.png');
    console.log('   - status-panel.png');
    console.log('   - chat-button.png\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

captureScreenshots().catch(console.error);
