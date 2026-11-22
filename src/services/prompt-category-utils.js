function compareCategories(left, right) {
  const leftOrder = Number.isFinite(Number(left.sort_order))
    ? Number(left.sort_order)
    : Number.MAX_SAFE_INTEGER;
  const rightOrder = Number.isFinite(Number(right.sort_order))
    ? Number(right.sort_order)
    : Number.MAX_SAFE_INTEGER;
  return leftOrder - rightOrder
    || left.name.localeCompare(right.name, "ko-KR")
    || left.id - right.id;
}

export function groupPromptCategories(promptOptions) {
  const groups = new Map();
  promptOptions.forEach((option) => {
    (option.categories || []).forEach((category) => {
      if (!groups.has(category.parent_id)) {
        groups.set(category.parent_id, {
          id: category.parent_id,
          name: category.parent_name,
          sort_order: category.parent_sort_order,
          children: new Map(),
        });
      }
      groups.get(category.parent_id).children.set(category.id, category);
    });
  });

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      children: Array.from(group.children.values()).sort(compareCategories),
    }))
    .sort(compareCategories);
}

export function isCompactCategoryGroup(group) {
  const children = group?.children || [];
  if (!children.length) return true;
  const maxLen = Math.max(...children.map((child) => (child.name || "").length));
  if (children.length <= 2) return maxLen <= 12;
  if (children.length === 3) {
    const totalLen = children.reduce((sum, child) => sum + (child.name || "").length, 0);
    return maxLen <= 6 && totalLen <= 14;
  }
  return false;
}
