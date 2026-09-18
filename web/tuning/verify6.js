/* Verify round 5: no blur, buttons on frame top, fixed toggles, AI tab */
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

  // 1. landing — clean frame, buttons at top
  console.log("-> landing");
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForFunction("window.__myaiAvatar === true", { timeout: 90000 });
  await new Promise((r) => setTimeout(r, 2200));
  await page.screenshot({ path: `${outDir}/r5_landing.png` });

  // 2. settings — voice tab toggles
  console.log("-> settings voice");
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 700));
  await page.type("input[type=email]", "admin@demo.com");
  await page.click("button.btn-primary");
  await new Promise((r) => setTimeout(r, 1500));
  await page.goto("http://localhost:3000/settings", { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 800));
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll("aside nav button")];
    const t = btns.find((b) => b.textContent.includes("ভয়েস"));
    if (t) t.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: `${outDir}/r5_voice.png` });

  // toggle geometry after fix
  const geo = await page.evaluate(() => {
    const sw = document.querySelector('button[role="switch"]');
    const knob = sw.firstElementChild;
    const a = sw.getBoundingClientRect();
    const b = knob.getBoundingClientRect();
    return { knobInside: b.left >= a.left && b.right <= a.right, knobLeft: b.left - a.left };
  });
  console.log("toggle geo:", JSON.stringify(geo));

  // 3. AI tab
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll("aside nav button")];
    const t = btns.find((b) => b.textContent.includes("AI"));
    if (t) t.click();
  });
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: `${outDir}/r5_ai_tab.png` });

  await browser.close();
  console.log("done");
})().catch((e) => {
  console.error("FAIL", e);
  process.exit(1);
});
