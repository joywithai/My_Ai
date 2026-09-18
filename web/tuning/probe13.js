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
  page.on("response", (r) => { if (r.url().includes(":5000")) console.log("RESP:", r.status(), r.url().replace("http://localhost:5000", "")); });
  // login first
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2", timeout: 60000 });
  await sleep(800);
  await page.evaluate(() => localStorage.removeItem("myai.auth"));
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2" });
  await sleep(800);
  await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Public")?.click());
  await sleep(300);
  console.log("email:", await page.evaluate(() => document.querySelector('input[type="email"]')?.value));
  await page.click("button.btn-primary");
  await sleep(2500);
  console.log("after login url:", page.url());
  await page.goto("http://localhost:3000/subscription", { waitUntil: "networkidle2" });
  await sleep(2500);
  const info = await page.evaluate(() => ({
    text: document.body.innerText.replace(/\n+/g, " | ").slice(0, 400),
    buttons: [...document.querySelectorAll("button")].map((b) => b.textContent.trim()).filter(Boolean),
  }));
  console.log("PAGE:", JSON.stringify(info.text));
  console.log("BUTTONS:", JSON.stringify(info.buttons));
  await browser.close();
})();
