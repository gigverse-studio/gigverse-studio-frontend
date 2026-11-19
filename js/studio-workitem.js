// Studio — "what did this talent take?": the script (file name) or the code, shown next to the talent everywhere.
//   NMWork.tag(w)   -> small markup: "📜 سكريبت  script_03.txt" and/or "🔑 كود  GWM_12" ("" when the person has none)
//   NMWork.text(w)  -> plain text for search boxes / copy: "script_03.txt GWM_12"
// w = { script, code } as the server sends it (work_item / workItem); null when the task has a shared script and no codes.
(function () {
  function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; }
  function tag(w) {
    if (!w || (!w.script && !w.code)) return "";
    var out = "";
    if (w.script) out += '<span class="work-tag" title="السكريبت اللي خده"><span class="work-ico">\uD83D\uDCDC</span> <span>سكريبت</span> <b dir="ltr">' + esc(w.script) + "</b></span>";
    if (w.code) out += '<span class="work-tag" title="الكود اللي خده"><span class="work-ico">\uD83D\uDD11</span> <span>كود</span> <b dir="ltr">' + esc(w.code) + "</b></span>";
    return '<div class="work-tags">' + out + "</div>";
  }
  function text(w) { return w ? [w.script, w.code].filter(Boolean).join(" ") : ""; }
  window.NMWork = { tag: tag, text: text };
})();
