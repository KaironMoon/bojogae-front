import { useEffect, useRef } from "react";
import { hasLocation } from "./crm-utils";
import "./crm-map-pins.css";

export function createMapPin(maps, map, location, label, onClick, kind = "search") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `crm-map-pin crm-map-pin--${kind}`;
  button.setAttribute("aria-label", label);
  const dot = document.createElement("span");
  dot.className = "crm-map-pin__dot";
  dot.setAttribute("aria-hidden", "true");
  const name = document.createElement("span");
  name.className = "crm-map-pin__label";
  name.textContent = label;
  button.append(dot, name);
  button.onclick = (event) => { event.stopPropagation(); onClick(); };
  return new maps.Marker({
    map, position: new maps.LatLng(location.lat, location.lng),
    icon: { content: button, size: new maps.Size(30, 36), anchor: new maps.Point(15, 36) },
  });
}

// Search overlays use the existing response; rendering and selecting never issue another lookup.
export function useSearchPins(maps, map, candidates, onSelect) {
  const select = useRef(onSelect);
  useEffect(() => { select.current = onSelect; }, [onSelect]);
  useEffect(() => {
    if (!maps || !map.current) return;
    const locations = candidates.filter(hasLocation);
    const pins = locations.map((location) => createMapPin(
      maps, map.current, location, location.title || location.address,
      () => select.current(location),
    ));
    if (locations.length === 1) {
      map.current.setCenter(new maps.LatLng(locations[0].lat, locations[0].lng));
      map.current.setZoom(16);
    } else if (locations.length > 1) {
      const bounds = new maps.LatLngBounds();
      locations.forEach((location) => bounds.extend(new maps.LatLng(location.lat, location.lng)));
      map.current.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }
    return () => pins.forEach((pin) => pin.setMap(null));
  }, [maps, map, candidates]);
}
