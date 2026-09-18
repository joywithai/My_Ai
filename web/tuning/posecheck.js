/* Per-pose verification: measure + screenshot each state directly */
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
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForFunction("window.__myaiAvatar === true", { timeout: 90000 });
  await new Promise((r) => setTimeout(r, 2000));

  const poses = ["shh", "greeting", "thinking", "speaking", "idle"];
  for (const p of poses) {
    await page.evaluate((pose) => window.__engine.setState(pose), p);
    await new Promise((r) => setTimeout(r, 2000));
    const pos = await page.evaluate(() => window.__engine.debugPositions());
    console.log(`\n=== ${p} ===`);
    for (const k of ["head", "rightLowerArm", "rightHand", "rightIndexDistal"]) {
      if (pos[k]) console.log(` ${k}: (${pos[k].x}, ${pos[k].y}, ${pos[k].z})`);
    }
    // clip the avatar area for closer look
    const clip =
      p === "shh"
        ? { x: 156, y: 40, width: 968, height: 372 }
        : { x: 156, y: 56, width: 968, height: 660 };
    await page.screenshot({ path: `${outDir}/pose_${p}.png`, clip });
  }

  await browser.close();
  console.log("\ndone");
})().catch((e) => {
  console.error("FAIL", e);
  process.exit(1);
});
