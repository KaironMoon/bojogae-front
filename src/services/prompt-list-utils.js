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
