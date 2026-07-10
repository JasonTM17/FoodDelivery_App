const { createRequire } = require("module");
const path = require("path");
const ROOT = process.cwd();
const { chromium } = createRequire(path.join(ROOT, "web/package.json"))("@playwright/test");
const API = "http://localhost:3001/api";
const ADMIN = "http://localhost:3000";
const REST = "http://localhost:3002";
const SHOTS = path.join(ROOT, "docs/screenshots");
(async () => {
  const login = async (email, password) => {
    const res = await fetch(API + "/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    return (await res.json()).data;
  };
  const admin = await login("admin@foodflow.vn", "Admin@123");
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "vi-VN" });
  await ctx.addInitScript(({ t }) => {
    localStorage.setItem("admin_token", t.accessToken);
    if (t.refreshToken) localStorage.setItem("admin_refresh_token", t.refreshToken);
    if (t.user) localStorage.setItem("admin_user", JSON.stringify(t.user));
  }, { t: admin });
  const page = await ctx.newPage();
  await page.goto(ADMIN + "/vi/restaurants", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SHOTS, "admin/04-restaurants.png") });
  await page.goto(ADMIN + "/vi/support", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS, "admin/08-support.png") });
  console.log("restaurants+support captured");
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
