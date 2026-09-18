# Pose / Visual tuning scripts (dev only)

Sandbox-এ headless Chrome দিয়ে pose verify করার স্ক্রিপ্ট। অ্যাপের অংশ না।

চালাতে:
1. `npm i -D puppeteer-core @sparticuz/chromium` (এই sandbox-এ NSS libs লাগে:
   `LD_LIBRARY_PATH` এ al2023 bundle এর lib ফোল্ডার দিতে হয়)
2. dev server চালু রাখো (port 3000)
3. `LD_LIBRARY_PATH=<libs> node tuning/posecheck.js`

- `posecheck.js` — প্রতিটা pose এর fingertip world-position + screenshot
- `shot.js` — পুরো user-flow (landing → login → chat → settings → admin)
- `optimize.js` — coordinate-descent optimizer: টার্গেট পজিশনে হাত পৌঁছে দেয়,
  converged মান `src/lib/engine/poses.ts` এ বসানো হয়
