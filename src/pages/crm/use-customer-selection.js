import { useEffect, useRef } from "react";

const interactive = "a, button, input, label, select, textarea, [role=button]";

// The anchor belongs to a specific result set, in the server's displayed order.
export function useCustomerSelection(scope, items, selectedIds, onSelection) {
  const anchor = useRef(null);
  const drag = useRef(null);
  const ids = items.map(item => item.id);

  useEffect(() => () => drag.current?.stop(), []);
  useEffect(() => {
    drag.current?.stop();
    drag.current = null;
    anchor.current = null;
  }, [scope]);

  function apply(base, from, to, checked) {
    const a = ids.indexOf(from), b = ids.indexOf(to);
    if (a < 0 || b < 0) return;
    const next = new Set(base);
    for (const id of ids.slice(Math.min(a, b), Math.max(a, b) + 1)) {
      if (checked) next.add(id);
      else next.delete(id);
    }
    onSelection([...next]);
  }

  function change(id, checked, shift) {
    if (!ids.includes(id)) return;
    const previous = anchor.current;
    const from = shift && previous?.scope === scope ? previous.id : id;
    apply(selectedIds, ids.includes(from) ? from : id, id, checked);
    if (!shift || previous?.scope !== scope || !ids.includes(previous.id)) anchor.current = { scope, id };
  }

  return {
    change,
    reset: () => { anchor.current = null; drag.current?.stop(); drag.current = null; },
    row: id => ({
      "data-selection-row": id,
      onPointerDown(event) {
        drag.current?.stop();
        drag.current = null;
        if (event.pointerType !== "mouse" || event.button !== 0 || event.shiftKey ||
            event.target.closest(interactive) || !ids.includes(id)) return;
        const start = { scope, id, to: id, base: selectedIds, checked: !selectedIds.includes(id), moved: false };
        const finish = event => {
          start.stop();
          if (event.type !== "pointerup") { drag.current = null; return; }
          if (start.moved) {
            anchor.current = { scope, id };
            apply(start.base, id, start.to, start.checked);
          }
        };
        const listeners = new AbortController();
        start.stop = () => listeners.abort();
        drag.current = start;
        for (const type of ["pointerup", "pointercancel", "blur"]) {
          window.addEventListener(type, finish, { signal: listeners.signal });
        }
        event.preventDefault();
      },
      onPointerEnter(event) {
        const start = drag.current;
        if (event.pointerType !== "mouse" || !(event.buttons & 1) || start?.scope !== scope) return;
        if (!start.moved && start.id === id) return;
        start.moved = true;
        start.to = id;
      },
      onClick(event) {
        if (event.target.closest(interactive) || event.button !== 0) return;
        const moved = drag.current?.scope === scope && drag.current.moved;
        drag.current = null;
        if (!moved) change(id, !selectedIds.includes(id), event.shiftKey);
      },
    }),
  };
}
