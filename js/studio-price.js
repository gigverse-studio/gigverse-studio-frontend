// Studio — the optional task price (US dollars), shown the same way everywhere.
//   NMPrice.num(p)     -> a positive number, or null when the task has no price
//   NMPrice.fmt(p)     -> "$12.50" / "$5" / ""   (empty when there is no price)
//   NMPrice.badge(p)   -> small "💵 $12.50" pill markup, or "" when there is no price
//   NMPrice.valid(s)   -> true for "5" / "12.50" (a positive amount with at most 2 decimals)
(function () {
  function num(p) {
    if (p === null || p === undefined || p === "") return null;
    var n = Number(p);
    return isFinite(n) && n > 0 ? n : null;
  }
  function fmt(p) {
    var n = num(p);
    if (n === null) return "";
    return "$" + (Math.round(n) === n ? String(n) : n.toFixed(2));
  }
  function badge(p) {
    var t = fmt(p);
    return t ? '<span class="price-badge" dir="ltr" title="سعر المهمة">💵 ' + t + "</span>" : "";
  }
  function valid(s) {
    s = String(s == null ? "" : s).trim().replace(/^\$/, "").trim();
    return /^\d+(\.\d{1,2})?$/.test(s) && Number(s) > 0;
  }
  // v15 — "total earning" card. e = { confirmedUsd, pendingUsd, confirmedCount, pendingCount, unpricedCount, tasks:[...] }
  // (what the server's /me/earnings and /leader/earnings return). Display only.
  function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; }
  function money(n) { n = Number(n) || 0; return "$" + (Math.round(n) === n ? String(n) : n.toFixed(2)); }
  function earningsCard(e, opts) {
    opts = opts || {};
    if (!e) return "";
    var rows = (e.tasks || []).map(function (t) {
      return "<tr><td>" + esc(t.title) + "</td>" +
        "<td dir=\"ltr\">" + (num(t.price) !== null ? fmt(t.price) : "—") + "</td>" +
        "<td>" + t.confirmedCount + "</td><td dir=\"ltr\">" + money(t.confirmedUsd) + "</td>" +
        "<td>" + t.pendingCount + "</td><td dir=\"ltr\">" + money(t.pendingUsd) + "</td></tr>";
    }).join("");
    return '<div class="studio-card" style="margin-top:18px;">' +
      '<div class="studio-eyebrow">' + (opts.title || "💰 إجمالي الأرباح") + "</div>" +
      '<div style="display:flex; gap:28px; flex-wrap:wrap; margin-top:6px;">' +
        '<div><div class="studio-title" style="font-size:1.8rem; margin:0;" dir="ltr">' + money(e.confirmedUsd) + "</div>" +
        '<div class="studio-hint">مؤكد — الشركة قبلته (' + (e.confirmedCount || 0) + ")</div></div>" +
        '<div><div class="studio-title" style="font-size:1.8rem; margin:0; opacity:.75;" dir="ltr">' + money(e.pendingUsd) + "</div>" +
        '<div class="studio-hint">⏳ مستني قبول الشركة (' + (e.pendingCount || 0) + ")</div></div>" +
      "</div>" +
      (e.unpricedCount ? '<div class="studio-hint" style="margin-top:8px;"><span>تسليمات على تاسكات بدون سعر (مش محسوبة):</span> <b>' + e.unpricedCount + "</b></div>" : "") +
      (rows ? '<details style="margin-top:10px;"><summary style="cursor:pointer;">تفاصيل كل تاسك</summary>' +
        '<div class="studio-table-wrap"><table class="studio-table"><thead><tr><th>المهمة</th><th>السعر</th><th>مؤكد</th><th>المبلغ</th><th>مستني</th><th>المبلغ</th></tr></thead><tbody>' + rows + "</tbody></table></div></details>" : "") +
      "</div>";
  }
  window.NMPrice = { num: num, fmt: fmt, badge: badge, valid: valid, earningsCard: earningsCard };
})();
