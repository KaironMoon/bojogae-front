import test from "node:test";
import assert from "node:assert/strict";
import { acceptsFile, fileAccept, missingInputGroup } from "../src/services/prompt-input-utils.js";

test("HTML field accepts html/htm only, legacy defaults to PDF", () => {
  assert.equal(fileAccept({ file_types: ["html"] }), ".html,.htm");
  assert.equal(acceptsFile({ file_types: ["html"] }, { name: "report.HTM" }), true);
  assert.equal(acceptsFile({ file_types: ["html"] }, { name: "report.pdf" }), false);
  assert.equal(acceptsFile({}, { name: "report.pdf" }), true);
});

test("one-of group accepts PDF or nonblank text", () => {
  const fields = [
    { key: "pdf", label: "PDF", type: "file", required_group: "source" },
    { key: "text", label: "내용", type: "text", required_group: "source" },
  ];
  assert.notEqual(missingInputGroup(fields, { text: " " }, {}), "");
  assert.equal(missingInputGroup(fields, { text: "자료" }, {}), "");
  assert.equal(missingInputGroup(fields, {}, { pdf: [{}] }), "");
});
