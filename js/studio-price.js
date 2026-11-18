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
  window.NMPrice = { num: num, fmt: fmt, badge: badge, valid: valid };
})();
