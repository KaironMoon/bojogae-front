import test from "node:test";
import assert from "node:assert/strict";
import { acceptsFile, fileAccept, missingInputGroup } from "../src/services/prompt-input-utils.js";

test("HTML field restrictions and default mixed uploads", () => {
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


test("image formats and mixed file chooser match server support", () => {
  assert.equal(fileAccept({ file_types: ["image"] }), ".jpg,.jpeg,.png,.webp");
  for (const name of ["scan.JPG", "scan.jpeg", "scan.png", "scan.webp"]) {
    assert.equal(acceptsFile({ file_types: ["image"] }, { name }), true);
    assert.equal(acceptsFile({ file_types: ["pdf"] }, { name }), false);
  }
  assert.equal(fileAccept({}), ".pdf,.jpg,.jpeg,.png,.webp,.html,.htm");
  for (const name of ["a.pdf", "a.jpg", "a.htm"]) assert.equal(acceptsFile({}, { name }), true);
  for (const name of ["a.svg", "a.gif", "a.exe"]) assert.equal(acceptsFile({}, { name }), false);
});
