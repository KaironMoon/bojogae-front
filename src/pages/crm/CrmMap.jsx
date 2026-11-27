/* eslint-disable react/prop-types */
import { Link } from "react-router-dom";
import CustomerMapReference from "./CustomerMapReference";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
} from "@mui/material";
import { crmGet, crmPost, crmPut, crmError, crmNearbyEvents } from "@/services/crm-service";
import {
  useCrm,
  State,
  Pages,
  CustomerLink,
  Directions,
  Empty,
} from "./CrmShared";
import { CustomerForm, TaskForm } from "./CrmForms";
import { STAGES, ACCURACY, hasLocation, loadNaver } from "./crm-utils";

import { createMapPin, useSearchPins } from "./crm-map-pins";

function MapCanvas({ config, origin, radius, items, candidates, onPick, onSelect }) {
  const element = useRef(null);
  const map = useRef(null);
  const [maps, setMaps] = useState(null);
  const centeredAt = useRef("");
  useSearchPins(maps, map, candidates, onPick);
  const [error, setError] = useState("");
  const pickRef = useRef(onPick);
  const selectRef = useRef(onSelect);
  useEffect(() => { selectRef.current = onSelect; }, [onSelect]);
  useEffect(() => {
    pickRef.current = onPick;
  }, [onPick]);
  useEffect(() => {
    if (!config?.enabled) return;
    let disposed = false;
    let click;
    let observer;
    loadNaver(config.key_id)
      .then((api) => {
        if (disposed) return;
        map.current = new api.Map(element.current, {
          center: new api.LatLng(37.5665, 126.978),
          zoom: 12,
          zoomControl: true,
        });
        centeredAt.current = "";
        click = api.Event.addListener(map.current, "click", (e) =>
          pickRef.current({
            lat: e.coord.lat(),
            lng: e.coord.lng(),
            address: "지도에서 선택한 위치",
            accuracy: "EXACT",
          }),
        );
        observer = new ResizeObserver(() => {
          if (map.current && element.current.clientWidth > 0 && element.current.clientHeight > 0)
            map.current.setSize(
              new api.Size(
                element.current.clientWidth,
                element.current.clientHeight,
              ),
            );
        });
        observer.observe(element.current);
        setMaps(api);
      })
      .catch((e) => {
        if (!disposed) setError(e.message);
      });
    return () => {
      disposed = true;
      observer?.disconnect();
      if (click && window.naver?.maps)
        window.naver.maps.Event.removeListener(click);
      if (map.current)
        window.naver.maps.Event.clearInstanceListeners(map.current);
      map.current = null;
    };
  }, [config?.enabled, config?.key_id]);
  useEffect(() => {
    if (!maps || !map.current) return;
    const overlays = [];
    if (hasLocation(origin)) {
      const position = new maps.LatLng(origin.lat, origin.lng);
      const centerKey = `${origin.lat}:${origin.lng}:${radius}`;
      if (centeredAt.current !== centerKey) {
        map.current.setCenter(position);
        centeredAt.current = centerKey;
      }
      overlays.push(
        new maps.Marker({
          map: map.current,
          position,
          title: "검색 기준 위치",
        }),
      );
      overlays.push(
        new maps.Circle({
          map: map.current,
          center: position,
          radius: radius * 1000,
          fillColor: "#03c75a",
          fillOpacity: 0.05,
          strokeColor: "#03c75a",
          strokeOpacity: 0.6,
        }),
      );
    }
    items.forEach((c) => {
      const loc = c.search_location;
      if (!hasLocation(loc)) return;
      overlays.push(createMapPin(
        maps, map.current, loc,
        `${c.name}${loc.accuracy === "APPROXIMATE" ? " (대략)" : ""}`,
        () => selectRef.current(c),
        "customer",
      ));
    });
    return () => overlays.forEach((overlay) => overlay.setMap(null));
  }, [maps, origin, radius, items]);
  if (!config?.enabled)
    return (
      <Alert severity="info">
        지도 설정 준비 전입니다. 고객 목록과 주소·일정 관리는 사용할 수
        있습니다.
      </Alert>
    );
  return (
    <>
      {error && <Alert severity="warning">{error}</Alert>}
      <Box
        ref={element}
        sx={{
          height: { xs: 480, md: 560 },
          width: "100%",
          bgcolor: "#f1f5f9",
          borderRadius: 2,
        }}
      />
    </>
  );
}
const keyOf = (c) => `${c.id}:${c.task_id || 0}`;
const EMPTY = [];
export default function CrmMap() {
  const config = useCrm("/configuration");
  const [origin, setOrigin] = useState(null);
  const [address, setAddress] = useState("");
  const [radius, setRadius] = useState("3");
  const [candidates, setCandidates] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState("CUSTOMERS");
  const [stage, setStage] = useState("");
  const [tag, setTag] = useState("");
  const [tasks, setTasks] = useState("");
  const [hasContract, setHasContract] = useState("");
  const [active, setActive] = useState(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pane, setPane] = useState("map");
  const [visit, setVisit] = useState(null);
  const [customer, setCustomer] = useState(null);
  const liveEnabled = !!config.data?.address_worker_enabled;
  const [registration, setRegistration] = useState(null);
  const [registrationAttempt, setRegistrationAttempt] = useState(0);
  useEffect(() => {
    if (!liveEnabled) return;
    let disposed = false;
    setRegistration({ loading: true });
    crmPost("/address-jobs/backfill", {})
      .then((data) => {
        if (!disposed) setRegistration({ queued: data.queued });
      })
      .catch((e) => {
        if (!disposed) setRegistration({ error: crmError(e) });
      });
    return () => { disposed = true; };
  }, [liveEnabled, registrationAttempt]);
  const initial = useCrm(active && !liveEnabled ? "/nearby-customers" : null, {
    ...active,
    page,
  });
  const [live, setLive] = useState(null);
  const [connection, setConnection] = useState(0);
  const searchKey = JSON.stringify({ ...active, page });
  useEffect(() => {
    if (!active || !liveEnabled) return;
    let disposed = false;
    setLive({ key: searchKey, data: null, error: "", loading: true });
    const source = crmNearbyEvents({ ...active, page });
    source.addEventListener("snapshot", (event) => {
      if (!disposed) setLive({ key: searchKey, data: JSON.parse(event.data), error: "", loading: false });
    });
    const failed = () => {
      if (!disposed) setLive((old) => ({ ...old, loading: false, error: "지도 실시간 연결이 끊겼습니다. 연결되지 않으면 새로고침 버튼을 눌러 주세요." }));
    };
    source.addEventListener("unavailable", () => { source.close(); failed(); });
    source.onerror = failed;
    return () => { disposed = true; source.close(); };
  }, [active, page, liveEnabled, searchKey, connection]);
  const resource = liveEnabled ? {
    ...(live?.key === searchKey ? live : { data: null, loading: !!active, error: "" }),
    reload: () => setConnection((value) => value + 1),
  } : initial;
  const items = resource.data?.items || EMPTY;
  async function geocode() {
    setBusy(true);
    setError("");
    try {
      const result = await crmPost("/maps/search", { query: address });
      setCandidates(result.items);
      if (!result.items.length)
        setError(
          "주소나 장소를 찾지 못했습니다. 지역명을 함께 입력하거나 지도에서 선택해 주세요.",
        );
    } catch (e) {
      setError(crmError(e));
    } finally {
      setBusy(false);
    }
  }
  function pick(location) {
    setCandidates([]);
    setOrigin({ address: location.address, lat: location.lat, lng: location.lng, accuracy: location.accuracy });
    setActive(null);
    setPage(1);
    setSelected(null);
  }
  function locate() {
    setError("");
    if (!navigator.geolocation) {
      setError(
        "현재 위치를 지원하지 않습니다. 주소를 입력하거나 지도를 선택해 주세요.",
      );
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        pick({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          address: "현재 위치",
          accuracy: "APPROXIMATE",
        });
        setBusy(false);
      },
      () => {
        setError(
          "현재 위치를 가져오지 못했습니다. 주소 입력이나 지도 선택을 이용해 주세요.",
        );
        setBusy(false);
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  }
  function search() {
    if (
      !hasLocation(origin) ||
      !Number.isFinite(Number(radius)) ||
      Number(radius) <= 0 ||
      Number(radius) > 100
    ) {
      setError("검색 기준 위치와 0 초과 100km 이하 반경을 확인해 주세요.");
      return;
    }
    setError("");
    setPage(1);
    setSelected(null);
    setActive({
      lat: origin.lat,
      lng: origin.lng,
      radius: Number(radius),
      mode,
      stage,
      tag,
      tasks,
      ...(hasContract === "" ? {} : { has_contract: hasContract }),
    });
  }
  async function editLocation(c) {
    setError("");
    try {
      const result = await crmGet(`/customers/${c.id}`);
      setCustomer({
        ...result,
        location: {
          ...(origin.accuracy === "EXACT" ? origin : { lat: null, lng: null, accuracy: "NONE" }),
          address: result.location.address || origin.address,
        },
      });
    } catch (e) {
      setError(crmError(e));
    }
  }
  const selectedCustomer = selected && items.find(c => keyOf(c) === keyOf(selected));
  const cardActions = c => <div className="customer-map-card-actions">
    {c.phone && <Button href={`tel:${c.phone}`}>전화</Button>}
    <Directions location={c.search_location} origin={origin} />
    <Button component={Link} to={`/crm/customers/${c.id}`}>상세</Button>
  </div>;
  return (<>
    <CustomerMapReference
      address={address} radius={radius} mode={mode} stage={stage} tag={tag} tasks={tasks} hasContract={hasContract}
      filtersOpen={filtersOpen} pane={pane} busy={busy} searching={resource.loading}
      canSearch={!!(config.data?.maps?.geocoding_enabled || config.data?.maps?.place_search_enabled)}
      origin={origin} total={resource.data?.total || 0}
      onAddress={setAddress} onRadius={setRadius} onMode={setMode} onStage={setStage} onTag={setTag}
      onTasks={setTasks} onHasContract={setHasContract} onFilters={() => setFiltersOpen(v => !v)}
      onPane={setPane} onGeocode={geocode} onLocate={locate} onSearch={search}
      candidates={candidates.map((r, i) => <Button key={i} variant="outlined" onClick={() => { pick(r); setCandidates([]); }}>{r.title ? `${r.title} · ${r.address}` : r.address}</Button>)}
      notices={<Stack gap={1}>
        {error && <Alert severity="warning">{error}</Alert>}
        <State resource={config} />
        {registration?.loading && <Alert severity="info">기존 고객의 주소 확인 작업을 등록하고 있습니다.</Alert>}
        {!!registration?.queued && <Alert severity="info">기존 고객 {registration.queued}명의 주소 확인 작업을 등록했습니다.</Alert>}
        {registration?.error && <Alert severity="error" action={<Button color="inherit" onClick={() => setRegistrationAttempt(v => v + 1)}>다시 시도</Button>}>주소 확인 작업 등록 실패: {registration.error}</Alert>}
        {!!resource.data?.address_progress?.pending && <Alert severity="info">주소 확인 대기·진행 {resource.data.address_progress.pending}명. 완료된 위치는 자동 반영됩니다.</Alert>}
        {!!resource.data?.address_progress?.unresolved && <Alert severity="info">미확정 주소 {resource.data.address_progress.unresolved}명. 고객정보에서 확인해 주세요.</Alert>}
        {!!resource.data?.unresolved_addresses && <Alert severity="info">주소를 찾지 못한 {resource.data.unresolved_addresses}건은 지도에 표시하지 못했습니다.</Alert>}
      </Stack>}
      map={<MapCanvas config={config.data?.maps} candidates={candidates} origin={active || origin} radius={active?.radius || Number(radius) || 3} items={active ? items : EMPTY} onPick={pick} onSelect={setSelected} />}
      selected={selectedCustomer && <>
        <div className="customer-map-floating-heading"><h3>{selectedCustomer.name}</h3><Button aria-label="선택 고객 닫기" onClick={() => setSelected(null)}>닫기</Button></div>
        <p>{selectedCustomer.search_location.address || selectedCustomer.region}</p>
        {cardActions(selectedCustomer)}
      </>}
      list={active && <>
        <State resource={resource} />
        {items.map(c => <article key={keyOf(c)} className={`customer-map-card${selectedCustomer && keyOf(selectedCustomer) === keyOf(c) ? " is-selected" : ""}`}>
          <div className="customer-map-card-heading"><CustomerLink id={c.id} name={c.name} /><Chip size="small" label={`${c.distance_km.toFixed(2)}km · ${ACCURACY[c.search_location.accuracy]}`} /></div>
          <p>{c.search_location.address || c.region} · {STAGES[c.stage]}</p>
          <p>통화: {c.call_preference || "미확인"} / 방문: {c.visit_preference || "미확인"}</p>
          {c.next_task && <p>다음 일정: {c.next_task.due_date} · {c.next_task.title}{c.next_task.is_overdue ? " · 기한 초과" : ""}</p>}
          {c.search_location.accuracy === "APPROXIMATE" && <p>대략 위치에 따른 참고 거리입니다.</p>}
          {cardActions(c)}
          <div className="customer-map-card-actions"><Button onClick={() => { setSelected(c); setPane("map"); }}>지도에서 보기</Button><Button onClick={() => setVisit(c)}>방문 등록</Button><Button onClick={() => editLocation(c)}>기준점으로 위치 수정</Button></div>
        </article>)}
        {resource.data && !items.length && <Empty>반경 안에 해당 고객이 없습니다.</Empty>}
        <Pages data={resource.data} onChange={setPage} />
      </>}
    />
      {visit && (
        <TaskForm
          customerId={visit.id}
          customerName={visit.name}
          location={visit.search_location.accuracy === "EXACT" ? visit.search_location : { address: visit.search_location.address, lat: null, lng: null, accuracy: "NONE" }}
          onClose={() => setVisit(null)}
          onSave={async (data) => {
            await crmPost("/tasks", data);
            resource.reload();
          }}
        />
      )}
      {customer && (
        <CustomerForm
          value={customer}
          onClose={() => setCustomer(null)}
          onSave={async (data) => {
            await crmPut(`/customers/${customer.id}`, data);
            resource.reload();
          }}
        />
      )}
    </>
  );
}
