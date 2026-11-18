import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { saveBlob, downloadFile } from "../src/lib/download.ts";
import { readBooleanCookie } from "../src/lib/browser-preferences.ts";

test("sidebar persistence reads only valid values and preserves fallback", () => {
  assert.equal(
    readBooleanCookie(
      "sidebar_state",
      true,
      "other=false; sidebar_state=false",
    ),
    false,
  );
  assert.equal(
    readBooleanCookie(
      "sidebar_state",
      false,
      "sidebar_state=true; other=false",
    ),
    true,
  );
  assert.equal(
    readBooleanCookie("sidebar_state", true, "not_sidebar_state=false"),
    true,
  );
  assert.equal(
    readBooleanCookie("sidebar_state", false, "sidebar_state=invalid"),
    false,
  );
  assert.equal(readBooleanCookie("sidebar_state", true, ""), true);
});

test("blocked cookies and server rendering retain the sidebar fallback", (t) => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    get() {
      throw new Error("Cookie access blocked");
    },
  });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, "document", original);
    else delete globalThis.document;
  });
  assert.equal(readBooleanCookie("sidebar_state", false), false);
});

function mockDownloadBrowser(t, fail = false) {
  const events = [];
  const timers = [];
  const original = Object.getOwnPropertyDescriptor(globalThis, "document");
  const anchor = {
    href: "",
    download: "",
    click() {
      events.push("click");
      if (fail) throw new Error("Blocked download");
    },
    remove() {
      events.push("remove");
    },
  };
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      createElement(tag) {
        assert.equal(tag, "a");
        return anchor;
      },
      body: {
        appendChild(element) {
          assert.equal(element, anchor);
          events.push("append");
        },
      },
    },
  });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, "document", original);
    else delete globalThis.document;
  });
  t.mock.method(URL, "createObjectURL", () => "blob:test-file");
  t.mock.method(URL, "revokeObjectURL", (url) => {
    assert.equal(url, "blob:test-file");
    events.push("revoke");
  });
  t.mock.method(globalThis, "setTimeout", (fn, delay) => {
    assert.equal(delay, 1000);
    timers.push(fn);
    return 1;
  });
  return { events, timers, anchor };
}

test("downloads remove their temporary anchor and release the object URL", (t) => {
  const { events, timers, anchor } = mockDownloadBrowser(t);
  saveBlob(
    new Blob(["private document"], { type: "application/pdf" }),
    "original.pdf",
  );
  assert.equal(anchor.download, "original.pdf");
  assert.deepEqual(events, ["append", "click", "remove"]);
  assert.equal(timers.length, 1);
  timers[0]();
  assert.deepEqual(events, ["append", "click", "remove", "revoke"]);
});

test("failed download clicks still release the URL and temporary element", (t) => {
  const { events, timers } = mockDownloadBrowser(t, true);
  assert.throws(
    () => saveBlob(new Blob(["private document"]), "file.pdf"),
    /Blocked download/,
  );
  assert.deepEqual(events, ["append", "click", "revoke", "remove"]);
  assert.equal(timers.length, 0);
});

test("an already cancelled download never calls its request", async () => {
  const controller = new AbortController();
  controller.abort();
  let requested = false;
  await assert.rejects(
    downloadFile(async () => {
      requested = true;
      return { blob: new Blob(), name: "cv.pdf" };
    }, controller.signal),
    { name: "AbortError" },
  );
  assert.equal(requested, false);
});

test("leaving before the response finishes prevents saving the file", async (t) => {
  const { events } = mockDownloadBrowser(t);
  const controller = new AbortController();
  let finish;
  const pending = new Promise((resolve) => {
    finish = resolve;
  });
  const result = downloadFile(() => pending, controller.signal);
  controller.abort();
  finish({ blob: new Blob(["private document"]), name: "cv.pdf" });
  await assert.rejects(result, { name: "AbortError" });
  assert.deepEqual(events, []);
});

test("print visibility selectors only apply when their export page is rendered", () => {
  for (const [file, scope] of [
    [
      "employees/employee-record-page.css",
      ".page-employees-employee-record-page",
    ],
    [
      "recruitment/offer-generation-page.css",
      ".page-recruitment-offer-generation-page",
    ],
  ]) {
    const css = readFileSync(
      new URL("../src/pages/" + file, import.meta.url),
      "utf8",
    );
    const rules = css.slice(css.indexOf("@media print"));
    assert.ok(!rules.includes("body * {"));
    const bodyRules = rules.match(/body[^{}]*\{/g) || [];
    assert.ok(bodyRules.length > 0);
    for (const selector of bodyRules)
      assert.ok(
        selector.replace(/\s+/g, "").includes("body:has(" + scope),
        selector,
      );
  }
});
