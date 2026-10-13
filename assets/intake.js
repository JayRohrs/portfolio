// Builds the "Start a project" request text, JSON shape and mailto link.
// Pure functions: nothing here contacts any server. Loaded by the browser as a
// classic script and imported by scripts/check.mjs for testing.
(function (root) {
  "use strict";

  var TRACKS = { it: "IT & Systems", av: "AV & Media Production", both: "Both IT and AV", "not-sure": "Not sure yet" };
  var FIELDS = ["name", "organisation", "email", "phone", "track", "need", "timeline", "budget", "heard_from"];

  function clean(v) {
    return String(v == null ? "" : v).replace(/\r\n?/g, "\n").trim();
  }

  // Small, stable JSON shape (see docs/ORDER_INTAKE.md).
  function toJSON(raw, now) {
    var r = { version: 1 };
    FIELDS.forEach(function (k) { r[k] = clean(raw[k]); });
    r.created = (now || new Date()).toISOString();
    return r;
  }

  function validate(raw) {
    var errors = {};
    var r = {};
    FIELDS.forEach(function (k) { r[k] = clean(raw[k]); });
    if (!r.name) errors.name = "Please enter your name.";
    if (!r.email) errors.email = "Please enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) errors.email = "That email address does not look right. It should look like name@example.com.";
    if (!TRACKS[r.track]) errors.track = "Please choose which kind of help you need.";
    if (!r.need) errors.need = "Please tell me a little about what you need.";
    return errors;
  }

  function toText(raw) {
    var r = toJSON(raw);
    var lines = [
      "Project request for Jay Rohrs",
      "",
      "Name: " + r.name,
      "Organisation: " + (r.organisation || "(not given)"),
      "Email: " + r.email,
      "Phone: " + (r.phone || "(not given)"),
      "Kind of help: " + (TRACKS[r.track] || r.track),
      "Timeline: " + (r.timeline || "(not given)"),
      "Budget range: " + (r.budget || "(not given)"),
      "How I heard about you: " + (r.heard_from || "(not given)"),
      "",
      "What I need:",
      r.need
    ];
    return lines.join("\n");
  }

  function subject(raw) {
    var r = toJSON(raw);
    return "Project request: " + (TRACKS[r.track] || "General") + " (" + r.name + ")";
  }

  function toMailto(to, raw) {
    return "mailto:" + to + "?subject=" + encodeURIComponent(subject(raw)) +
      "&body=" + encodeURIComponent(toText(raw)).replace(/%0A/g, "%0D%0A");
  }

  var api = { TRACKS: TRACKS, FIELDS: FIELDS, toJSON: toJSON, validate: validate, toText: toText, subject: subject, toMailto: toMailto };
  root.Intake = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
