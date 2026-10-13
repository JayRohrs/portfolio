// "Start a project" form: validates in the browser, then opens the visitor's own
// email program (mailto) or copies the request text. Nothing is sent anywhere.
(function () {
  "use strict";
  var form = document.getElementById("start-form");
  if (!form || !window.Intake) return;
  var to = form.getAttribute("data-to");
  var summary = document.getElementById("form-errors");
  var status = document.getElementById("form-status");
  var preview = document.getElementById("request-preview");
  var previewBox = document.getElementById("preview-box");
  var noJs = document.getElementById("no-js-note");
  if (noJs) noJs.hidden = true;
  form.hidden = false;

  function values() {
    var data = {};
    Intake.FIELDS.forEach(function (k) {
      if (k === "track") {
        var c = form.querySelector('input[name="track"]:checked');
        data.track = c ? c.value : "";
      } else if (form.elements[k]) {
        data[k] = form.elements[k].value;
      }
    });
    return data;
  }

  function showErrors(errors) {
    var keys = Object.keys(errors);
    Intake.FIELDS.forEach(function (k) {
      var msg = document.getElementById("err-" + k);
      var inputs = k === "track" ? form.querySelectorAll('input[name="track"]') : [form.elements[k]];
      Array.prototype.forEach.call(inputs, function (el) {
        if (!el) return;
        if (errors[k]) el.setAttribute("aria-invalid", "true"); else el.removeAttribute("aria-invalid");
      });
      if (msg) { msg.textContent = errors[k] || ""; msg.hidden = !errors[k]; }
    });
    if (!keys.length) { summary.hidden = true; summary.innerHTML = ""; return; }
    summary.hidden = false;
    summary.innerHTML = "";
    var h = document.createElement("p");
    h.className = "error-title";
    h.textContent = keys.length === 1 ? "There is 1 thing to fix:" : "There are " + keys.length + " things to fix:";
    var ul = document.createElement("ul");
    keys.forEach(function (k) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#" + (k === "track" ? "track-it" : "f-" + k);
      a.textContent = errors[k];
      li.appendChild(a);
      ul.appendChild(li);
    });
    summary.appendChild(h);
    summary.appendChild(ul);
    summary.focus();
  }

  function ready() {
    var data = values();
    var errors = Intake.validate(data);
    showErrors(errors);
    if (Object.keys(errors).length) return null;
    preview.value = Intake.toText(data);
    previewBox.hidden = false;
    return data;
  }

  function say(msg) { status.textContent = msg; }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = ready();
    if (!data) { say(""); return; }
    say("Your email program should now open with your request filled in. Nothing has been sent yet: press Send there. If nothing opened, use “Copy request text” and email it to " + to + ".");
    window.location.href = Intake.toMailto(to, data);
  });

  document.getElementById("copy-request").addEventListener("click", function () {
    var data = ready();
    if (!data) { say(""); return; }
    var text = Intake.toText(data);
    function fallback() {
      preview.focus();
      preview.select();
      say("Your request text is selected below. Copy it (Ctrl+C or Cmd+C) and email it to " + to + ". Nothing has been sent.");
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        say("Request text copied. Paste it into an email to " + to + ". Nothing has been sent.");
      }, fallback);
    } else { fallback(); }
  });
})();
