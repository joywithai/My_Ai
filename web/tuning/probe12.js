const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({
    executablePath: await chromium.executablePath(),
    headless: "shell",
    args: [...chromium.args, "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  page.on("request", (r) => { if (r.url().includes("/api/auth/login")) console.log("LOGIN BODY:", r.postData()); });
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2", timeout: 60000 });
  await sleep(1200);
  const chips = await page.evaluate(() => [...document.querySelectorAll("button")].map((b) => b.textContent.trim()).slice(0, 12));
  console.log("BUTTONS:", JSON.stringify(chips));
  await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Admin")?.click());
  await sleep(400);
  console.log("email after chip:", await page.evaluate(() => document.querySelector('input[type="email"]')?.value));
  await page.click("button.btn-primary");
  await sleep(2500);
  console.log("url:", page.url());
  console.log("topbar:", await page.evaluate(() => document.body.innerText.replace(/\n/g, " | ").slice(0, 120)));
  await browser.close();
})();
