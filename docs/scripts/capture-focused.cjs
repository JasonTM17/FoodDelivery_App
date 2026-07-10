const { createRequire } = require("module");
const path = require("path");
const fs = require("fs");
const ROOT = process.cwd();
const requireWeb = createRequire(path.join(ROOT, "web/package.json"));
const { chromium } = requireWeb("@playwright/test");
const API = process.env.FOODFLOW_API_URL || "https://ebony-merchants-kinda-scenario.trycloudflare.com/api";
const ADMIN = process.env.FOODFLOW_ADMIN_URL || "https://food-delivery-app-one-liard.vercel.app";
const REST = process.env.FOODFLOW_RESTAURANT_URL || "https://foodflow-restaurant.vercel.app";
const SHOTS = path.join(ROOT, "docs/screenshots");

async function login(email, password) {
  const res = await fetch(API + "/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  if (!res.ok) throw new Error("login " + res.status);
  const j = await res.json();
  return j.data;
}

async function hideDevChrome(page) {
  await page.addStyleTag({
    content: `
      nextjs-portal, [data-nextjs-toast], [data-next-badge-root],
      #__next-build-indicator, [data-nextjs-dialog-overlay] {
        display: none !important; visibility: hidden !important;
      }
    `,
  }).catch(() => {});
}

async function shot(page, file) {
  await hideDevChrome(page);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(SHOTS, file), type: "png" });
  console.log("shot", file);
}

(async () => {
  const admin = await login("admin@foodflow.vn", "Admin@123");
  const rest = await login("restaurant1@foodflow.vn", "Partner@123");
  const browser = await chromium.launch({ headless: true });

  // Public logins
  let ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "vi-VN" });
  let page = await ctx.newPage();
  await page.goto(ADMIN + "/vi/login", { waitUntil: "networkidle", timeout: 60000 });
  await shot(page, "admin/01-login.png");
  await page.goto(REST + "/vi/login", { waitUntil: "networkidle", timeout: 60000 });
  await shot(page, "restaurant/01-login.png");
  await ctx.close();

  // Admin authed
  ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "vi-VN" });
  await ctx.addInitScript(({ t }) => {
    localStorage.setItem("admin_token", t.accessToken);
    if (t.refreshToken) localStorage.setItem("admin_refresh_token", t.refreshToken);
    if (t.user) localStorage.setItem("admin_user", JSON.stringify(t.user));
  }, { t: admin });
  page = await ctx.newPage();
  for (const [f, r] of [
    ["admin/02-overview.png", "/vi/overview"],
    ["admin/03-orders.png", "/vi/orders"],
    ["admin/04-restaurants.png", "/vi/restaurants"],
    ["admin/05-users.png", "/vi/users"],
    ["admin/06-drivers.png", "/vi/drivers"],
    ["admin/07-promotions.png", "/vi/promotions"],
    ["admin/08-support.png", "/vi/support"],
    ["admin/09-analytics.png", "/vi/analytics"],
  ]) {
    await page.goto(ADMIN + r, { waitUntil: "networkidle", timeout: 60000 });
    await shot(page, f);
  }
  await ctx.close();

  // Restaurant authed
  ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "vi-VN" });
  await ctx.addInitScript(({ t }) => {
    localStorage.setItem("restaurant_token", t.accessToken);
    if (t.refreshToken) localStorage.setItem("restaurant_refresh_token", t.refreshToken);
    if (t.user) localStorage.setItem("restaurant_data", JSON.stringify(t.user));
  }, { t: rest });
  page = await ctx.newPage();
  for (const [f, r] of [
    ["restaurant/02-dashboard.png", "/vi"],
    ["restaurant/03-orders.png", "/vi/orders"],
    ["restaurant/04-menu.png", "/vi/menu"],
    ["restaurant/05-promotions.png", "/vi/promotions"],
    ["restaurant/06-revenue.png", "/vi/revenue"],
    ["restaurant/07-reviews.png", "/vi/reviews"],
    ["restaurant/08-staff.png", "/vi/staff"],
    ["restaurant/09-insights.png", "/vi/insights"],
  ]) {
    await page.goto(REST + r, { waitUntil: "networkidle", timeout: 60000 });
    await shot(page, f);
  }
  await ctx.close();
  await browser.close();
  console.log("done focused");
})().catch((e) => { console.error(e); process.exit(1); });
