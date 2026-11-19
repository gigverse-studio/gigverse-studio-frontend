// Studio — dark mode. Loaded in <head> of every page so the saved theme is applied BEFORE the page paints (no white flash).
//   - the choice is saved in localStorage ("studio_theme": "dark" | "light") and follows the person across pages;
//   - a 🌙 / ☀️ button is added to the top bar (next to the AR / EN switch); pages without a top bar get a small floating one;
//   - all the colours live in css/studio.css under html[data-theme="dark"].
(function () {
  var KEY = "studio_theme";
  var root = document.documentElement;

  function saved() { try { return localStorage.getItem(KEY) === "dark" ? "dark" : "light"; } catch (e) { return "light"; } }
  function apply(t) {
    if (t === "dark") root.setAttribute("data-theme", "dark"); else root.removeAttribute("data-theme");
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", t === "dark" ? "#0B1522" : "#E9F5F9");
  }
  apply(saved());                       // immediately, while <head> is still being parsed

  function paint(btn) {
    var dark = root.getAttribute("data-theme") === "dark";
    btn.textContent = dark ? "\u2600\uFE0F" : "\uD83C\uDF19";
    var label = dark ? "الوضع الفاتح / Light mode" : "الوضع الداكن / Dark mode";
    btn.setAttribute("title", label); btn.setAttribute("aria-label", label);
    btn.setAttribute("aria-pressed", dark ? "true" : "false");
  }

  function inject() {
    if (document.getElementById("studio-theme-toggle")) return;
    var btn = document.createElement("button");
    btn.type = "button"; btn.id = "studio-theme-toggle"; btn.className = "studio-theme-btn";
    btn.setAttribute("data-no-i18n", "");
    paint(btn);
    btn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      try { localStorage.setItem(KEY, next); } catch (e) { /* private mode: still works for this page */ }
      apply(next); paint(btn);
    });
    var header = document.querySelector(".studio-header");
    var nav = header && header.querySelector("nav");
    if (nav) nav.appendChild(btn);
    else if (header) header.appendChild(btn);
    else { btn.className += " studio-theme-floating"; document.body.appendChild(btn); }
  }

  // other tabs / windows stay in sync
  window.addEventListener("storage", function (e) {
    if (e.key !== KEY) return;
    apply(saved());
    var b = document.getElementById("studio-theme-toggle"); if (b) paint(b);
  });

  window.StudioTheme = { get: function () { return root.getAttribute("data-theme") === "dark" ? "dark" : "light"; }, set: function (t) { try { localStorage.setItem(KEY, t); } catch (e) {} apply(t); var b = document.getElementById("studio-theme-toggle"); if (b) paint(b); } };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", inject); else inject();
})();
