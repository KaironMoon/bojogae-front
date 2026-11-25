// Preserve edits made while the document request was in flight.
export function mergeContractDraft(current, baseline, draft, editing = false, sourceCustomer) {
  const next = { ...current };
  for (const [field, value] of Object.entries(draft)) {
    if (field === "parties" || (editing && field === "establishment_date")) continue;
    if (JSON.stringify(current[field]) === JSON.stringify(baseline[field])) next[field] = value;
  }
  if (draft.parties?.length && JSON.stringify(current.parties) === JSON.stringify(baseline.parties)) {
    const remaining = current.parties.map(person => person.customer_id === sourceCustomer?.customer_id && !person.name
      ? { ...person, ...sourceCustomer, role: person.role } : person);
    const people = draft.parties.map(person => {
      const index = remaining.findIndex(p => (p.role === person.role || p.customer_id)
        && ((!p.name && !p.customer_id) || p.name?.trim() === person.name?.trim()));
      const original = index < 0 ? {} : remaining.splice(index, 1)[0];
      return { ...original, ...person, customer_id: original.customer_id || null, same_as_holder: false, details_confirmed: true };
    });
    next.parties = [...remaining.filter(p => p.customer_id), ...people, ...remaining.filter(p => !p.customer_id && p.name)].slice(0, 20);
  }
  return next;
}

export function applyContractDraft(current, baseline, draft, editing, sourceCustomer, previous) {
  const restored = { ...current };
  const original = { ...baseline };
  if (previous) {
    for (const field of Object.keys(previous.after)) {
      if (JSON.stringify(previous.before[field]) === JSON.stringify(previous.after[field])) continue;
      if (JSON.stringify(restored[field]) === JSON.stringify(previous.after[field])) restored[field] = previous.before[field];
      if (JSON.stringify(original[field]) === JSON.stringify(previous.after[field])) original[field] = previous.before[field];
    }
  }
  return { before: restored, after: mergeContractDraft(restored, original, draft, editing, sourceCustomer) };
}
