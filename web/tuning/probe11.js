const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({
    executablePath: await chromium.executablePath(),
    headless: "shell",
    args: [...chromium.args, "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader", "--window-size=1280,800"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  page.on("pageerror", (e) => console.log("PAGEERROR:", String(e).slice(0, 200)));
  page.on("console", (m) => { if (["error", "warning"].includes(m.type())) console.log("CONSOLE", m.type(), m.text().slice(0, 220)); });
  page.on("requestfailed", (r) => console.log("REQFAIL:", r.url().slice(0, 100), r.failure()?.errorText));
  page.on("response", (r) => { if (r.url().includes(":5000")) console.log("RESP:", r.status(), r.url().replace("http://localhost:5000", "")); });

  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2", timeout: 60000 });
  await sleep(600);
  await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Admin")?.click());
  await page.click("button.btn-primary");
  await sleep(2500);
  console.log("=== now /admin ===");
  await page.goto("http://localhost:3000/admin", { waitUntil: "networkidle2" });
  await sleep(3500);
  const txt = await page.evaluate(() => document.body.innerText.slice(0, 500));
  console.log("ADMIN BODY:", JSON.stringify(txt.slice(0, 300)));
  await browser.close();
})();
