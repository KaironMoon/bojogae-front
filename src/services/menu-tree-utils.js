export const BADGE_TONES = [
  { key: "green", label: "초록" },
  { key: "rose", label: "빨강" },
  { key: "purple", label: "보라" },
  { key: "blue", label: "파랑" },
  { key: "amber", label: "주황" },
  { key: "slate", label: "회색" },
];

const VALID_BADGE_TONES = new Set(BADGE_TONES.map((t) => t.key));

export const BADGE_PRESETS = [
  { text: "NEW", tone: "green" },
  { text: "HOT", tone: "rose" },
  { text: "BETA", tone: "purple" },
  { text: "UP", tone: "blue" },
  { text: "PRO", tone: "amber" },
  { text: "추천", tone: "blue" },
];

export const CUSTOM_GROUP_KEY_RE = /^custom_group_[a-z0-9_]{4,32}$/;

export function isCustomGroupKey(key) {
  return typeof key === "string" && CUSTOM_GROUP_KEY_RE.test(key);
}

export function createCustomGroupKey() {
  const rand = Math.random().toString(36).slice(2, 8);
  const stamp = Date.now().toString(36).slice(-4);
  return `custom_group_${stamp}${rand}`.slice(0, 32);
}

export function normalizeMenuBadge(rawBadge) {
  if (!rawBadge || typeof rawBadge !== "object") return null;
  const text = typeof rawBadge.text === "string" ? rawBadge.text.trim().slice(0, 10) : "";
  if (!text) return null;
  const tone = VALID_BADGE_TONES.has(rawBadge.tone) ? rawBadge.tone : "green";
  return { text, tone };
}

