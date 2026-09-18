/* Verify round 3: landing v2 (idle + blur edges + top bar), chat locked avatar,
   thinking (eyes up + ??? bubbles), settings avatar tab with preview */
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default;
const fs = require("fs");

(async () => {
  const outDir = "/tmp/shots";
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: await chromium.executablePath(),
    headless: "shell",
    args: [
      ...chromium.args,
      "--enable-unsafe-swiftshader",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--window-size=1280,800",
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 1. landing v2 — idle stance, blur edges, top bar, bottom buttons
  console.log("-> landing");
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForFunction("window.__myaiAvatar === true", { timeout: 90000 });
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: `${outDir}/r3_landing.png` });

  // 2. login as admin -> chat idle (chest-up, locked)
  console.log("-> chat idle");
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 700));
  await page.type("input[type=email]", "admin@demo.com");
  await page.click("button.btn-primary");
  await new Promise((r) => setTimeout(r, 1500));
  console.log("url:", page.url());
  await page.waitForFunction("window.__myaiAvatar === true", { timeout: 90000 });
  await new Promise((r) => setTimeout(r, 3800)); // greeting over -> idle
  await page.screenshot({ path: `${outDir}/r3_idle.png` });

  // 3. thinking — bubbles + eyes up (screenshot fast after send)
  console.log("-> thinking");
  await page.type("textarea", "তুমি কে?");
  await page.click("button[title=\"পাঠাও\"]");
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: `${outDir}/r3_thinking.png` });
  await new Promise((r) => setTimeout(r, 3000));
  await page.screenshot({ path: `${outDir}/r3_speaking.png` });

  // 4. settings — avatar tab with preview
  console.log("-> settings");
  await page.goto("http://localhost:3000/settings", { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 900));
  await page.screenshot({ path: `${outDir}/r3_settings_account.png` });
  // click "অ্যাভাটার" tab (4th tab button in aside nav)
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll("aside nav button")];
    const t = btns.find((b) => b.textContent.includes("অ্যাভাটার"));
    if (t) t.click();
  });
  await page.waitForFunction("window.__myaiAvatar === true", { timeout: 90000 });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: `${outDir}/r3_settings_avatar.png` });

  await browser.close();
  console.log("done");
})().catch((e) => {
  console.error("FAIL", e);
  process.exit(1);
});
