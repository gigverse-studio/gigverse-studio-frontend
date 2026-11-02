// Head-leader dashboard: the Google Drive card. Reconnecting must go back to the SAME account;
// switching accounts is a separate, confirmed action.
const test = require("node:test"), assert = require("node:assert");
const { load, arabicLeft } = require("./ui-helper");
const HL = { studio_token: "tok", studio_role: "head_leader", studio_user: JSON.stringify({ id: "h", name: "Head" }) };
const cls = (d, id) => d.getElementById(id).classList.contains("hidden");
const page = (status, opts = {}) => load("dashboard-head-leader.html", {
  storage: HL, lang: opts.lang || "ar", search: opts.search || "",
  routes: [
    [/drive\/status/, () => ({ status: 200, body: status })],
    [/drive\/connect-url/, () => ({ status: 200, body: { url: "https://accounts.google.com/o/oauth2/auth?x=1" } })],
    [/./, () => ({ status: 200, body: [] })],
  ],
});

test("connected: shows the account, only 'change account' is offered, and it asks first", async () => {
  const p = await page({ connected: true, email: "c@x.com", accountEmail: "c@x.com" }); await p.wait(150);
  assert.match(p.d.getElementById("drive-status").textContent, /c@x\.com/);
  assert.equal(cls(p.d, "drive-btn"), true);
  assert.equal(cls(p.d, "drive-change-btn"), false);
  let asked = 0; p.w.confirm = () => { asked++; return false; };
  p.d.getElementById("drive-change-btn").click(); await p.wait(80);
  assert.equal(asked, 1);
  assert.equal(p.calls.filter((c) => /connect-url/.test(c.path)).length, 0, "declined -> nothing requested");
  p.w.confirm = () => true;
  p.d.getElementById("drive-change-btn").click(); await p.wait(80);
  assert.ok(p.calls.some((c) => /connect-url\?mode=change/.test(c.path)));
});

test("connection died: names the saved account; 'reconnect' asks for the SAME account without a confirm", async () => {
  const p = await page({ connected: false, email: null, accountEmail: "old@x.com" }); await p.wait(150);
  assert.match(p.d.getElementById("drive-status").textContent, /old@x\.com/);
  assert.equal(cls(p.d, "drive-btn"), false);
  assert.equal(p.d.getElementById("drive-btn").textContent, "إعادة الربط بنفس الحساب");
  assert.equal(p.d.getElementById("drive-change-btn").textContent, "ربط حساب مختلف");
  let asked = 0; p.w.confirm = () => { asked++; return true; };
  p.d.getElementById("drive-btn").click(); await p.wait(80);
  assert.equal(asked, 0);
  assert.ok(p.calls.some((c) => /connect-url\?mode=reconnect/.test(c.path)));
});

test("never connected: plain 'connect' button, no change button", async () => {
  const p = await page({ connected: false, email: null, accountEmail: null }); await p.wait(150);
  assert.equal(p.d.getElementById("drive-btn").textContent, "ربط Google Drive");
  assert.equal(cls(p.d, "drive-btn"), false);
  assert.equal(cls(p.d, "drive-change-btn"), true);
});

test("wrong account picked: the page says which account is expected", async () => {
  const p = await page({ connected: false, email: null, accountEmail: "a@x.com" }, { search: "?drive=mismatch&expected=a%40x.com&got=b%40y.com" }); await p.wait(150);
  const msg = p.d.getElementById("drive-error").textContent;
  assert.match(msg, /b@y\.com/); assert.match(msg, /a@x\.com/);
  assert.equal(p.w.location.search, "", "the message is shown once, then the URL is cleaned");
});

test("English: no Arabic left in the Drive card, emails are kept", async () => {
  const p = await page({ connected: false, email: null, accountEmail: "old@x.com" }, { lang: "en", search: "?drive=mismatch&expected=a%40x.com&got=b%40y.com" }); await p.wait(200);
  const card = p.d.getElementById("drive-status").closest(".studio-card");
  const left = arabicLeft(p.d).filter((t) => card.textContent.includes(t));
  assert.deepEqual(left, []);
  assert.match(p.d.getElementById("drive-status").textContent, /old@x\.com/);
  assert.match(p.d.getElementById("drive-error").textContent, /b@y\.com.*a@x\.com/s);
  assert.equal(p.d.getElementById("drive-btn").textContent, "Reconnect with the same account");
});

test("a backend without the Drive endpoints hides the card (as before)", async () => {
  const p = await load("dashboard-head-leader.html", { storage: HL, routes: [[/drive/, () => ({ status: 404, body: { error: "x" } })], [/./, () => ({ status: 200, body: [] })]] });
  await p.wait(150);
  assert.equal(p.d.getElementById("drive-status").closest(".studio-card").classList.contains("hidden"), true);
});
