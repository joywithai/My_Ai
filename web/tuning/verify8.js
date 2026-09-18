/* Verify: premium loading + head returns to neutral after dance */
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

  // 1. loading screen (fresh cache-busted load, capture early)
  console.log("-> loading");
  await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded", timeout: 60000 });
  // go to landing which mounts AvatarStage immediately
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 900));
  await page.screenshot({ path: `${outDir}/r8_loading.png` });
  await page.waitForFunction("window.__myaiAvatar === true", { timeout: 90000 });

  // 2. chat: dance -> verify head returns to neutral
  console.log("-> dance + return");
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 700));
  await page.type("input[type=email]", "admin@demo.com");
  await page.click("button.btn-primary");
  await new Promise((r) => setTimeout(r, 1500));
  await page.waitForFunction("window.__myaiAvatar === true", { timeout: 90000 });
  await page.evaluate(() => (window.__engine.debugFreezeWave = false));
  await new Promise((r) => setTimeout(r, 1200));
  const mid = await page.evaluate(() => {
    const n = window.__engine.vrm.humanoid.getNormalizedBoneNode("head");
    return { state: window.__engine.state, headY: +n.rotation.y.toFixed(3), headZ: +n.rotation.z.toFixed(3) };
  });
  console.log("mid-dance:", JSON.stringify(mid));
  await new Promise((r) => setTimeout(r, 3500)); // dance over + damp settle
  const after = await page.evaluate(() => {
    const n = window.__engine.vrm.humanoid.getNormalizedBoneNode("head");
    const nk = window.__engine.vrm.humanoid.getNormalizedBoneNode("neck");
    return {
      state: window.__engine.state,
      headY: +n.rotation.y.toFixed(3), headZ: +n.rotation.z.toFixed(3),
      neckY: +nk.rotation.y.toFixed(3), neckZ: +nk.rotation.z.toFixed(3),
    };
  });
  console.log("after-dance:", JSON.stringify(after));
  await page.screenshot({ path: `${outDir}/r8_after_dance.png` });

  await browser.close();
  console.log("done");
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
