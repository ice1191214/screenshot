const { chromium } = require('playwright');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

(async () => {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('❌ 錯誤：未讀取到 DISCORD_WEBHOOK_URL 環境變數，請確認 GitHub Secrets 設定！');
    process.exit(1);
  }

  let browser;
  try {
    console.log('正在啟動瀏覽器...');
    browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });

    console.log('正在前往中央氣象署...');
    // 改為 domcontentloaded，避免因廣告或追蹤碼導致超時
    await page.goto('https://www.cwa.gov.tw', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });

    // 等待 3 秒確保頁面動態內容渲染
    await page.waitForTimeout(3000);

    const screenshotPath = 'cwa_screenshot.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('截圖完成！');

    await browser.close();

    // 發送到 Discord
    const form = new FormData();
    form.append('content', `⛅ 中央氣象署網頁截圖 (更新時間: ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })})`);
    form.append('file', fs.createReadStream(screenshotPath));

    console.log('正在傳送至 Discord...');
    await axios.post(webhookUrl, form, { headers: form.getHeaders() });
    console.log('✅ 截圖已成功傳送至 Discord！');

  } catch (error) {
    if (browser) await browser.close();
    console.error('❌ 執行過程發生錯誤:', error.message);
    process.exit(1);
  }
})();
