import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeContractDraft, applyContractDraft } from "../src/pages/crm/contract-document-draft.js";

const initial = { insurer: "", product: "", premium: null, establishment_date: "2026-11-21",
  parties: [{ role: "HOLDER", customer_id: 31, name: "고객" }] };

test("fills mapped fields while preserving edits made during the request", () => {
  const result = mergeContractDraft({ ...initial, insurer: "직접 수정" }, initial,
    { insurer: "문서 보험사", product: "상품", premium: "12345" });
  assert.equal(result.insurer, "직접 수정");
  assert.equal(result.product, "상품");
  assert.equal(result.premium, "12345");
});

test("keeps the linked customer's ID when importing matching people", () => {
  const result = mergeContractDraft(initial, initial,
    { parties: [{ role: "HOLDER", name: "고객", phone: "01012345678" }, { role: "INSURED", name: "가족" }] });
  assert.equal(result.parties[0].customer_id, 31);
  assert.equal(result.parties[0].phone, "01012345678");
  assert.equal(result.parties[1].customer_id, null);
});

test("does not attach another person's name to a linked customer, even before CRM loads", () => {
  const baseline = { ...initial, parties: [{ role: "HOLDER", customer_id: 31, name: "" }] };
  const result = mergeContractDraft(baseline, baseline, { parties: [{ role: "HOLDER", name: "다른 계약자" }] }, false,
    { customer_id: 31, name: "실제 고객", details_confirmed: true });
  assert.equal(result.parties.find(p => p.customer_id === 31).name, "실제 고객");
  assert.equal(result.parties.find(p => p.name === "다른 계약자").customer_id, null);
});

test("uses the insured role for a matching linked customer in the report", () => {
  const result = mergeContractDraft(initial, initial, { parties: [{ role: "HOLDER", name: "가족" }, { role: "INSURED", name: "고객" }] });
  assert.equal(result.parties.find(p => p.customer_id === 31).role, "INSURED");
});

test("keeps manual party edits and established dates on existing contracts", () => {
  const edited = { ...initial, parties: [{ role: "HOLDER", customer_id: 31, name: "수정한 이름" }] };
  const result = mergeContractDraft(edited, initial,
    { establishment_date: "2000-01-01", parties: [{ role: "HOLDER", name: "고객" }] }, true);
  assert.deepEqual(result.parties, edited.parties);
  assert.equal(result.establishment_date, initial.establishment_date);
});

test("switching products clears values from the previous product without mixing premiums", () => {
  const first = applyContractDraft(initial, initial, { product: "A", premium: "10000" });
  const second = applyContractDraft(first.after, first.after, { product: "B" }, false, null, first);
  assert.equal(second.after.product, "B");
  assert.equal(second.after.premium, null);
  const third = applyContractDraft(second.after, second.after, { product: "C" }, false, null, second);
  assert.equal(third.after.premium, null);
});

test("switching products retains a manually corrected value missing in the new product", () => {
  const first = applyContractDraft(initial, initial, { product: "A", premium: "10000" });
  const edited = { ...first.after, premium: "12000" };
  const second = applyContractDraft(edited, edited, { product: "B" }, false, null, first);
  assert.equal(second.after.premium, "12000");
});
