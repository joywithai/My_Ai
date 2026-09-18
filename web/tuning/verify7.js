/* Verify: snake-dance greeting (full duration), toggle OFF visibility */
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default;
const fs = require("fs");
(async () => {
  const outDir = "/tmp/shots";
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: await chromium.executablePath(),
    headless: "shell",
    args: [...chromium.args, "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader", "--window-size=1280,800"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  console.log("-> greeting dance");
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 700));
  await page.type("input[type=email]", "admin@demo.com");
  await page.click("button.btn-primary");
  await new Promise((r) => setTimeout(r, 1500));
  await page.waitForFunction("window.__myaiAvatar === true", { timeout: 90000 });
  await page.evaluate(() => (window.__engine.debugFreezeWave = false));
  const st0 = await page.evaluate(() => window.__engine.state);
  console.log("state right after load:", st0);
  for (const [i, wait] of [[0, 500], [1, 700], [2, 700], [3, 700]]) {
    await new Promise((r) => setTimeout(r, wait));
    await page.screenshot({ path: `${outDir}/r7b_dance_${i}.png` });
  }
  await new Promise((r) => setTimeout(r, 1500));
  const st1 = await page.evaluate(() => window.__engine.state);
  console.log("state after dance:", st1);
  await page.screenshot({ path: `${outDir}/r7b_idle_after.png` });

  console.log("-> toggles");
  await page.goto("http://localhost:3000/settings", { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 900));
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll("aside nav button")];
    const t = btns.find((b) => b.textContent.includes("ভয়েস"));
    if (t) t.click();
  });
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: `${outDir}/r7b_toggles.png`, clip: { x: 620, y: 120, width: 560, height: 460 } });
  await browser.close();
  console.log("done");
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
