/* Verify round 6: no-blur landing, fixed toggles, AI provider cards */
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

  // 1. landing — no blur on hair/top
  console.log("-> landing");
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForFunction("window.__myaiAvatar === true", { timeout: 90000 });
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: `${outDir}/r6_landing.png` });

  // login as subscriber (AI tab unlocked) -> settings AI tab
  console.log("-> settings AI tab");
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 700));
  await page.type("input[type=email]", "sub@demo.com");
  const roleBtns = await page.$$(".grid.grid-cols-3 button");
  if (roleBtns[1]) await roleBtns[1].click(); // subscriber
  await page.click("button.btn-primary");
  await new Promise((r) => setTimeout(r, 1500));
  console.log("url:", page.url());
  await page.goto("http://localhost:3000/settings", { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 900));

  // AI tab
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll("aside nav button")];
    const t = btns.find((b) => b.textContent.includes("AI"));
    if (t) t.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: `${outDir}/r6_ai_tab.png` });

  // voice tab — toggles closeup
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll("aside nav button")];
    const t = btns.find((b) => b.textContent.includes("ভয়েস"));
    if (t) t.click();
  });
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: `${outDir}/r6_voice_tab.png` });
  // zoom into toggle column
  await page.screenshot({
    path: `${outDir}/r6_toggles_zoom.png`,
    clip: { x: 700, y: 130, width: 480, height: 400 },
  });

  await browser.close();
  console.log("done");
})().catch((e) => {
  console.error("FAIL", e);
  process.exit(1);
});
