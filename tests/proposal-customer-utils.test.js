import test from "node:test";
import assert from "node:assert/strict";
import {
  formatCustomerOptionLabel,
  formatCustomerShortName,
  mergeCustomerOptions,
} from "../src/pages/proposals/proposal-customer-utils.js";

test("formatCustomerOptionLabel formats name, alias, and contact/address", () => {
  assert.equal(formatCustomerOptionLabel(null), "");
  assert.equal(
    formatCustomerOptionLabel({ id: 7, name: "홍길동", alias: "길동", phone: "010-1234-5678" }),
    "홍길동 (길동) · 010-1234-5678",
  );
  assert.equal(
    formatCustomerOptionLabel({ id: 8, name: "김영희", location: { address: "서울 강남구" } }),
    "김영희 · 서울 강남구",
  );
  assert.equal(
    formatCustomerOptionLabel({ id: 9 }),
    "고객 #9",
  );
});

test("formatCustomerShortName handles alias and missing customer", () => {
  assert.equal(formatCustomerShortName(null), "");
  assert.equal(formatCustomerShortName({ name: "이순신" }), "이순신");
  assert.equal(formatCustomerShortName({ name: "이순신", alias: "VIP" }), "이순신 (VIP)");
});

test("mergeCustomerOptions deduplicates and preserves selectedCustomer", () => {
  const selected = { id: 99, name: "박보검" };
  const merged = mergeCustomerOptions(
    [
      { id: 1, name: "김철수" },
      { id: 1, name: "김철수 중복" },
      { id: 2, name: "이영희" },
    ],
    selected,
  );
  assert.deepEqual(merged.map((item) => item.id), [99, 1, 2]);

  // Does not override a full loaded option with a placeholder selectedCustomer of same id
  const alreadyLoaded = mergeCustomerOptions(
    [{ id: 99, name: "박보검", phone: "010-9999-8888" }],
    { id: 99, name: "고객 #99" },
  );
  assert.equal(alreadyLoaded.length, 1);
  assert.equal(alreadyLoaded[0].name, "박보검");
});
