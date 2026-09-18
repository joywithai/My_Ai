/* Verify: new landing, login page, fixed poses */
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

  // 1. new landing — shh pose, only login/signup buttons
  console.log("-> landing");
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForFunction("window.__myaiAvatar === true", { timeout: 90000 });
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: `${outDir}/n1_landing.png` });

  // 2. login page
  console.log("-> login page");
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 700));
  await page.screenshot({ path: `${outDir}/n2_login.png` });

  // 3. login as admin -> chat idle (arms closer now)
  await page.type("input[type=email]", "admin@demo.com");
  await page.click("button.btn-primary");
  await new Promise((r) => setTimeout(r, 1200));
  console.log("url:", page.url());
  await page.waitForFunction("window.__myaiAvatar === true", { timeout: 90000 });
  await new Promise((r) => setTimeout(r, 3800)); // greeting done -> idle
  await page.screenshot({ path: `${outDir}/n3_idle.png` });

  // 4. thinking pose closeup
  await page.evaluate(() => window.__engine.setState("thinking"));
  await new Promise((r) => setTimeout(r, 2200));
  await page.screenshot({ path: `${outDir}/n4_thinking.png`, clip: { x: 156, y: 56, width: 968, height: 660 } });

  await browser.close();
  console.log("done");
})().catch((e) => {
  console.error("FAIL", e);
  process.exit(1);
});
