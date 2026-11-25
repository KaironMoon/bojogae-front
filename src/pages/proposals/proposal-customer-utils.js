export function formatCustomerOptionLabel(customer) {
  if (!customer) return "";
  const namePart = customer.alias
    ? `${customer.name} (${customer.alias})`
    : (customer.name || `고객 #${customer.id}`);
  const subPart = customer.phone || customer.location?.address || "";
  return subPart ? `${namePart} · ${subPart}` : namePart;
}

export function formatCustomerShortName(customer) {
  if (!customer) return "";
  return customer.alias
    ? `${customer.name} (${customer.alias})`
    : (customer.name || "");
}

export function mergeCustomerOptions(items = [], selectedCustomer = null) {
  const list = Array.isArray(items) ? items : [];
  const seen = new Set();
  const result = [];
  for (const item of list) {
    if (!item?.id || seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  if (selectedCustomer?.id && !seen.has(selectedCustomer.id)) {
    result.unshift(selectedCustomer);
  }
  return result;
}
