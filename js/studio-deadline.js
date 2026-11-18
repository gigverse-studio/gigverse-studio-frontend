// Studio — the optional task deadline (ديدلاين) and its countdown timer.
//   NMDeadline.timerHtml(iso, serverNow)  -> the live countdown row for a task card ("" when there is no deadline)
//   NMDeadline.passed(iso, serverNow)     -> true once the deadline has passed (judged with the SERVER's clock)
//   NMDeadline.start()                    -> starts the one-second ticker (safe to call many times)
//   NMDeadline.pill(iso)                  -> small static "⏳ ينتهي ..." / "⌛ انتهى" pill for the leaders' tables ("" = none)
//   NMDeadline.mountForm(boxId, prefix)   -> draws the "add a deadline" form (checkbox + after-a-duration / exact-date)
//   NMDeadline.readForm(prefix)           -> { on, iso, error }   (iso = the exact moment, computed now for "after a duration")
//   NMDeadline.fillForm(prefix, iso)      -> shows an existing deadline in the form
// The countdown uses the server's clock (every task of GET /talent/tasks carries server_now), so a talent whose own
// clock is wrong still sees the right time. When a card's time runs out it is removed from the page and the page's
// optional window.nmOnTaskExpired() is called (it reloads the list), because an ended task leaves the available list.
(function () {
  var timer = null;

  function ms(iso) { var t = new Date(iso).getTime(); return isFinite(t) ? t : null; }
  // how far the server's clock is ahead of this device's (ms); 0 when the server did not say
  function offsetOf(serverNow) { var s = ms(serverNow); return s === null ? 0 : s - Date.now(); }
  function remaining(iso, offset) { var t = ms(iso); return t === null ? null : t - (Date.now() + (offset || 0)); }
  function passed(iso, serverNow) { var r = remaining(iso, offsetOf(serverNow)); return r !== null && r <= 0; }
  function two(n) { return (n < 10 ? "0" : "") + n; }

  // 2d 03:12:44  /  03:12:44   (Latin digits and letters on purpose: it reads the same in Arabic and English)
  function fmtLeft(r) {
    var s = Math.max(0, Math.floor(r / 1000));
    var d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return (d > 0 ? d + "d " : "") + two(h) + ":" + two(m) + ":" + two(sec);
  }
  function level(r) { return r <= 3600e3 ? "urgent" : r <= 86400e3 ? "soon" : ""; }
  function when(iso) {
    try { return new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }); } catch (e) { return String(iso); }
  }

  function timerHtml(iso, serverNow) {
    if (!iso) return "";
    var off = offsetOf(serverNow), r = remaining(iso, off);
    if (r === null || r <= 0) return "";
    return '<div class="tc-deadline ' + level(r) + '" data-deadline="' + iso + '" data-offset="' + off + '" title="' + when(iso) + '">' +
      '<span class="tc-dl-label">⏳ <span>فاضل على الديدلاين</span></span> <b class="tc-timer" dir="ltr">' + fmtLeft(r) + "</b></div>";
  }

  var expiredSoon = null;
  function tick() {
    var nodes = document.querySelectorAll("[data-deadline]");
    var any = false;
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i], r = remaining(el.getAttribute("data-deadline"), Number(el.getAttribute("data-offset")) || 0);
      if (r === null) continue;
      if (r <= 0) {
        var card = el.closest(".tc") || el;
        if (card.parentNode) card.parentNode.removeChild(card);       // an ended task leaves the available list
        any = true;
        continue;
      }
      var t = el.querySelector(".tc-timer");
      if (t) t.textContent = fmtLeft(r);
      el.className = "tc-deadline " + level(r);
    }
    if (any && typeof window.nmOnTaskExpired === "function") {
      clearTimeout(expiredSoon);
      expiredSoon = setTimeout(function () { try { window.nmOnTaskExpired(); } catch (e) {} }, 1500);
    }
  }
  function start() { if (!timer) timer = setInterval(tick, 1000); }

  function pill(iso) {
    if (!iso) return "";
    var r = remaining(iso, 0);
    if (r === null) return "";
    if (r <= 0) return '<span class="studio-pill status-rejected" title="' + when(iso) + '">⌛ <span>انتهى الديدلاين</span></span>';
    return '<span class="studio-pill" title="' + when(iso) + '">⏳ <span>الديدلاين:</span> <span dir="ltr">' + when(iso) + "</span></span>";
  }

  // ---------------------------------------------------------------- the form (publish + edit pages)
  function $(id) { return document.getElementById(id); }
  function localValue(d) {      // a Date -> "YYYY-MM-DDTHH:mm" in the device's own time zone, for <input type="datetime-local">
    return d.getFullYear() + "-" + two(d.getMonth() + 1) + "-" + two(d.getDate()) + "T" + two(d.getHours()) + ":" + two(d.getMinutes());
  }
  function mountForm(boxId, p) {
    var box = $(boxId);
    if (!box) return;
    box.innerHTML =
      '<label class="fb-check"><input type="checkbox" id="' + p + '-has-deadline"> <span>إضافة ديدلاين للمهمة (تايمر على كارت المهمة)</span></label>' +
      '<div id="' + p + '-dl-box" class="hidden" style="margin-top:8px;">' +
        '<div style="display:flex; gap:18px; flex-wrap:wrap; margin-bottom:10px;">' +
          '<label class="fb-check"><input type="radio" name="' + p + '-dl-mode" value="after" checked> <span>بعد مدة</span></label>' +
          '<label class="fb-check"><input type="radio" name="' + p + '-dl-mode" value="date"> <span>تاريخ ووقت محدد</span></label>' +
        "</div>" +
        '<div id="' + p + '-dl-after" style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">' +
          '<input type="number" id="' + p + '-dl-n" min="1" max="3650" step="1" value="1" dir="ltr" style="max-width:110px;">' +
          '<select id="' + p + '-dl-unit" style="max-width:140px;"><option value="h">ساعة</option><option value="d" selected>يوم</option></select>' +
        "</div>" +
        '<div id="' + p + '-dl-date" class="hidden"><input type="datetime-local" id="' + p + '-dl-at" dir="ltr" style="max-width:260px;"></div>' +
        '<p class="studio-hint" id="' + p + '-dl-note" style="margin-top:6px;"></p>' +
      "</div>";
    var sync = function () {
      var on = $(p + "-has-deadline").checked;
      $(p + "-dl-box").classList.toggle("hidden", !on);
      var mode = (document.querySelector('input[name="' + p + '-dl-mode"]:checked') || {}).value;
      $(p + "-dl-after").classList.toggle("hidden", mode === "date");
      $(p + "-dl-date").classList.toggle("hidden", mode !== "date");
      if (mode === "date") $(p + "-dl-at").min = localValue(new Date());
    };
    $(p + "-has-deadline").addEventListener("change", sync);
    box.querySelectorAll('input[name="' + p + '-dl-mode"]').forEach(function (r) { r.addEventListener("change", sync); });
    box.__sync = sync;
  }
  function setNote(p, text) { var n = $(p + "-dl-note"); if (n) n.textContent = text; }

  function readForm(p) {
    var cb = $(p + "-has-deadline");
    if (!cb || !cb.checked) return { on: false, iso: null, error: null };
    var mode = (document.querySelector('input[name="' + p + '-dl-mode"]:checked') || {}).value;
    if (mode === "date") {
      var v = $(p + "-dl-at").value;
      var d = v ? new Date(v) : null;     // "YYYY-MM-DDTHH:mm" is read in the device's own time zone
      if (!d || !isFinite(d.getTime())) return { on: true, iso: null, error: "اختار تاريخ ووقت الديدلاين." };
      if (d.getTime() <= Date.now()) return { on: true, iso: null, error: "ميعاد الديدلاين لازم يكون في المستقبل." };
      return { on: true, iso: d.toISOString(), error: null };
    }
    var n = Number($(p + "-dl-n").value), unit = $(p + "-dl-unit").value;
    if (!isFinite(n) || n < 1 || Math.floor(n) !== n || n > 3650) return { on: true, iso: null, error: "اكتب مدة الديدلاين (رقم صحيح من 1 لـ 3650)." };
    return { on: true, iso: new Date(Date.now() + n * (unit === "h" ? 3600e3 : 86400e3)).toISOString(), error: null };
  }

  function fillForm(p, iso) {
    var cb = $(p + "-has-deadline");
    if (!cb) return;
    cb.checked = !!iso;
    if (iso) {
      var d = new Date(iso);
      document.querySelector('input[name="' + p + '-dl-mode"][value="date"]').checked = true;
      $(p + "-dl-at").value = localValue(d);
      setNote(p, d.getTime() <= Date.now()
        ? "الديدلاين ده خلص، فالمهمة مش ظاهرة للمتسجّلين. غيّر الميعاد لوقت جاي وهترجع تظهر تاني."
        : "الديدلاين الحالي: " + when(iso));
    } else {
      document.querySelector('input[name="' + p + '-dl-mode"][value="after"]').checked = true;
      setNote(p, "");
    }
    var box = $(p + "-dl-box") && $(p + "-dl-box").parentNode;
    if (box && box.__sync) box.__sync();
  }

  window.NMDeadline = { timerHtml: timerHtml, passed: passed, start: start, pill: pill, fmtLeft: fmtLeft, mountForm: mountForm, readForm: readForm, fillForm: fillForm, setNote: setNote };
})();
