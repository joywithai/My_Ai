const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default;
(async () => {
  const browser = await puppeteer.launch({
    executablePath: await chromium.executablePath(),
    headless: "shell",
    args: [...chromium.args, "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader", "--window-size=1280,800"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForFunction("window.__myaiAvatar === true", { timeout: 90000 });
  await new Promise((r) => setTimeout(r, 2200));
  await page.screenshot({ path: "/tmp/shots/r5_landing2.png" });
  await browser.close();
  console.log("done");
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
