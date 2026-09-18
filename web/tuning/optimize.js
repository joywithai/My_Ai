/*
 * Pose optimizer: coordinate-descent on bone params until fingertips
 * reach anatomically-correct targets. Dev tooling only.
 */
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default;

const POSE_DEFS = {
  shh: {
    state: "shh",
    target: { tip: [-0.045, 1.615, 0.095], hand: [-0.06, 1.5, 0.1] },
    params: [
      { bone: "rightUpperArm", idx: 1, init: 1.32, min: 0.4, max: 2.4 }, // yaw
      { bone: "rightUpperArm", idx: 2, init: 0.98, min: 0.3, max: 1.5 }, // z
      { bone: "rightLowerArm", idx: 1, init: 0, min: -0.6, max: 1.5 }, // yaw
      { bone: "rightLowerArm", idx: 2, init: -2.12, min: -3.0, max: -1.2 }, // fold
      { bone: "rightHand", idx: 0, init: 0.1, min: -0.6, max: 0.6 },
      { bone: "rightHand", idx: 2, init: -0.12, min: -0.8, max: 0.4 },
    ],
  },
  greeting: {
    state: "greeting",
    target: { tip: [-0.31, 1.83, 0.1], hand: [-0.33, 1.72, 0.09] },
    params: [
      { bone: "rightUpperArm", idx: 1, init: 0.52, min: 0, max: 1.2 },
      { bone: "rightUpperArm", idx: 2, init: 0.39, min: 0.1, max: 1.2 },
      { bone: "rightLowerArm", idx: 1, init: 0.15, min: -0.8, max: 0.8 },
      { bone: "rightLowerArm", idx: 2, init: -2.5, min: -3.1, max: -1.8 },
      { bone: "rightHand", idx: 2, init: 0.3, min: -0.3, max: 0.6 },
    ],
  },
  thinking: {
    state: "thinking",
    target: { tip: [-0.05, 1.605, 0.075], hand: [-0.1, 1.49, 0.03] },
    params: [
      { bone: "rightUpperArm", idx: 1, init: 0.75, min: 0.2, max: 2.0 },
      { bone: "rightUpperArm", idx: 2, init: 1.15, min: 0.4, max: 1.5 },
      { bone: "rightLowerArm", idx: 1, init: -0.45, min: -1.2, max: 1.5 },
      { bone: "rightLowerArm", idx: 2, init: -2.85, min: -3.1, max: -1.5 },
      { bone: "rightHand", idx: 2, init: -0.5, min: -1.0, max: 0.3 },
    ],
  },
};

(async () => {
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
  await new Promise((r) => setTimeout(r, 1500));
  await page.evaluate(() => {
    window.__engine.debugFreezeWave = true;
  });

  const filter = process.argv[2];
  for (const [poseName, def] of Object.entries(POSE_DEFS)) {
    if (filter && poseName !== filter) continue;
    // switch to the actual state so updatePose uses this pose
    await page.evaluate((s) => window.__engine.setState(s), def.state);
    await new Promise((r) => setTimeout(r, 800));

    // reset pose to init values
    await page.evaluate((pn, d) => {
      const engine = window.__engine;
      const map = {};
      const seen = new Set();
      for (const p of d.params) {
        if (!seen.has(p.bone)) {
          map[p.bone] = [0, 0, 0];
          seen.add(p.bone);
        }
      }
      engine.debugSetPose(pn, map);
    }, poseName, def);

    let values = def.params.map((p) => p.init);
    const setParams = async (vals) => {
      await page.evaluate(
        (pn, ps, vs) => {
          const map = {};
          ps.forEach((p, i) => {
            if (!map[p.bone]) map[p.bone] = [null, null, null];
            map[p.bone][p.idx] = vs[i];
          });
          // fill unspecified components from 0
          for (const k of Object.keys(map)) {
            if (map[k][0] === null) map[k][0] = 0;
            if (map[k][1] === null) map[k][1] = 0;
            if (map[k][2] === null) map[k][2] = 0;
          }
          window.__engine.debugSetPose(pn, map);
        },
        poseName,
        def.params,
        vals
      );
    };

    const measure = async () => {
      await new Promise((r) => setTimeout(r, 550));
      return page.evaluate(() => {
        const p = window.__engine.debugPositions();
        return { tip: p.rightIndexDistal, hand: p.rightHand };
      });
    };

    const objective = (m) => {
      const dt = Math.hypot(
        m.tip.x - def.target.tip[0],
        m.tip.y - def.target.tip[1],
        m.tip.z - def.target.tip[2]
      );
      const dh = Math.hypot(
        m.hand.x - def.target.hand[0],
        m.hand.y - def.target.hand[1],
        m.hand.z - def.target.hand[2]
      );
      return dt + 0.6 * dh;
    };

    await setParams(values);
    let m = await measure();
    let best = objective(m);
    let step = 0.22;

    for (let pass = 0; pass < 5 && step > 0.02; pass++) {
      for (let i = 0; i < values.length; i++) {
        for (const dir of [1, -1]) {
          const trial = [...values];
          trial[i] = Math.min(def.params[i].max, Math.max(def.params[i].min, trial[i] + dir * step));
          await setParams(trial);
          const tm = await measure();
          const t = objective(tm);
          if (t < best - 0.002) {
            best = t;
            values = trial;
            m = tm;
            // keep moving same direction while improving
            for (let k = 0; k < 6; k++) {
              const t2v = [...values];
              t2v[i] = Math.min(def.params[i].max, Math.max(def.params[i].min, t2v[i] + dir * step));
              await setParams(t2v);
              const tm2 = await measure();
              const t2 = objective(tm2);
              if (t2 < best - 0.002) {
                best = t2;
                values = t2v;
                m = tm2;
              } else break;
            }
            break;
          }
        }
      }
      step *= 0.55;
    }

    console.log(`\n### ${poseName} — final objective ${best.toFixed(3)}`);
    console.log("params:");
    def.params.forEach((p, i) =>
      console.log(`  ${p.bone}[${p.idx}]: ${values[i].toFixed(2)}`)
    );
    console.log("tip:", JSON.stringify(m.tip), "hand:", JSON.stringify(m.hand));
  }

  await browser.close();
  console.log("\noptimize done");
})().catch((e) => {
  console.error("FAIL", e);
  process.exit(1);
});
