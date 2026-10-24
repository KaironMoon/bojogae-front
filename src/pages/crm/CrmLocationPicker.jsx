/* eslint-disable react/prop-types */
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";
import { crmGet, crmPost, crmError } from "@/services/crm-service";
import { hasLocation, loadNaver } from "./crm-utils";

import { useSearchPins } from "./crm-map-pins";

export default function CrmLocationPicker({ value, onSelect, onClose }) {
  const initial = useRef(hasLocation(value) ? value : null);
  const pinPosition = useRef(initial.current);
  const element = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const api = useRef(null);
  const sequence = useRef(0);
  const selectedAddress = useRef(value.address || "");
  const [config, setConfig] = useState(null);
  const searchEnabled = Boolean(config?.geocoding_enabled || config?.place_search_enabled);
  const [mapError, setMapError] = useState("");
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState(initial.current);
  const [query, setQuery] = useState(value.address);
  const [candidates, setCandidates] = useState([]);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pinChanged, setPinChanged] = useState(false);
  const initialSearch = useRef(false);

  const choose = useCallback((candidate) => {
    if (!hasLocation(candidate)) return;
    sequence.current += 1;
    const point = new api.current.LatLng(candidate.lat, candidate.lng);
    map.current.setCenter(point);
    map.current.setZoom(16);
    marker.current.setPosition(point);
    marker.current.setMap(map.current);
    selectedAddress.current = candidate.address;
    pinPosition.current = candidate;
    setSelected({ address: candidate.address, lat: candidate.lat, lng: candidate.lng, accuracy: candidate.accuracy }); setPinChanged(false); setDescription(""); setCandidates([]); setError(""); setBusy(false);
  }, []);

  useSearchPins(ready ? api.current : null, map, candidates, choose);

  useEffect(() => {
    if (!ready || !searchEnabled || initial.current || initialSearch.current || value.address.trim().length < 2) return;
    initialSearch.current = true;
    setQuery(value.address);
    // Search once on opening an address-only location; save the selection only on confirmation.
    const request = ++sequence.current;
    setBusy(true);
    crmPost("/maps/search", { query: value.address.trim() }).then((data) => {
      if (request === sequence.current) {
        if (data.items[0]) choose(data.items[0]);
        setCandidates(data.items);
        if (!data.items.length) setError("검색 결과가 없습니다. 주소를 더 입력해 주세요.");
      }
    }).catch((err) => { if (request === sequence.current) setError(crmError(err)); })
      .finally(() => { if (request === sequence.current) setBusy(false); });
  }, [ready, searchEnabled, value.address, choose]);

  useEffect(() => {
    let active = true;
    crmGet("/configuration").then((result) => {
      if (active) setConfig(result.maps);
    }).catch((err) => { if (active) setMapError(crmError(err)); });
    return () => { active = false; sequence.current += 1; };
  }, []);

  useEffect(() => {
    if (!config?.enabled) return;
    let active = true;
    let click;
    let drag;
    let observer;
    loadNaver(config.key_id).then((maps) => {
      if (!active) return;
      api.current = maps;
      const start = initial.current || { lat: 37.5665, lng: 126.978 };
      map.current = new maps.Map(element.current, {
        center: new maps.LatLng(start.lat, start.lng),
        zoom: initial.current ? 16 : 12, zoomControl: true,
      });
      marker.current = new maps.Marker({
        map: initial.current ? map.current : null,
        position: new maps.LatLng(start.lat, start.lng), draggable: true,
      });
      const pick = (coord) => {
        const next = { address: selectedAddress.current, lat: coord.lat(), lng: coord.lng(), accuracy: "EXACT" };
        if (!hasLocation(next)) { setError("국내 위치를 선택해 주세요."); return; }
        if (pinPosition.current && Math.abs(pinPosition.current.lat - next.lat) < 1e-8 && Math.abs(pinPosition.current.lng - next.lng) < 1e-8) return;
        pinPosition.current = next;
        sequence.current += 1;
        marker.current.setPosition(coord);
        marker.current.setMap(map.current);
        setSelected(next);
        setCandidates([]);
        setError("");
        setBusy(false);
        setPinChanged(true);
      };
      click = maps.Event.addListener(map.current, "click", (e) => pick(e.coord));
      drag = maps.Event.addListener(marker.current, "dragend", () => pick(marker.current.getPosition()));
      observer = new ResizeObserver(() => {
        if (map.current) map.current.setSize(new maps.Size(element.current.clientWidth, element.current.clientHeight));
      });
      observer.observe(element.current);
      setReady(true);
    }).catch((err) => { if (active) setMapError(err.message); });
    return () => {
      active = false;
      observer?.disconnect();
      if (api.current) {
        if (click) api.current.Event.removeListener(click);
        if (drag) api.current.Event.removeListener(drag);
        if (map.current) api.current.Event.clearInstanceListeners(map.current);
      }
      marker.current?.setMap(null);
      marker.current = null;
      map.current = null;
    };
  }, [config]);

  async function search() {
    if (!ready || !searchEnabled || query.trim().length < 2 || busy) return;
    const request = ++sequence.current;
    setBusy(true); setError(""); setCandidates([]);
    try {
      const data = await crmPost("/maps/search", { query: query.trim() });
      if (request !== sequence.current) return;
      if (data.items[0]) choose(data.items[0]);
      setCandidates(data.items);
      if (!data.items.length) setError("검색 결과가 없습니다. 주소를 더 입력해 주세요.");
    } catch (err) {
      if (request === sequence.current) setError(crmError(err));
    } finally {
      if (request === sequence.current) setBusy(false);
    }
  }
  function submit() {
    const address = selectedAddress.current || value.address || description.trim() || "지도에서 선택한 위치";
    if (hasLocation(selected)) {
      onSelect({ ...selected, address, accuracy: pinChanged ? "EXACT" : selected.accuracy });
    } else {
      onSelect({ address, lat: null, lng: null, accuracy: "NONE" });
    }
  }
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md" aria-labelledby="crm-map-picker-title">
      <DialogTitle id="crm-map-picker-title">지도에서 위치 선택</DialogTitle>
      <DialogContent>
        <Stack gap={1.5} sx={{ pt: 1 }}>
          <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
            <TextField fullWidth size="small" label="주소 또는 장소명" placeholder="예: 상현역, 법조로 252" value={query}
              inputProps={{ maxLength: 300 }}
              onChange={(e) => { sequence.current += 1; setQuery(e.target.value); setCandidates([]); setError(""); setBusy(false); }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); search(); } }} />
            <Button disabled={!ready || !searchEnabled || busy || query.trim().length < 2} onClick={search} sx={{ minWidth: 80 }}>{busy ? "검색 중…" : "검색"}</Button>
          </Stack>
          {candidates.map((candidate, index) => <Button key={index} variant="outlined" onClick={() => choose(candidate)}>{candidate.title ? `${candidate.title} · ${candidate.address}` : candidate.address}</Button>)}
          {!config && !mapError && <Typography>지도를 불러오는 중입니다.</Typography>}
          {config && !config.enabled && <Alert severity="info">지도 설정이 준비되지 않았습니다. 주소 검색이나 직접 입력을 이용해 주세요.</Alert>}
          {mapError && <Alert severity="warning">{mapError}</Alert>}
          <Box ref={element} role="region" aria-label="위치 선택 지도" sx={{ width: "100%", height: { xs: 300, sm: 400 }, bgcolor: "grey.100", borderRadius: 1, overflow: "hidden" }} />
          <Typography variant="body2" color="text.secondary">검색한 주소와 좌표를 함께 저장합니다. 핀을 움직이면 지정한 좌표로 갱신합니다.</Typography>
          {selected && <Typography variant="body2">{selected.address || "핀을 선택했습니다."}</Typography>}
          {!selected?.address && !value.address && <TextField fullWidth size="small" label="위치 설명 (선택)" value={description} inputProps={{ maxLength: 500 }} onChange={(e) => setDescription(e.target.value)} placeholder="예: 역삼동 공원 옆 건물" />}
          {error && <Alert severity="info">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ flexWrap: "wrap" }}>
        <Button onClick={onClose}>취소</Button>
        <Button variant="contained" disabled={busy || (!selected && !value.address.trim() && !description.trim())} onClick={submit}>{selected ? "이 위치 사용" : "주소만 사용"}</Button>
      </DialogActions>
    </Dialog>
  );
}