export function createMenuEngine(defaultItems) {
  const defaultByKey = Object.fromEntries(defaultItems.map((item) => [item.key, item]));

  const buildLeafCatalog = () => {
    const map = {};
    for (const spec of defaultItems) {
      if (spec.kind !== "group") {
        map[spec.key] = { ...spec, default_parent_key: null };
        continue;
      }
      for (const child of spec.children || []) {
        map[child.key] = {
          key: child.key,
          label: child.default_label,
          default_label: child.default_label,
          kind: "item",
          path: child.path,
          prefix: null,
          icon_key: child.icon_key || spec.icon_key,
          tone: child.tone || spec.tone,
          audience: child.audience || "ALL",
          visible: true,
          badge: child.badge ?? null,
          default_parent_key: spec.key,
        };
      }
    }
    return map;
  };

  const leafByKey = buildLeafCatalog();

  function cloneChild(spec, savedChild) {
    const rawLabel = typeof savedChild?.label === "string" ? savedChild.label.trim() : "";
    return {
      key: spec.key,
      label: (rawLabel || spec.default_label).slice(0, 40),
      default_label: spec.default_label,
      path: spec.path,
      audience: spec.audience || "ALL",
      visible: typeof savedChild?.visible === "boolean" ? savedChild.visible : true,
      badge: normalizeMenuBadge(savedChild?.badge ?? spec.badge),
    };
  }

  function cloneCustomGroup(key, savedItem, seen) {
    const rawLabel = typeof savedItem?.label === "string" ? savedItem.label.trim() : "";
    const children = [];
    if (Array.isArray(savedItem?.children)) {
      for (const rawChild of savedItem.children) {
        const childKey = rawChild?.key;
        const childSpec = childKey ? leafByKey[childKey] : null;
        if (!childSpec || (seen && seen.has(childKey))) continue;
        if (seen) seen.add(childKey);
        children.push(cloneChild(childSpec, rawChild));
      }
    }
    if (!children.length) return null;
    return {
      key,
      label: (rawLabel || "새 그룹").slice(0, 40),
      default_label: "사용자 그룹",
      kind: "group",
      is_custom_group: true,
      path: null,
      prefix: `custom:${key}`,
      icon_key: typeof savedItem?.icon_key === "string" && savedItem.icon_key ? savedItem.icon_key : "folder",
      tone: typeof savedItem?.tone === "string" && savedItem.tone ? savedItem.tone : "slate",
      audience: "ALL",
      visible: typeof savedItem?.visible === "boolean" ? savedItem.visible : true,
      badge: normalizeMenuBadge(savedItem?.badge),
      children,
    };
  }

  function cloneItem(spec, savedItem, seen = null) {
    const rawLabel = typeof savedItem?.label === "string" ? savedItem.label.trim() : "";
    const children = [];
    if (Array.isArray(savedItem?.children)) {
      for (const rawChild of savedItem.children) {
        const childKey = rawChild?.key;
        const childSpec = childKey ? leafByKey[childKey] : null;
        if (!childSpec || (seen && seen.has(childKey))) continue;
        if (seen) seen.add(childKey);
        children.push(cloneChild(childSpec, rawChild));
      }
    }
    return {
      key: spec.key,
      label: (rawLabel || spec.default_label).slice(0, 40),
      default_label: spec.default_label,
      kind: spec.kind,
      is_custom_group: false,
      path: spec.path,
      prefix: spec.prefix || null,
      icon_key: spec.icon_key,
      tone: spec.tone,
      audience: spec.audience || "ALL",
      visible: typeof savedItem?.visible === "boolean" ? savedItem.visible : true,
      badge: normalizeMenuBadge(savedItem?.badge ?? spec.badge),
      children,
    };
  }

  function mergeMenuConfig(savedItems) {
    const merged = [];
    const seen = new Set();
    const groupByKey = {};

    if (Array.isArray(savedItems)) {
      for (const savedItem of savedItems) {
        const key = savedItem?.key;
        if (!key || seen.has(key)) continue;

        if (isCustomGroupKey(key)) {
          seen.add(key);
          const customGroup = cloneCustomGroup(key, savedItem, seen);
          if (customGroup) merged.push(customGroup);
          continue;
        }

        const spec = defaultByKey[key] || leafByKey[key];
        if (!spec) continue;
        seen.add(key);
        const cloned = cloneItem(spec, savedItem, seen);
        merged.push(cloned);
        if (cloned.kind === "group") {
          groupByKey[cloned.key] = cloned;
        }
      }
    }

    for (const spec of defaultItems) {
      if (!seen.has(spec.key)) {
        seen.add(spec.key);
        const cloned = cloneItem(spec, null, seen);
        merged.push(cloned);
        if (cloned.kind === "group") {
          groupByKey[cloned.key] = cloned;
        }
      }
    }

    for (const spec of defaultItems) {
      if (spec.kind !== "group") continue;
      const groupEntry = groupByKey[spec.key];
      for (const childSpec of spec.children || []) {
        if (!seen.has(childSpec.key)) {
          seen.add(childSpec.key);
          groupEntry.children.push(cloneChild(leafByKey[childSpec.key], null));
        }
      }
    }

    return merged;
  }

  function toTopLevelNode(node) {
    if (node.kind === "group" || isCustomGroupKey(node.key)) return node;
    const spec = defaultByKey[node.key] || leafByKey[node.key];
    if (!spec || spec.kind === "group") return node;
    return {
      ...spec,
      label: node.label,
      visible: Boolean(node.visible),
      badge: normalizeMenuBadge(node.badge),
      children: Array.isArray(node.children) ? node.children : [],
    };
  }

  function toChildNode(node) {
    const spec = leafByKey[node.key];
    if (!spec) return null;
    return cloneChild(spec, {
      label: node.label,
      visible: node.visible,
      badge: node.badge,
    });
  }

  function toMenuPayload(items) {
    return (items || []).map((item) => {
      const label = typeof item.label === "string" && item.label.trim() ? item.label.trim() : item.default_label;
      const entry = {
        key: item.key,
        label: label.slice(0, 40),
        visible: Boolean(item.visible),
        badge: normalizeMenuBadge(item.badge),
      };
      if (item.is_custom_group || isCustomGroupKey(item.key)) {
        entry.is_custom_group = true;
        entry.icon_key = item.icon_key || "folder";
        entry.tone = item.tone || "slate";
      }
      if (item.kind === "group" || (item.children && item.children.length > 0)) {
        entry.children = (item.children || []).map((child) => {
          const childLabel = typeof child.label === "string" && child.label.trim()
            ? child.label.trim()
            : child.default_label;
          return {
            key: child.key,
            label: childLabel.slice(0, 40),
            visible: Boolean(child.visible),
            badge: normalizeMenuBadge(child.badge),
          };
        });
      }
      return entry;
    });
  }

  function pruneEmptyCustomGroups(list) {
    return list.filter((entry) => !(entry.is_custom_group && (!entry.children || entry.children.length === 0)));
  }

  function moveMenuNodeWithMeta(items, dragSource, dropTarget) {
    if (!Array.isArray(items) || !dragSource?.key || !dropTarget) {
      return { items, createdGroupKey: null };
    }

    const next = items.map((item) => ({
      ...item,
      children: [...(item.children || [])],
    }));

    if (dropTarget.kind === "merge-create-group") {
      const targetKey = dropTarget.targetKey;
      if (!targetKey || targetKey === dragSource.key) {
        return { items, createdGroupKey: null };
      }
      const targetIndexBefore = next.findIndex((item) => item.key === targetKey);
      if (targetIndexBefore < 0) return { items, createdGroupKey: null };
      const targetItem = next[targetIndexBefore];
      const targetHasChildren = (targetItem.children || []).length > 0;
      if (targetItem.kind === "group" || targetHasChildren || !leafByKey[targetItem.key]) {
        return { items, createdGroupKey: null };
      }

      let movedNode = null;
      if (dragSource.scope === "top") {
        const sIdx = next.findIndex((item) => item.key === dragSource.key);
        if (sIdx < 0) return { items, createdGroupKey: null };
        const candidate = next[sIdx];
        if (candidate.kind === "group" || (candidate.children || []).length > 0 || !leafByKey[candidate.key]) {
          return { items, createdGroupKey: null };
        }
        [movedNode] = next.splice(sIdx, 1);
      } else if (dragSource.scope === "child") {
        const parentGroup = next.find((item) => item.key === dragSource.groupKey);
        if (!parentGroup) return { items, createdGroupKey: null };
        const cIdx = parentGroup.children.findIndex((c) => c.key === dragSource.key);
        if (cIdx < 0) return { items, createdGroupKey: null };
        [movedNode] = parentGroup.children.splice(cIdx, 1);
      } else {
        return { items, createdGroupKey: null };
      }

      const targetChild = toChildNode(targetItem);
      const movedChild = toChildNode(movedNode);
      if (!targetChild || !movedChild) return { items, createdGroupKey: null };

      const targetIndexAfter = next.findIndex((item) => item.key === targetKey);
      if (targetIndexAfter < 0) return { items, createdGroupKey: null };

      const newGroupKey = createCustomGroupKey();
      const baseLabel = (dropTarget.label && String(dropTarget.label).trim())
        || `${targetItem.label} · ${movedNode.label}`.slice(0, 40);
      const newGroup = {
        key: newGroupKey,
        label: baseLabel.slice(0, 40),
        default_label: "사용자 그룹",
        kind: "group",
        is_custom_group: true,
        path: null,
        prefix: `custom:${newGroupKey}`,
        icon_key: targetItem.icon_key && targetItem.icon_key !== "auto_awesome" ? targetItem.icon_key : "folder",
        tone: targetItem.tone || "slate",
        audience: "ALL",
        visible: true,
        badge: null,
        children: [targetChild, movedChild],
      };

      next.splice(targetIndexAfter, 1, newGroup);
      return { items: pruneEmptyCustomGroups(next), createdGroupKey: newGroupKey };
    }

    let movedNode = null;
    if (dragSource.scope === "top") {
      const sourceIndex = next.findIndex((item) => item.key === dragSource.key);
      if (sourceIndex < 0) return { items, createdGroupKey: null };
      movedNode = next[sourceIndex];
      const hasOwnChildren = (movedNode.children || []).length > 0;
      if ((movedNode.kind === "group" || hasOwnChildren) && dropTarget.kind !== "top") {
        return { items, createdGroupKey: null };
      }
      if (dropTarget.kind === "top" && dropTarget.key === dragSource.key) {
        return { items, createdGroupKey: null };
      }
      if (dropTarget.kind !== "top" && !leafByKey[movedNode.key]) {
        return { items, createdGroupKey: null };
      }
      next.splice(sourceIndex, 1);
    } else if (dragSource.scope === "child") {
      const parentGroup = next.find((item) => item.key === dragSource.groupKey);
      if (!parentGroup) return { items, createdGroupKey: null };
      const childIndex = parentGroup.children.findIndex((c) => c.key === dragSource.key);
      if (childIndex < 0) return { items, createdGroupKey: null };
      if (dropTarget.kind === "child" && dropTarget.groupKey === dragSource.groupKey && dropTarget.key === dragSource.key) {
        return { items, createdGroupKey: null };
      }
      if (dropTarget.kind === "group-inside" && dropTarget.groupKey === dragSource.groupKey) {
        return { items, createdGroupKey: null };
      }
      [movedNode] = parentGroup.children.splice(childIndex, 1);
    } else {
      return { items, createdGroupKey: null };
    }

    if (dropTarget.kind === "top") {
      let targetIndex = next.findIndex((item) => item.key === dropTarget.key);
      if (targetIndex < 0) {
        return { items: [...pruneEmptyCustomGroups(next), toTopLevelNode(movedNode)], createdGroupKey: null };
      }
      const insertIndex = dropTarget.position === "after" ? targetIndex + 1 : targetIndex;
      next.splice(insertIndex, 0, toTopLevelNode(movedNode));
      return { items: pruneEmptyCustomGroups(next), createdGroupKey: null };
    }

    if (dropTarget.kind === "group-inside") {
      const targetGroup = next.find((item) => item.key === dropTarget.groupKey);
      const childNode = toChildNode(movedNode);
      if (!targetGroup || !childNode) return { items, createdGroupKey: null };
      targetGroup.children = targetGroup.children || [];
      targetGroup.children.push(childNode);
      return { items: pruneEmptyCustomGroups(next), createdGroupKey: null };
    }

    if (dropTarget.kind === "child") {
      const targetGroup = next.find((item) => item.key === dropTarget.groupKey);
      const childNode = toChildNode(movedNode);
      if (!targetGroup || !childNode) return { items, createdGroupKey: null };
      targetGroup.children = targetGroup.children || [];
      const targetChildIndex = targetGroup.children.findIndex((c) => c.key === dropTarget.key);
      if (targetChildIndex < 0) return { items, createdGroupKey: null };
      const insertIndex = dropTarget.position === "after" ? targetChildIndex + 1 : targetChildIndex;
      targetGroup.children.splice(insertIndex, 0, childNode);
      return { items: pruneEmptyCustomGroups(next), createdGroupKey: null };
    }

    return { items, createdGroupKey: null };
  }

  function moveMenuNode(items, dragSource, dropTarget) {
    return moveMenuNodeWithMeta(items, dragSource, dropTarget).items;
  }

  function mergeMenusIntoGroup(items, sourceKey, targetKey, customLabel) {
    return moveMenuNodeWithMeta(
      items,
      { scope: "top", key: sourceKey },
      { kind: "merge-create-group", targetKey, label: customLabel },
    );
  }

  function dissolveCustomGroup(items, groupKey) {
    if (!Array.isArray(items)) return items;
    const idx = items.findIndex((item) => item.key === groupKey);
    if (idx < 0) return items;
    const group = items[idx];
    const promoted = (group.children || []).map((child) => toTopLevelNode(child));
    const next = [...items];
    next.splice(idx, 1, ...promoted);
    return next;
  }

  function promoteChildToTop(items, groupKey, childKey) {
    return moveMenuNode(
      items,
      { scope: "child", groupKey, key: childKey },
      { kind: "top", key: groupKey, position: "after" },
    );
  }

  function hasMenuChanges(currentItems, baselineItems) {
    return JSON.stringify(toMenuPayload(currentItems)) !== JSON.stringify(toMenuPayload(baselineItems));
  }

  return {
    DEFAULT_ITEMS: defaultItems,
    DEFAULT_BY_KEY: defaultByKey,
    LEAF_BY_KEY: leafByKey,
    mergeMenuConfig,
    toMenuPayload,
    moveMenuNode,
    moveMenuNodeWithMeta,
    mergeMenusIntoGroup,
    dissolveCustomGroup,
    promoteChildToTop,
    hasMenuChanges,
  };
}

export function moveItemByOffset(list, index, delta) {
  if (!Array.isArray(list)) return list;
  const targetIndex = index + delta;
  if (index < 0 || index >= list.length || targetIndex < 0 || targetIndex >= list.length) {
    return list;
  }
  const next = [...list];
  const [moved] = next.splice(index, 1);
  next.splice(targetIndex, 0, moved);
  return next;
}

export function moveItemByDrop(list, draggedKey, targetKey, position = "before") {
  if (!Array.isArray(list) || !draggedKey || !targetKey || draggedKey === targetKey) {
    return list;
  }
  const fromIndex = list.findIndex((item) => item.key === draggedKey);
  if (fromIndex < 0) return list;
  const next = [...list];
  const [moved] = next.splice(fromIndex, 1);
  const targetIndex = next.findIndex((item) => item.key === targetKey);
  if (targetIndex < 0) return list;
  const insertIndex = position === "after" ? targetIndex + 1 : targetIndex;
  next.splice(insertIndex, 0, moved);
  return next;
}
