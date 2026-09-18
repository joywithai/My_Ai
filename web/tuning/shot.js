/* Screenshots for visual verification (dev tooling, not part of app) */
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

  page.on("console", (m) => {
    const t = m.text();
    if (t.includes("Error") || t.includes("error")) console.log("[console]", t.slice(0, 300));
  });
  page.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 300)));

  // 1. landing page (shh pose)
  console.log("-> landing");
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForFunction("window.__myaiAvatar === true", { timeout: 90000 });
  await new Promise((r) => setTimeout(r, 2500)); // pose to settle
  await page.screenshot({ path: outDir + "/1_landing.png" });

  // 2. login as admin → chat (greeting wave)
  await page.type("input[type=email]", "admin@demo.com");
  const roleBtns = await page.$$("div.grid.grid-cols-3 button");
  if (roleBtns[0]) await roleBtns[0].click(); // admin
  await page.click("button.btn-primary");
  await new Promise((r) => setTimeout(r, 1200));
  console.log("url:", page.url());

  // wait for chat page avatar
  await page.waitForFunction("window.__myaiAvatar === true", { timeout: 90000 });
  await new Promise((r) => setTimeout(r, 1300));
  await page.screenshot({ path: outDir + "/2_greeting.png" });
  await new Promise((r) => setTimeout(r, 2200)); // settle to idle
  await page.screenshot({ path: outDir + "/3_idle.png" });

  // 3. send message → thinking pose
  await page.type("textarea", "তুমি কেমন আছো?");
  await page.click("button[title='পাঠাও']");
  await new Promise((r) => setTimeout(r, 2200)); // mid-thinking
  await page.screenshot({ path: outDir + "/4_thinking.png" });

  // 4. speaking (after mock delay)
  await page.waitForFunction(
    "document.querySelector('.thinking-dot') === null",
    { timeout: 30000 }
  );
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: outDir + "/5_speaking.png" });

  // 5. settings page
  await page.goto("http://localhost:3000/settings", { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: outDir + "/6_settings.png" });

  // 6. admin avatar setup (preview canvas)
  await page.goto("http://localhost:3000/admin", { waitUntil: "networkidle2" });
  await page.waitForFunction("window.__myaiAvatar === true", { timeout: 90000 });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: outDir + "/7_admin.png" });

  await browser.close();
  console.log("done");
})().catch((e) => {
  console.error("FAIL", e);
  process.exit(1);
});
