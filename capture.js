const { chromium } = require('playwright');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  console.log('正在前往中央氣象署...');
  await page.goto('https://www.cwa.gov.tw', { waitUntil: 'networkidle' });

  const screenshotPath = 'cwa_screenshot.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await browser.close();

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('缺少 DISCORD_WEBHOOK_URL');
    process.exit(1);
  }

  const form = new FormData();
  form.append('content', `中央氣象署網頁截圖 (更新時間: ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })})`);
  form.append('file', fs.createReadStream(screenshotPath));

  await axios.post(webhookUrl, form, { headers: form.getHeaders() });
  console.log('截圖已成功傳送至 Discord！');
})();
