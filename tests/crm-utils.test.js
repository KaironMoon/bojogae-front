import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  naverLinks,
  hasLocation,
  localDateTime,
} from "../src/pages/crm/crm-utils.js";
const location = { lat: 37.5, lng: 127, address: "테스트 주소" };
describe("CRM navigation", () => {
  it("rejects missing, nonfinite and out-of-service coordinates", () => {
    for (const c of [
      null,
      {},
      { lat: null, lng: 127 },
      { lat: NaN, lng: 127 },
      { lat: 90, lng: 0 },
    ]) {
      assert.ok(!hasLocation(c));
      assert.throws(() => naverLinks(c));
    }
  });
  it("passes destination and explicit origin for every supported mode", () => {
    for (const mode of ["car", "walk", "public"]) {
      const links = naverLinks(location, mode, { lat: 37.6, lng: 127.1 });
      const url = new URL(links.app);
      assert.equal(url.hostname, "route");
      assert.equal(url.pathname, `/${mode}`);
      assert.equal(url.searchParams.get("dlat"), "37.5");
      assert.equal(url.searchParams.get("slat"), "37.6");
      assert.equal(url.searchParams.get("appname"), "https://bojogae.net");
      assert.ok(links.android.startsWith("intent://route/"));
    }
  });
  it("does not send customer identity or contact information", () => {
    const links = naverLinks({
      ...location,
      name: "비공개 고객",
      phone: "01000000000",
    });
    assert.ok(!decodeURIComponent(links.app).includes("비공개 고객"));
    assert.ok(!links.app.includes("01000000000"));
    assert.ok(!new URL(links.app).searchParams.has("slat"));
  });
  it("uses Korean local time regardless of host timezone", () => {
    assert.equal(localDateTime("2026-10-23T16:00:00Z"), "2026-10-24T01:00");
  });
});


describe("NAVER SDK loading", () => {
  it("waits for script evaluation before reading the SDK namespace", async () => {
    let script;
    const oldWindow = globalThis.window;
    const oldDocument = globalThis.document;
    globalThis.window = {};
    globalThis.document = {
      createElement: () => ({ remove() {} }),
      head: { append(value) { script = value; } },
    };
    try {
      const { loadNaver } = await import("../src/pages/crm/crm-utils.js?loader-success");
      const first = loadNaver("test-key");
      assert.equal(loadNaver("test-key"), first);
      assert.ok(!script.src.includes("callback="));
      assert.equal(window.naver, undefined);
      const maps = { Map: class {} };
      window.naver = { maps };
      script.onload();
      assert.equal(await first, maps);
    } finally {
      globalThis.window = oldWindow;
      globalThis.document = oldDocument;
    }
  });
  it("rejects missing SDK and auth failures instead of leaving a pending loader", async () => {
    const oldWindow = globalThis.window;
    const oldDocument = globalThis.document;
    try {
      for (const kind of ["missing", "auth", "network"]) {
        let script;
        globalThis.window = {};
        globalThis.document = { createElement: () => ({ remove() {} }), head: { append(value) { script = value; } } };
        const { loadNaver } = await import(`../src/pages/crm/crm-utils.js?loader-${kind}`);
        const loading = loadNaver("test-key");
        if (kind === "auth") window.navermap_authFailure();
        else if (kind === "network") script.onerror();
        else script.onload();
        await assert.rejects(loading, /Web 서비스 URL/);
        assert.equal(loadNaver("test-key"), loading);
      }
    } finally {
      globalThis.window = oldWindow;
      globalThis.document = oldDocument;
    }
  });
});
