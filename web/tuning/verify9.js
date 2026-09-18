/* E2E: server login → chat (server reply) → admin panel → settings avatar tab */
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
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  // 1. login page (English UI + demo chips)
  console.log("-> login");
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: `${outDir}/r9_login.png` });

  // admin login via demo chip + button
  await page.evaluate(() => {
    const chips = [...document.querySelectorAll("button")];
    chips.find((b) => b.textContent.trim() === "Admin")?.click();
  });
  await page.click("button.btn-primary");
  await new Promise((r) => setTimeout(r, 1800));
  console.log("url:", page.url());
  await page.waitForFunction("window.__myaiAvatar === true", { timeout: 90000 });
  await new Promise((r) => setTimeout(r, 3600));
  await page.screenshot({ path: `${outDir}/r9_chat_idle.png` });

  // 2. send a message — server-side reply
  console.log("-> chat send");
  await page.type("textarea", "hello!");
  await page.click('button[title="পাঠাও"]');
  await new Promise((r) => setTimeout(r, 700));
  await page.screenshot({ path: `${outDir}/r9_thinking.png` });
  await new Promise((r) => setTimeout(r, 2600));
  await page.screenshot({ path: `${outDir}/r9_speaking.png` });

  // 3. admin panel tabs
  console.log("-> admin");
  await page.goto("http://localhost:3000/admin", { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: `${outDir}/r9_admin_users.png` });
  for (const [name, file] of [["Flags", "flags"], ["Avatars", "avatars"], ["System", "system"], ["Audit", "audit"]]) {
    await page.evaluate((label) => {
      const btns = [...document.querySelectorAll("main button")];
      btns.find((b) => b.textContent.trim().startsWith(label))?.click();
    }, name);
    await new Promise((r) => setTimeout(r, 700));
    await page.screenshot({ path: `${outDir}/r9_admin_${file}.png` });
  }

  // 4. settings — avatar tab with model select
  console.log("-> settings avatar");
  await page.goto("http://localhost:3000/settings", { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 900));
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll("aside nav button")];
    btns.find((b) => b.textContent.includes("Avatar"))?.click();
  });
  await new Promise((r) => setTimeout(r, 700));
  await page.screenshot({ path: `${outDir}/r9_settings_avatar_top.png` });

  console.log("pageerrors:", errors.length, errors.slice(0, 3));
  await browser.close();
  console.log("done");
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
