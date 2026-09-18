/* debug toggles in settings */
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

  // login first (desktop)
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 700));
  await page.type("input[type=email]", "admin@demo.com");
  await page.click("button.btn-primary");
  await new Promise((r) => setTimeout(r, 1500));

  // settings -> voice tab (has toggles)
  await page.goto("http://localhost:3000/settings", { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 800));
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll("aside nav button")];
    const t = btns.find((b) => b.textContent.includes("ভয়েস"));
    if (t) t.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: `${outDir}/r5_voice_desktop.png` });

  // inspect toggle computed style
  const info = await page.evaluate(() => {
    const sw = document.querySelector('button[role="switch"]');
    if (!sw) return "no switch found";
    const cs = getComputedStyle(sw);
    const knob = sw.firstElementChild;
    const kcs = knob ? getComputedStyle(knob) : null;
    return {
      btn: { w: cs.width, h: cs.height, pos: cs.position, cls: sw.className.slice(0, 120) },
      knob: kcs && { w: kcs.width, h: kcs.height, pos: kcs.position, left: kcs.left, top: kcs.top, transform: kcs.transform },
      rect: sw.getBoundingClientRect().toJSON(),
    };
  });
  console.log(JSON.stringify(info, null, 1));

  // mobile narrow — like user's screenshot
  await page.setViewport({ width: 390, height: 800 });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: `${outDir}/r5_voice_mobile.png` });

  await browser.close();
  console.log("done");
})().catch((e) => {
  console.error("FAIL", e);
  process.exit(1);
});
