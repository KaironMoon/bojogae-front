/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  Stack,
  Typography,
} from "@mui/material";
import { crmGet, crmPost, crmPut, crmError } from "@/services/crm-service";
import {
  useCrm,
  Panel,
  State,
  Field,
  Pages,
  CustomerLink,
  Directions,
  Empty,
} from "./CrmShared";
import { CustomerForm, TaskForm } from "./CrmForms";
import { STAGES, ACCURACY, hasLocation, loadNaver } from "./crm-utils";

import { createMapPin, useSearchPins } from "./crm-map-pins";

function MapCanvas({ config, origin, radius, items, route, candidates, onPick }) {
  const element = useRef(null);
  const map = useRef(null);
  const [maps, setMaps] = useState(null);
  useSearchPins(maps, map, candidates, onPick);
  const [error, setError] = useState("");
  const pickRef = useRef(onPick);
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
        click = api.Event.addListener(map.current, "click", (e) =>
          pickRef.current({
            lat: e.coord.lat(),
            lng: e.coord.lng(),
            address: "지도에서 선택한 위치",
            accuracy: "EXACT",
          }),
        );
        observer = new ResizeObserver(() => {
          if (map.current)
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
      map.current.setCenter(position);
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
          fillColor: "#2563eb",
          fillOpacity: 0.05,
          strokeColor: "#2563eb",
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
        () => document.getElementById(`nearby-${c.id}-${c.task_id || 0}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" }),
        "customer",
      ));
    });
    if (route.length > 1)
      overlays.push(
        new maps.Polyline({
          map: map.current,
          path: route.map(
            (c) =>
              new maps.LatLng(c.search_location.lat, c.search_location.lng),
          ),
          strokeColor: "#e11d48",
          strokeWeight: 3,
          strokeStyle: "shortdash",
        }),
      );
    return () => overlays.forEach((overlay) => overlay.setMap(null));
  }, [maps, origin, radius, items, route]);
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
          height: { xs: 350, md: 480 },
          width: "100%",
          bgcolor: "#f1f5f9",
          borderRadius: 2,
        }}
      />
      <Typography variant="caption">
        지도를 누르면 검색 기준 위치가 바뀝니다.
      </Typography>
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
  const [insurer, setInsurer] = useState("");
  const [tasks, setTasks] = useState("");
  const [hasContract, setHasContract] = useState("");
  const [active, setActive] = useState(null);
  const [page, setPage] = useState(1);
  const [route, setRoute] = useState([]);
  const [visit, setVisit] = useState(null);
  const [customer, setCustomer] = useState(null);
  const resource = useCrm(active ? "/nearby-customers" : null, {
    ...active,
    page,
  });
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
    setRoute([]);
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
    setRoute([]);
    setActive({
      lat: origin.lat,
      lng: origin.lng,
      radius: Number(radius),
      mode,
      stage,
      tag,
      insurer,
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
  function reorder(index, delta) {
    setRoute((values) => {
      const result = [...values];
      [result[index], result[index + delta]] = [
        result[index + delta],
        result[index],
      ];
      return result;
    });
  }
  return (
    <>
      <Panel>
        <Stack gap={2}>
          <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
            <Field
              label="검색 기준 주소·장소"
              placeholder="예: 상현역, 법조로 252"
              value={address}
              onChange={setAddress}
            />
            <Button
              disabled={
                busy ||
                !(config.data?.maps.geocoding_enabled || config.data?.maps.place_search_enabled) ||
                address.length < 2
              }
              onClick={geocode}
              sx={{ minWidth: 90 }}
            >
              {busy ? "검색 중…" : "위치 검색"}
            </Button>
            <Button disabled={busy} onClick={locate} sx={{ minWidth: 90 }}>
              내 위치
            </Button>
          </Stack>
          {candidates.map((r, i) => (
            <Button
              key={i}
              variant="outlined"
              onClick={() => {
                pick(r);
                setCandidates([]);
              }}
            >
              {r.title ? `${r.title} · ${r.address}` : r.address}
            </Button>
          ))}
          <Typography variant="body2">
            기준 위치:{" "}
            {origin
              ? origin.address || "선택한 위치"
              : "주소 검색·내 위치·지도 선택으로 지정해 주세요."}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
            <Field
              label="반경 (km, 1·3·5·10 등)"
              value={radius}
              type="number"
              inputProps={{ min: 0.1, max: 100, step: 0.1 }}
              onChange={setRadius}
            />
            <Field
              label="위치 기준"
              value={mode}
              options={{ CUSTOMERS: "고객 기본주소", VISITS: "예정 방문 장소" }}
              onChange={setMode}
            />
            <Field
              label="상담 단계"
              value={stage}
              options={{ "": "전체", ...STAGES }}
              onChange={setStage}
            />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
            <Field label="태그" value={tag} onChange={setTag} />
            <Field
              label="보험사 (정확한 명칭)"
              value={insurer}
              onChange={setInsurer}
            />
            <Field
              label="계약 보유"
              value={hasContract}
              options={{ "": "전체", true: "보유", false: "미보유" }}
              onChange={setHasContract}
            />
            <Field
              label="업무 필터"
              value={tasks}
              options={{
                "": "전체",
                CALL: "재연락 예정",
                OVERDUE: "기한 초과",
                TODAY_VISIT: "오늘 방문",
              }}
              onChange={setTasks}
            />
          </Stack>
          <Button
            variant="contained"
            onClick={search}
            disabled={!origin || resource.loading}
          >
            주변 고객 찾기
          </Button>
        </Stack>
      </Panel>
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <State resource={config} />
      <MapCanvas
        config={config.data?.maps}
        candidates={candidates}
        origin={origin}
        radius={Number(radius) || 3}
        items={active ? items : EMPTY}
        route={route}
        onPick={pick}
      />
      {route.length > 0 && (
        <Panel>
          <Typography fontWeight={700}>방문 후보 {route.length}명</Typography>
          <Typography variant="caption">
            연결선은 방문 순서이며 실제 도로 경로가 아닙니다.
          </Typography>
          {route.map((c, i) => (
            <Stack key={keyOf(c)} direction="row" gap={1} alignItems="center">
              <Typography>
                {i + 1}. {c.name}
              </Typography>
              <Button
                size="small"
                disabled={i === 0}
                onClick={() => reorder(i, -1)}
              >
                위로
              </Button>
              <Button
                size="small"
                disabled={i === route.length - 1}
                onClick={() => reorder(i, 1)}
              >
                아래로
              </Button>
              <Button
                size="small"
                onClick={() =>
                  setRoute(route.filter((r) => keyOf(r) !== keyOf(c)))
                }
              >
                제외
              </Button>
              <Directions
                location={c.search_location}
                origin={i > 0 ? route[i - 1].search_location : origin}
              />
            </Stack>
          ))}
        </Panel>
      )}
      {active && (
        <>
          <State resource={resource} />
          <Typography my={2}>
            직선거리 기준 {resource.data?.total || 0}건 · 연락 중단·보관 고객
            제외
          </Typography>
          {!!resource.data?.unresolved_addresses && <Alert severity="info">주소를 찾지 못한 {resource.data.unresolved_addresses}건은 지도에 표시하지 못했습니다. 고객 주소를 확인해 주세요.</Alert>}
          {items.map((c) => (
            <Panel key={keyOf(c)} id={`nearby-${c.id}-${c.task_id || 0}`}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
              >
                <Box>
                  <CustomerLink id={c.id} name={c.name} />
                  <Chip
                    size="small"
                    label={`${c.distance_km.toFixed(2)}km · ${ACCURACY[c.search_location.accuracy]}`}
                  />
                  <Typography variant="body2">
                    {c.search_location.address || c.region} · {STAGES[c.stage]}
                  </Typography>
                  <Typography variant="body2">
                    통화: {c.call_preference || "미확인"} / 방문:{" "}
                    {c.visit_preference || "미확인"} (선호 시간)
                  </Typography>
                  {c.next_task && (
                    <Typography
                      variant="body2"
                      color={
                        c.next_task.is_overdue ? "error" : "text.secondary"
                      }
                    >
                      다음 일정: {c.next_task.due_date} · {c.next_task.title}
                    </Typography>
                  )}
                  {c.search_location.accuracy === "APPROXIMATE" && (
                    <Typography variant="caption" color="warning.main">
                      대략 위치에 따른 참고 거리입니다.
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" alignItems="center" flexWrap="wrap">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={route.some((r) => keyOf(r) === keyOf(c))}
                        onChange={(e) =>
                          setRoute(
                            e.target.checked
                              ? [...route, c]
                              : route.filter((r) => keyOf(r) !== keyOf(c)),
                          )
                        }
                      />
                    }
                    label="방문 후보"
                  />
                  {c.phone && <Button href={`tel:${c.phone}`}>전화</Button>}
                  <Button onClick={() => setVisit(c)}>방문 등록</Button>
                  <Directions location={c.search_location} origin={origin} />
                  <Button onClick={() => editLocation(c)}>
                    기준점으로 위치 수정
                  </Button>
                </Stack>
              </Stack>
            </Panel>
          ))}
          {resource.data && !items.length && (
            <Empty>반경 안에 해당 고객이 없습니다.</Empty>
          )}
          <Pages data={resource.data} onChange={setPage} />
        </>
      )}
      {visit && (
        <TaskForm
          customerId={visit.id}
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
