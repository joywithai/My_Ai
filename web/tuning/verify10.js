/* E2E (backend mode): frontend ↔ .NET contract via tuning/dotnetStub.js.
 * Every UI flow must hit the real .NET-shaped endpoints — coverage printed at the end.
 */
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default;
const http = require("http");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const getHits = () => new Promise((resolve, reject) => {
  http.get("http://localhost:5000/__hits", (res) => {
    let d = ""; res.on("data", (c) => (d += c)); res.on("end", () => resolve(JSON.parse(d)));
  }).on("error", reject);
});

(async () => {
  const browser = await puppeteer.launch({
    executablePath: await chromium.executablePath(),
    headless: "shell",
    args: [...chromium.args, "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader", "--autoplay-policy=no-user-gesture-required", "--window-size=1280,800"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  // production login: type credentials (demo chips removed)
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2", timeout: 60000 });
  await sleep(1000);
  await page.evaluate(() => localStorage.removeItem("myai.auth"));
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2" });
  await sleep(800);
  const typeLogin = async (email, pass) => {
    await page.click('input[type="email"]');
    await page.type('input[type="email"]', email);
    await page.click('input[type="password"]');
    await page.type('input[type="password"]', pass);
    await page.keyboard.press("Enter");
    await sleep(3000);
  };
  // 1. login as admin
  console.log("-> login (admin@demo.com)");
  await typeLogin("admin@demo.com", "admin123");
  console.log("url:", page.url());
  console.log("topbar:", (await page.evaluate(() => document.body.innerText.replace(/\n/g, " | ").slice(0, 80))));
  await page.waitForFunction("window.__myaiAvatar === true", { timeout: 90000 });
  await sleep(3000);

  // 2. chat → POST /api/chat + POST /api/tts (+ visemes from boundaries)
  console.log("-> chat send");
  await page.type("textarea", "hello");
  await page.click('button[title="পাঠাও"]');
  await sleep(9000);

  // 3. settings → /api/avatars + /api/framing + /api/settings
  console.log("-> settings");
  await page.goto("http://localhost:3000/settings", { waitUntil: "networkidle2" });
  await sleep(2000);
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll("aside nav button")];
    btns.find((b) => b.textContent.includes("Avatar"))?.click();
  });
  await sleep(1500);
  // History tab → GET /api/conversations, DELETE + open one → GET /api/conversations/:id
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll("aside nav button")];
    btns.find((b) => /history/i.test(b.textContent))?.click();
  });
  await sleep(1500);
  const delClicked = await page.evaluate(() => {
    const row = document.querySelector(".cursor-pointer");
    const trash = row?.querySelector("button");
    if (trash) { trash.click(); return true; }
    return false;
  });
  await sleep(1500);
  console.log("history delete clicked:", delClicked);
  await page.evaluate(() => document.querySelector(".cursor-pointer")?.click());
  await sleep(3500); // navigates to /chat?c=… → deep-link loads messages
  console.log("history open → url:", page.url());
  await page.goto("http://localhost:3000/settings", { waitUntil: "networkidle2" });
  await sleep(1500);
  // Custom AI tab → PUT /api/settings (save key + remove key)
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll("aside nav button")];
    btns.find((b) => /ai/i.test(b.textContent))?.click();
  });
  await sleep(1200);
  const aiTab = await page.evaluate(() => {
    const inp = document.querySelector('input[type="password"], input[placeholder*="key" i], input[placeholder*="sk" i]');
    return !!inp;
  });
  if (aiTab) {
    await page.click('input[type="password"], input[placeholder*="key" i], input[placeholder*="sk" i]');
    await page.type('input[type="password"], input[placeholder*="key" i], input[placeholder*="sk" i]', "sk-test-1234567890abcd");
    const save = await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find((x) => /save|সেভ/i.test(x.textContent));
      if (b) { b.click(); return true; }
      return false;
    });
    await sleep(2000);
    console.log("custom key saved:", save);
  }

  // 4. admin — every tab + a WRITE action per tab (full control check)
  console.log("-> admin tabs (+writes)");
  await page.goto("http://localhost:3000/admin", { waitUntil: "networkidle2" });
  await sleep(2000);
  // Users tab (default): ban toggle → PATCH /api/admin/users/:id
  await page.evaluate(() => document.querySelector('button[title="Ban"], button[title="Unban"]')?.click());
  await sleep(1200);
  console.log("  users: PATCH sent");
  for (const label of ["Flags", "Expressions", "Animations", "Avatars", "Plans", "System", "Audit"]) {
    await page.evaluate((l) => {
      const btns = [...document.querySelectorAll("main button")];
      btns.find((b) => b.textContent.trim().startsWith(l))?.click();
    }, label);
    await sleep(1100);
    // flip the first toggle in the tab → write endpoint for that resource
    await page.evaluate(() => document.querySelector('[role="switch"]')?.click());
    await sleep(900);
    console.log("  tab", label, "ok (write sent)");
  }

  // 5. subscription as PUBLIC user → /api/plans + POST /api/payments/checkout
  console.log("-> subscription (public user)");
  await page.evaluate(() => localStorage.removeItem("myai.auth"));
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2" });
  await sleep(1000);
  await typeLogin("public@demo.com", "public123");
  await page.goto("http://localhost:3000/subscription", { waitUntil: "networkidle2" });
  await sleep(2500);
  const clicked = await page.evaluate(() => {
    const btns = [...document.querySelectorAll("button")];
    const b = btns.find((x) => /checkout/i.test(x.textContent));
    if (b) { b.click(); return b.textContent.trim(); }
    return null;
  });
  await sleep(3000);
  console.log("checkout button:", clicked);

  await browser.close();

  const hits = await getHits();
  const required = [
    "POST /api/auth/login", "GET /api/auth/me", "GET /api/framing", "POST /api/chat", "POST /api/tts",
    "GET /api/avatars", "PUT /api/settings",
    "GET /api/conversations", "GET /api/conversations/c3000000-0000-0000-0000-000000000003",
    "DELETE /api/conversations/c3000000-0000-0000-0000-000000000003",
    "GET /api/admin/users", "PATCH /api/admin/users/b2000000-0000-0000-0000-000000000002",
    "GET /api/admin/flags", "PUT /api/admin/flags",
    "GET /api/admin/expressions", "PUT /api/admin/expressions",
    "GET /api/admin/animations", "PUT /api/admin/animations",
    "GET /api/admin/avatars", "PUT /api/admin/avatars",
    "GET /api/admin/plans", "PATCH /api/admin/plans/e5000000-0000-0000-0000-000000000002",
    "GET /api/admin/settings", "PUT /api/admin/settings",
    "GET /api/admin/audit",
    "GET /api/plans", "POST /api/payments/checkout",
  ];
  const missing = required.filter((r) => !hits.includes(r));
  console.log("ENDPOINT COVERAGE:", hits.length, "hit");
  hits.sort().forEach((h) => console.log("  ✓", h));
  if (missing.length) { console.log("MISSING:", missing); }
  console.log("pageerrors:", errors.length, errors.slice(0, 4));
  process.exit(errors.length || missing.length ? 1 : 0);
})();
