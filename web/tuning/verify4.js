/* quick re-verify: chest-up locked framing in chat */
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

  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 700));
  await page.type("input[type=email]", "admin@demo.com");
  await page.click("button.btn-primary");
  await new Promise((r) => setTimeout(r, 1500));
  await page.waitForFunction("window.__myaiAvatar === true", { timeout: 90000 });
  await new Promise((r) => setTimeout(r, 3800));
  await page.screenshot({ path: `${outDir}/r4_idle_chestup.png` });

  // thinking closeup with new framing
  await page.type("textarea", "hi");
  await page.click('button[title="পাঠাও"]');
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: `${outDir}/r4_thinking_chestup.png` });

  await browser.close();
  console.log("done");
})().catch((e) => {
  console.error("FAIL", e);
  process.exit(1);
});
