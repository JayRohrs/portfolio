// Progressive enhancement only: the site is fully readable without this file.
(function () {
  "use strict";

  // Videos: load the privacy-enhanced YouTube embed only on click.
  document.addEventListener("click", function (e) {
    var link = e.target.closest ? e.target.closest(".video-link") : null;
    if (!link) return;
    var fig = link.closest(".video");
    var id = fig && fig.getAttribute("data-video-id");
    if (!id) return;
    e.preventDefault();
    var frame = document.createElement("iframe");
    frame.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
    frame.title = fig.getAttribute("data-title") || "Video";
    frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    frame.setAttribute("allowfullscreen", "");
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    var box = document.createElement("div");
    box.className = "embed";
    box.appendChild(frame);
    link.replaceWith(box);
    frame.focus();
  });

  // Home page: "Looking for brain.jbase.app?" corner pill. Appears shortly after load,
  // goes away by itself after PILL_VISIBLE_MS, and can be dismissed. Nothing is stored.
  var PILL_DELAY_MS = 1500;
  var PILL_VISIBLE_MS = 3 * 60 * 1000; // about 3 minutes
  var pill = document.getElementById("brain-pill");
  if (pill) {
    var hidePill = function () {
      pill.hidden = true;
      document.documentElement.classList.remove("has-brain-pill");
    };
    setTimeout(function () {
      pill.hidden = false;
      document.documentElement.classList.add("has-brain-pill");
      setTimeout(hidePill, PILL_VISIBLE_MS);
    }, PILL_DELAY_MS);
    pill.querySelector(".brain-pill-close").addEventListener("click", hidePill);
  }

  // Work page: filter bar. Without JS the bar stays hidden and every project is listed.
  var bar = document.getElementById("filter-bar");
  var grid = document.getElementById("work-grid");
  if (!bar || !grid) return;
  var buttons = Array.prototype.slice.call(bar.querySelectorAll(".filter"));
  var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-tags]"));
  var status = document.getElementById("filter-status");
  if (!buttons.length) return;
  bar.hidden = false;

  function apply(name, push) {
    var shown = 0;
    cards.forEach(function (c) {
      var match = c.getAttribute("data-tags").split(" ").indexOf(name) !== -1;
      c.hidden = !match;
      if (match) shown++;
    });
    buttons.forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-filter") === name ? "true" : "false");
    });
    var label = bar.querySelector('[data-filter="' + name + '"]');
    status.textContent = "Showing " + shown + (shown === 1 ? " project" : " projects") + (label ? " — " + label.textContent : "");
    if (push && window.history && history.replaceState) history.replaceState(null, "", "#" + name);
  }

  buttons.forEach(function (b) {
    b.addEventListener("click", function () { apply(b.getAttribute("data-filter"), true); });
  });
  var start = (location.hash || "").replace("#", "");
  if (!bar.querySelector('[data-filter="' + start + '"]')) start = buttons[0].getAttribute("data-filter");
  apply(start, false);
})();
