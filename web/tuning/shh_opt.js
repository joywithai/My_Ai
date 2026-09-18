/* shh pose optimizer with elbow-outside-torso constraint */
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default;

const PARAMS = [
  { bone: "rightUpperArm", idx: 0, init: 0, min: -0.4, max: 0.5 },
  { bone: "rightUpperArm", idx: 1, init: 2.0, min: 0.5, max: 3.0 },
  { bone: "rightUpperArm", idx: 2, init: 1.46, min: 0.6, max: 1.5 },
  { bone: "rightLowerArm", idx: 0, init: 0.15, min: -0.3, max: 0.6 },
  { bone: "rightLowerArm", idx: 1, init: 0.2, min: -1.2, max: 1.6 },
  { bone: "rightLowerArm", idx: 2, init: -2.56, min: -3.0, max: -1.6 },
  { bone: "rightHand", idx: 0, init: 0.1, min: -0.5, max: 0.5 },
  { bone: "rightHand", idx: 2, init: 0.1, min: -0.5, max: 0.5 },
];

const TARGET = {
  tip: [0.0, 1.615, 0.17],   // fingers in FRONT of lips (z forward)
  hand: [-0.07, 1.48, 0.17], // hand floats in front-right of chest
  elbow: [-0.21, 1.27, 0.03],// elbow outside torso silhouette
};

(async () => {
  const browser = await puppeteer.launch({
    executablePath: await chromium.executablePath(),
    headless: "shell",
    args: [...chromium.args, "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForFunction("window.__myaiAvatar === true", { timeout: 90000 });
  await new Promise((r) => setTimeout(r, 1200));

  await page.evaluate(() => {
    window.__engine.debugFreezeWave = true;
    window.__engine.setState("shh");
  });
  await new Promise((r) => setTimeout(r, 600));

  const setParams = async (vals) => {
    await page.evaluate((ps, vs) => {
      const map = {};
      ps.forEach((p, i) => {
        if (!map[p.bone]) map[p.bone] = [0, 0, 0];
        map[p.bone][p.idx] = vs[i];
      });
      window.__engine.debugSetPose("shh", map);
    }, PARAMS, vals);
  };

  const measure = async () => {
    await new Promise((r) => setTimeout(r, 500));
    return page.evaluate(() => {
      const p = window.__engine.debugPositions();
      return { tip: p.rightIndexDistal, hand: p.rightHand, elbow: p.rightLowerArm };
    });
  };

  const dist = (m, t) => Math.hypot(m.x - t[0], m.y - t[1], m.z - t[2]);

  const objective = (m) => {
    const dTip = dist(m.tip, TARGET.tip);
    const dHand = dist(m.hand, TARGET.hand);
    const dElbow = dist(m.elbow, TARGET.elbow);
    // clip penalty: elbow must not enter torso (|x|>0.15) and stay slightly in front (z>0.04)
    let clip = 0;
    if (Math.abs(m.elbow.x) < 0.15) clip += (0.15 - Math.abs(m.elbow.x)) * 5;
    if (m.elbow.z < 0.04) clip += (0.04 - m.elbow.z) * 3;
    // forearm midpoint must clear the chest: outside |x|>0.12 OR in front z>0.11
    const mid = {
      x: (m.elbow.x + m.hand.x) / 2,
      y: (m.elbow.y + m.hand.y) / 2,
      z: (m.elbow.z + m.hand.z) / 2,
    };
    if (Math.abs(mid.x) < 0.12 && mid.z < 0.11)
      clip += Math.min(0.12 - Math.abs(mid.x), 0.11 - mid.z) * 8;
    return dTip + 0.6 * dHand + 1.0 * dElbow + clip;
  };

  let values = PARAMS.map((p) => p.init);
  await setParams(values);
  let m = await measure();
  let best = objective(m);
  let step = 0.25;

  for (let pass = 0; pass < 6 && step > 0.015; pass++) {
    for (let i = 0; i < values.length; i++) {
      for (const dir of [1, -1]) {
        const trial = [...values];
        trial[i] = Math.min(PARAMS[i].max, Math.max(PARAMS[i].min, trial[i] + dir * step));
        await setParams(trial);
        const tm = await measure();
        const t = objective(tm);
        if (t < best - 0.002) {
          best = t;
          values = trial;
          m = tm;
          for (let k = 0; k < 8; k++) {
            const v2 = [...values];
            v2[i] = Math.min(PARAMS[i].max, Math.max(PARAMS[i].min, v2[i] + dir * step));
            await setParams(v2);
            const m2 = await measure();
            const t2 = objective(m2);
            if (t2 < best - 0.002) {
              best = t2;
              values = v2;
              m = m2;
            } else break;
          }
          break;
        }
      }
    }
    step *= 0.55;
  }

  console.log(`shh final objective: ${best.toFixed(3)}`);
  console.log("clip check: elbow =", JSON.stringify(m.elbow));
  console.log("tip =", JSON.stringify(m.tip));
  PARAMS.forEach((p, i) => console.log(`  ${p.bone}[${p.idx}]: ${values[i].toFixed(2)}`));

  // screenshot final pose
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: "/tmp/shots/shh_opt.png", clip: { x: 356, y: 40, width: 568, height: 380 } });

  await browser.close();
  console.log("done");
})().catch((e) => {
  console.error("FAIL", e);
  process.exit(1);
});
