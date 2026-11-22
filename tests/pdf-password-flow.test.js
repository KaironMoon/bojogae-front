import test from "node:test";
import assert from "node:assert/strict";
import { createPdfPasswordTracker } from "../src/services/pdf-password.js";

test("무암호 PDF 검사 중 제출해도 완료까지 대기한 뒤 경고 없이 통과한다", async () => {
  let calls = 0;
  let updates = 0;
  const tracker = createPdfPasswordTracker(async () => {
    calls += 1;
    await new Promise((resolve) => setTimeout(resolve, 50));
    return false;
  });

  const file = { name: "sample.pdf" };
  tracker.inspect(file, () => { updates += 1; });
  assert.equal(tracker.stateFor(file).checking, true);

  const resolved = await tracker.ensureChecked([file], () => { updates += 1; });
  assert.equal(calls, 1);
  assert.equal(resolved.get(file).checking, false);
  assert.equal(resolved.get(file).encrypted, false);
  assert.equal(resolved.get(file).error, undefined);
  assert.ok(updates >= 1);
});

test("첫 번째 PDF 검사 중 두 번째 파일을 추가해도 첫 번째 검사가 취소되거나 중복 실행되지 않는다", async () => {
  const inspected = [];
  const tracker = createPdfPasswordTracker(async (file) => {
    inspected.push(file.name);
    await new Promise((resolve) => setTimeout(resolve, 40));
    return false;
  });

  const first = { name: "first.pdf" };
  const second = { name: "second.pdf" };
  tracker.inspect(first);
  tracker.inspect(first);
  tracker.inspect(second);

  const states = await tracker.ensureChecked([first, second]);
  assert.deepEqual(inspected, ["first.pdf", "second.pdf"]);
  assert.equal(states.get(first).encrypted, false);
  assert.equal(states.get(second).encrypted, false);
});

test("암호화된 PDF는 encrypted=true와 입력한 비밀번호를 유지한다", async () => {
  const tracker = createPdfPasswordTracker(async () => true);
  const secretPdf = { name: "locked.pdf" };
  const states = await tracker.ensureChecked([secretPdf]);
  assert.equal(states.get(secretPdf).encrypted, true);

  tracker.setPassword(secretPdf, "1234");
  const after = await tracker.ensureChecked([secretPdf]);
  assert.equal(after.get(secretPdf).encrypted, true);
  assert.equal(after.get(secretPdf).password, "1234");
});
