export function defaultPromptTab(options) {
  return options.some((option) => option.is_favorite) ? "favorites" : "recommended";
}

export function promptsForTab(options, tab) {
  return tab === "favorites" ? options.filter((option) => option.is_favorite) : options;
}

export function filterPromptCategories(options, categoryIds) {
  return options.filter((option) => categoryIds.every((id) =>
    (option.categories || []).some((category) => category.id === id)));
}

export function selectSingleCategory(currentCategoryId, nextCategoryId) {
  if (nextCategoryId == null) return null;
  return currentCategoryId === nextCategoryId ? null : nextCategoryId;
}

export function categoryIdsFromSingle(selectedCategoryId) {
  return selectedCategoryId == null ? [] : [selectedCategoryId];
}

function compareAdminCategories(left, right) {
  const leftOrder = Number.isFinite(Number(left.sort_order))
    ? Number(left.sort_order)
    : Number.MAX_SAFE_INTEGER;
  const rightOrder = Number.isFinite(Number(right.sort_order))
    ? Number(right.sort_order)
    : Number.MAX_SAFE_INTEGER;
  return leftOrder - rightOrder
    || (left.name || "").localeCompare(right.name || "", "ko-KR")
    || left.id - right.id;
}

/**
 * Group admin prompts under sorted parent/child categories, omitting empty categories
 * and collecting prompts that do not belong to any configured child category.
 */
export function buildAdminCategoryGroups(prompts = [], categories = []) {
  const assignedIds = new Set();
  const groups = [...categories]
    .sort(compareAdminCategories)
    .map((root) => {
      const children = [...(root.children || [])]
        .sort(compareAdminCategories)
        .map((child) => {
          const items = prompts.filter((prompt) =>
            (prompt.categories || []).some((category) => category.id === child.id),
          );
          items.forEach((prompt) => assignedIds.add(prompt.id));
          return { ...child, count: items.length };
        })
        .filter((child) => child.count > 0);
      return { ...root, children };
    })
    .filter((root) => root.children.length > 0);

  const unassigned = prompts.filter((prompt) => !assignedIds.has(prompt.id));
  return { groups, unassigned };
}

/**
 * Filter admin prompts by selected child category ID (or "unassigned") and search keyword.
 */
export function filterAdminPrompts(prompts = [], categories = [], selectedCategoryId = null, searchQuery = "") {
  let filtered = prompts;
  if (selectedCategoryId === "unassigned") {
    const childIds = new Set(
      categories.flatMap((root) => (root.children || []).map((child) => child.id)),
    );
    filtered = prompts.filter(
      (prompt) => !(prompt.categories || []).some((category) => childIds.has(category.id)),
    );
  } else if (selectedCategoryId != null) {
    filtered = prompts.filter((prompt) =>
      (prompt.categories || []).some((category) => category.id === selectedCategoryId),
    );
  }

  const keyword = searchQuery.trim().toLocaleLowerCase("ko-KR");
  if (!keyword) return filtered;

  return filtered.filter((prompt) =>
    [
      prompt.title,
      prompt.description,
      prompt.report_folder,
      ...(prompt.categories || []).flatMap((category) => [category.name, category.parent_name]),
    ].some((text) => text?.toLocaleLowerCase("ko-KR").includes(keyword)),
  );
}
