// UI test for dashboard-qa.html (QA boxes: one box per task name). Needs:  npm i -D jsdom   (skipped if jsdom is absent)
let JSDOM;
try { ({ JSDOM } = require("jsdom")); } catch (_) { console.log("skipped: jsdom not installed"); process.exit(0); }
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const html = fs.readFileSync(path.join(__dirname, "../dashboard-qa.html"), "utf8");

const ago = (min) => new Date(Date.now() - min * 60000).toISOString();
const S = (id, o) => ({ id, task_id: "t1", leader_code: "L001", fake_name: "N" + id, gender: "male", sample_count: 12, updated_at: ago(30), created_at: ago(60), resubmitted: false, ...o });

function boot({ boxesFn, pendingFn, approve, rejectAll }) {
  return new Promise((resolve) => {
    const dom = new JSDOM(html, {
      runScripts: "dangerously", url: "https://example.com/dashboard-qa.html",
      beforeParse(w) {
        w.confirm = () => true; w.alert = (m) => { throw new Error("alert: " + m); };
        w.NMStudio = {
          requireStudioRole: () => ({ name: "QA One" }), logout() {},
          apiGetPendingBoxes: boxesFn, apiGetPendingReviews: pendingFn || (async () => []),
          apiApproveSession: approve || (async () => ({})), apiRejectAllSession: rejectAll || (async () => ({})),
        };
        w.StudioShare = { mount() {} };
      },
    });
    setTimeout(() => resolve(dom), 60);
  });
}
const text = (d, sel) => d.window.document.querySelector(sel).textContent.replace(/\s+/g, " ").trim();

(async () => {
  const boxes = [
    { key: "wake word", title: "Wake Word", pending: 3, taskCount: 2, leaders: ["L001", "L002"], oldest: ago(300),
      sessions: [S("a", { updated_at: ago(300) }), S("b", { leader_code: "L002", task_id: "t2", resubmitted: true }), S("c", { fake_name: '<img src=x onerror="window.__xss=1">' })] },
    { key: "other", title: "Other", pending: 1, taskCount: 1, leaders: ["L001"], oldest: ago(10), sessions: [S("d", { task_id: "t3", updated_at: ago(10) })] },
  ];
  const decided = [];

  // 1) boxes: first (longest waiting) open, second closed; summary; no XSS
  let dom = await boot({ boxesFn: async () => ({ totalPending: 4, boxes: JSON.parse(JSON.stringify(boxes)) }),
    approve: async (id) => { decided.push(["approve", id]); }, rejectAll: async (id, r) => { decided.push(["reject", id, r]); } });
  let d = dom.window.document;
  assert.strictEqual(d.querySelectorAll(".qa-box").length, 2);
  assert.ok(d.getElementById("box-0").classList.contains("open") && !d.getElementById("box-1").classList.contains("open"));
  assert.ok(text(dom, "#qa-summary").includes("4 تسليم منتظر في 2 مهمة"));
  assert.ok(text(dom, "#box-0").includes("2 مهام بنفس الاسم"));
  assert.strictEqual(d.querySelectorAll("#box-0 tbody tr").length, 3);
  assert.ok(text(dom, "#row-b").includes("إعادة تسليم") && !text(dom, "#row-a").includes("إعادة تسليم"));
  assert.ok(!dom.window.__xss && !d.querySelector("#box-0 img"), "fake name must be escaped");
  assert.ok(d.querySelector("#box-0 .qa-box-actions a").href.endsWith("qa-review.html?session=a"), "start with the oldest");

  // 2) leader filter inside a box
  d.querySelector('#box-0 [data-act="leader"][data-leader="L002"]').click();
  assert.strictEqual(d.querySelectorAll("#box-0 tbody tr").length, 1);
  d.querySelector('#box-0 [data-act="leader"][data-leader=""]').click();
  assert.strictEqual(d.querySelectorAll("#box-0 tbody tr").length, 3);

  // 3) open a closed box
  d.querySelector('#box-1 [data-act="toggle"]').click();
  assert.ok(d.getElementById("box-1").classList.contains("open"));

  // 4) search by task name
  const search = d.getElementById("qa-search"); search.value = "other"; search.dispatchEvent(new dom.window.Event("input"));
  assert.strictEqual(d.querySelectorAll(".qa-box").length, 1);
  search.value = "zzz"; search.dispatchEvent(new dom.window.Event("input"));
  assert.ok(text(dom, "#pending-wrap").includes("مفيش نتايج"));
  search.value = ""; search.dispatchEvent(new dom.window.Event("input"));

  // 5) approve the only submission of a box -> the box disappears, summary updates
  dom.window.quickApprove("d");
  await new Promise((r) => setTimeout(r, 20));
  assert.deepStrictEqual(decided[0], ["approve", "d"]);
  assert.strictEqual(d.querySelectorAll(".qa-box").length, 1);
  assert.ok(text(dom, "#qa-summary").includes("3 تسليم منتظر في 1 مهمة"));

  // 6) reject everything with a reason
  dom.window.openRejectPrompt("a");
  d.getElementById("reject-reason-input").value = "noisy";
  d.getElementById("reject-confirm").click();
  await new Promise((r) => setTimeout(r, 20));
  assert.deepStrictEqual(decided[1], ["reject", "a", "noisy"]);
  assert.strictEqual(d.querySelectorAll("#box-0 tbody tr").length, 2);

  // 7) nothing waiting -> friendly empty state, no toolbar
  dom = await boot({ boxesFn: async () => ({ totalPending: 0, boxes: [] }) });
  assert.ok(text(dom, "#pending-wrap").includes("مفيش تسليمات منتظرة"));
  assert.strictEqual(dom.window.document.getElementById("qa-toolbar").style.display, "none");

  // 8) OLD server (no /boxes -> 404): the page groups the flat list itself, same boxes
  const e404 = Object.assign(new Error("x"), { status: 404 });
  dom = await boot({ boxesFn: async () => { throw e404; },
    pendingFn: async () => [
      { id: "1", task_title: "Wake  Word", leader_code: "L002", fake_name: "A", gender: "male", sample_count: 5, updated_at: ago(50) },
      { id: "2", task_title: "wake word", leader_code: "L001", fake_name: "B", gender: "female", sample_count: 5, updated_at: ago(40) },
      { id: "3", task_title: "Different", leader_code: "L001", fake_name: "C", gender: "male", sample_count: 5, updated_at: ago(5) } ] });
  d = dom.window.document;
  assert.strictEqual(d.querySelectorAll(".qa-box").length, 2);
  assert.strictEqual(d.querySelectorAll("#box-0 tbody tr").length, 2);

  // 9) a real error (not 404) is shown, not swallowed
  dom = await boot({ boxesFn: async () => { throw Object.assign(new Error("boom"), { status: 500 }); } });
  assert.ok(text(dom, "#pending-wrap").includes("boom"));

  console.log("ok - ui-qa-boxes");
})().catch((e) => { console.error(e); process.exit(1); });
