/* eslint-disable react/prop-types -- Helpers are private to this form. */
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { getAdminInsurers, insurerError, saveInsurer } from "@/services/insurer-service";
import {
  AdminEmptyState,
  AdminPageContainer,
  AdminPageHeader,
} from "./components/AdminPageShell";

const today = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());
const evidence = () => ({ source_url: "", checked_at: today() });
const blank = () => ({
  id: "",
  name: "",
  kind: "non_life",
  website: { label: "공식 홈페이지", url: "", ...evidence() },
  browser: { value: "", icons: [], ...evidence() },
  customer_service: { value: "", ...evidence() },
  logo: null,
  systems: [],
  contacts: [],
  links: [],
  card_payment: [],
  notes: [],
  is_active: true,
  sort_order: 0,
  version: 0,
});
const clone = (value) => JSON.parse(JSON.stringify(value));
const kindNames = { non_life: "손해보험", life: "생명보험", other: "보험·공제" };

function read(object, path) { return path.split(".").reduce((value, key) => value?.[key], object) ?? ""; }
function change(object, path, value) {
  const copy = clone(object);
  const keys = path.split(".");
  let target = copy;
  keys.slice(0, -1).forEach((key) => { target[key] ||= {}; target = target[key]; });
  target[keys.at(-1)] = value;
  return copy;
}
const sourceFields = [["source_url", "출처 주소", "url"], ["checked_at", "확인일", "date"]];
const infoFields = [["label", "항목명"], ["value", "내용"], ...sourceFields];
const linkFields = [["label", "버튼 이름"], ["url", "연결 주소", "url"], ...sourceFields];

function Fields({ item, fields, onChange, disabled }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0,1fr))" }, gap: 1.5 }}>
      {fields.map(([path, label, type]) => (
        <TextField
          key={path}
          label={label}
          type={type || "text"}
          value={read(item, path)}
          disabled={disabled}
          size="small"
          fullWidth
          onChange={(event) => onChange(change(item, path, event.target.value))}
          multiline={path.endsWith("value")}
          maxRows={8}
          slotProps={type === "date" ? { inputLabel: { shrink: true } } : undefined}
        />
      ))}
    </Box>
  );
}

function Rows({ title, rows, fields, makeRow, onChange, disabled }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2.5, bgcolor: "#F8FAFC" }}>
      <Stack spacing={1.5}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography component="h3" variant="subtitle2" fontWeight={800}>{title} ({rows.length})</Typography>
          <Button size="small" variant="outlined" disabled={disabled} startIcon={<AddRoundedIcon />} onClick={() => onChange([...rows, makeRow()])}>
            항목 추가
          </Button>
        </Stack>
        {rows.map((item, index) => (
          <Paper key={index} variant="outlined" sx={{ p: 1.75, borderRadius: 2, bgcolor: "#FFFFFF" }}>
            <Fields item={item} fields={fields} disabled={disabled} onChange={(value) => onChange(rows.map((row, i) => (i === index ? value : row)))} />
            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
              <Button size="small" color="error" disabled={disabled} onClick={() => onChange(rows.filter((_, i) => i !== index))}>
                항목 삭제
              </Button>
            </Stack>
          </Paper>
        ))}
        {!rows.length && <Typography variant="body2" color="text.secondary">등록된 항목이 없습니다.</Typography>}
      </Stack>
    </Paper>
  );
}

function prepare(item) {
  const value = clone(item);
  value.browser ||= { value: "", icons: [], ...evidence() };
  value.customer_service ||= { value: "", ...evidence() };
  for (const system of value.systems) {
    system.browser ||= { value: "", icons: [], ...evidence() };
    system.security_program ||= { value: "", ...evidence() };
    system.login ||= { value: "", ...evidence() };
  }
  return value;
}

function payloadFor(draft) {
  const item = clone(draft);
  item.sort_order = Number(item.sort_order);
  for (const key of ["claim_copy_limit", "esign_cutoff_time"]) item[key] = item[key]?.trim() || null;
  item.links.forEach((link) => { if (!link.url?.trim()) link.url = null; });
  item.customer_service = item.customer_service.value.trim() ? item.customer_service : null;
  item.browser = item.browser.value.trim() ? item.browser : null;
  for (const system of item.systems) {
    for (const key of ["browser", "security_program", "login"]) {
      if (!system[key]?.value?.trim()) system[key] = null;
    }
  }
  const clean = (value) => {
    if (!value || typeof value !== "object") return;
    if ("source_url" in value && !value.source_url) value.source_url = null;
    Object.values(value).forEach(clean);
  };
  clean(item);
  return item;
}

export default function InsurersAdminPage() {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState(null);
  const [editorTab, setEditorTab] = useState("basic");
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    const result = await getAdminInsurers();
    setItems(result.items);
    setReady(result.storage_ready);
  };
  useEffect(() => { load().catch((err) => setError(insurerError(err))); }, []);

  const choose = (item) => {
    if (draft && !window.confirm("작성 중인 내용을 닫고 다른 정보를 열까요?")) return;
    setDraft(prepare(item));
    setEditorTab("basic");
    setMessage("");
    setError("");
  };

  const save = async (event) => {
    event.preventDefault();
    setWorking(true);
    setError("");
    setMessage("");
    try {
      const saved = await saveInsurer(payloadFor(draft));
      setDraft(prepare(saved));
      await load();
      setMessage("저장했습니다. 보험사 정보 페이지에 반영되었습니다.");
    } catch (err) {
      setError(insurerError(err));
    } finally {
      setWorking(false);
    }
  };

  const uploadLogo = async (file) => {
    if (!file) return;
    if (file.type !== "image/png" || file.size > 1048576) {
      setError("로고는 1MB 이하 PNG 파일을 선택해 주세요.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setDraft((current) => ({ ...current, logo: { path: reader.result, width: 1, height: 1, view_box: "0 0 1 1", ...evidence() } }));
    reader.onerror = () => setError("로고 파일을 읽지 못했습니다.");
    reader.readAsDataURL(file);
  };

  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const shown = items.filter((item) => (
    (kindFilter === "all" || item.kind === kindFilter)
    && item.name.toLowerCase().includes(query.toLowerCase())
  ));

  return (
    <AdminPageContainer maxWidth={1440}>
      <AdminPageHeader
        icon={BusinessCenterOutlinedIcon}
        badge={`총 ${items.length}곳`}
        title="보험사 정보 관리"
        description="보험사·공제기관의 연락처, 업무전산, 브라우저, 로고와 카드납 정보를 관리합니다."
        actions={(
          <>
            <Button variant="outlined" size="small" startIcon={<RefreshRoundedIcon />} disabled={working} onClick={() => load().catch((err) => setError(insurerError(err)))}>
              새로고침
            </Button>
            <Button variant="contained" size="small" startIcon={<AddRoundedIcon />} disabled={working} onClick={() => choose(blank())}>
              새 보험사
            </Button>
          </>
        )}
      />

      {!ready && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2.5 }}>
          DB 관리 테이블 적용 전에는 정보를 조회할 수 있지만 저장할 수 없습니다. 056_insurer_directory.sql을 적용해 주세요.
        </Alert>
      )}
      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2, borderRadius: 2.5 }}>{error}</Alert>}
      {message && <Alert severity="success" onClose={() => setMessage("")} sx={{ mb: 2, borderRadius: 2.5 }}>{message}</Alert>}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "310px minmax(0,1fr)" }, gap: 2.5, alignItems: "start" }}>
        {/* Left Insurer Directory (hidden on xs while editing so mobile jumps right to editor) */}
        <Paper
          variant="outlined"
          sx={{
            p: 1.75,
            borderRadius: 3,
            bgcolor: "#FFFFFF",
            display: { xs: draft ? "none" : "block", md: "block" },
          }}
        >
          <Stack spacing={1.25}>
            <TextField
              size="small"
              label="보험사 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }}
            />
            <Tabs
              value={kindFilter}
              onChange={(_e, next) => setKindFilter(next)}
              variant="scrollable"
              scrollButtons={false}
              sx={{ minHeight: 34, "& .MuiTab-root": { minHeight: 34, minWidth: 0, px: 1.25, py: 0.4, fontSize: 12, fontWeight: 750 } }}
            >
              <Tab value="all" label="전체" />
              <Tab value="non_life" label="손보" />
              <Tab value="life" label="생보" />
              <Tab value="other" label="공제" />
            </Tabs>
            <Typography variant="caption" color="text.secondary">
              전체 {items.length}곳 · 표시 {shown.length}곳
            </Typography>
            <Box sx={{ maxHeight: { md: "68vh" }, overflowY: "auto", pr: 0.5 }}>
              {shown.map((item) => {
                const selected = draft?.id === item.id;
                return (
                  <Button
                    key={item.id}
                    fullWidth
                    disabled={working}
                    onClick={() => choose(item)}
                    variant={selected ? "contained" : "text"}
                    sx={{
                      justifyContent: "space-between",
                      mb: 0.5,
                      px: 1.25,
                      py: 0.9,
                      borderRadius: 2,
                      textAlign: "left",
                      color: selected ? "#fff" : "text.primary",
                      bgcolor: selected ? "#03C75A" : "transparent",
                      "&:hover": { bgcolor: selected ? "#02B14F" : "#F8FAFC" },
                    }}
                  >
                    <Typography variant="body2" fontWeight={selected ? 800 : 650} noWrap sx={{ minWidth: 0 }}>
                      {item.name}
                    </Typography>
                    <Chip
                      size="small"
                      label={item.is_active ? kindNames[item.kind] : "숨김"}
                      sx={{
                        ml: 1,
                        height: 20,
                        fontSize: 10.5,
                        fontWeight: 750,
                        bgcolor: selected ? "rgba(255,255,255,0.22)" : "#F1F5F9",
                        color: selected ? "#fff" : "#475569",
                      }}
                    />
                  </Button>
                );
              })}
            </Box>
          </Stack>
        </Paper>

        {draft ? (
          <Paper component="form" onSubmit={save} variant="outlined" sx={{ borderRadius: 3, bgcolor: "#FFFFFF", overflow: "hidden" }}>
            <Box
              sx={{
                position: "sticky",
                top: 0,
                zIndex: 2,
                bgcolor: "#FFFFFF",
                borderBottom: "1px solid #E2E8F0",
                p: { xs: 1.5, sm: 2 },
              }}
            >
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ArrowBackRoundedIcon />}
                    disabled={working}
                    onClick={() => { if (window.confirm("작성 중인 내용을 닫고 목록으로 돌아갈까요?")) setDraft(null); }}
                    sx={{ display: { xs: "inline-flex", md: "none" } }}
                  >
                    목록
                  </Button>
                  <Typography component="h2" variant="h6" fontWeight={850}>
                    {draft.version ? `${draft.name} 수정` : "새 보험사 등록"}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={working}
                    onClick={() => { if (window.confirm("작성 중인 내용을 닫을까요?")) setDraft(null); }}
                  >
                    닫기
                  </Button>
                  <Button type="submit" size="small" variant="contained" disabled={working || !ready || !draft.id.trim() || !draft.name.trim()}>
                    {working ? "저장 중…" : "저장"}
                  </Button>
                </Stack>
              </Stack>

              <Tabs
                value={editorTab}
                onChange={(_e, next) => setEditorTab(next)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ mt: 1, minHeight: 40, "& .MuiTab-root": { minHeight: 40, fontWeight: 750, fontSize: 13 } }}
              >
                <Tab value="basic" label="기본 · 로고" />
                <Tab value="support" label="홈페이지 · 고객센터 · 청구" />
                <Tab value="systems" label={`업무 시스템 (${draft.systems.length})`} />
                <Tab value="extra" label={`링크 · 연락처 · 카드납 (${draft.links.length + draft.contacts.length + draft.card_payment.length + draft.notes.length})`} />
              </Tabs>
            </Box>

            <Stack spacing={2.5} sx={{ p: { xs: 1.75, sm: 2.5 } }}>
              {editorTab === "basic" && (
                <>
                  <Fields item={draft} disabled={working} onChange={setDraft} fields={[["name", "보험사명"], ["sort_order", "표시 순서", "number"]]} />
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
                    <TextField
                      size="small"
                      label="보험사 ID"
                      value={draft.id}
                      disabled={working || draft.version > 0}
                      helperText="영문 소문자·숫자·하이픈, 저장 후 변경 불가"
                      onChange={(e) => update("id", e.target.value)}
                    />
                    <TextField select size="small" label="분류" value={draft.kind} disabled={working} onChange={(e) => update("kind", e.target.value)}>
                      {Object.entries(kindNames).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
                    </TextField>
                  </Box>
                  <FormControlLabel
                    label="사용자 페이지에 표시"
                    control={<Switch color="success" checked={draft.is_active} disabled={working} onChange={(e) => update("is_active", e.target.checked)} />}
                  />
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: "#F8FAFC" }}>
                    <Stack spacing={1.25}>
                      <Typography variant="subtitle2" fontWeight={800}>회사 로고</Typography>
                      {draft.logo && (draft.logo.path.startsWith("data:") ? (
                        <Box component="img" src={draft.logo.path} alt="로고 미리보기" sx={{ width: 160, height: 90, objectFit: "contain", bgcolor: "#fff", p: 1, borderRadius: 1.5, border: "1px solid #E2E8F0" }} />
                      ) : (
                        <Box component="svg" viewBox={draft.logo.view_box} role="img" aria-label="로고 미리보기" sx={{ width: 160, height: 90, bgcolor: "#fff", p: 1, borderRadius: 1.5, border: "1px solid #E2E8F0" }}>
                          <image href={draft.logo.path} width={draft.logo.width} height={draft.logo.height} />
                        </Box>
                      ))}
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Button size="small" component="label" variant="outlined" disabled={working}>
                          PNG 로고 선택
                          <input hidden type="file" accept="image/png" onChange={(e) => uploadLogo(e.target.files?.[0])} />
                        </Button>
                        <Button size="small" variant="outlined" color="error" disabled={working || !draft.logo} onClick={() => update("logo", null)}>
                          로고 제거
                        </Button>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">PNG · 최대 1MB · 저장 시 적용</Typography>
                      {draft.logo && <Fields item={draft.logo} fields={sourceFields} disabled={working} onChange={(value) => update("logo", value)} />}
                    </Stack>
                  </Paper>
                </>
              )}

              {editorTab === "support" && (
                <>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" fontWeight={800}>공식 홈페이지</Typography>
                    <Fields item={draft.website} fields={linkFields} disabled={working} onChange={(value) => update("website", value)} />
                  </Stack>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" fontWeight={800}>고객센터</Typography>
                    <Fields item={draft.customer_service} fields={[["value", "전화번호·안내"], ...sourceFields]} disabled={working} onChange={(value) => update("customer_service", value)} />
                  </Stack>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" fontWeight={800}>지원 브라우저</Typography>
                    <Fields item={draft.browser} fields={[["value", "브라우저 안내"], ...sourceFields]} disabled={working} onChange={(value) => update("browser", value)} />
                    <Stack direction="row">
                      {["Chrome", "Edge"].map((name) => (
                        <FormControlLabel
                          key={name}
                          label={name}
                          control={(
                            <Checkbox
                              disabled={working}
                              checked={draft.browser.icons.some((icon) => icon.name === name)}
                              onChange={(e) => update("browser", {
                                ...draft.browser,
                                value: draft.browser.value || name,
                                icons: e.target.checked
                                  ? [...draft.browser.icons, { name, path: `/insurer-assets/browser-${name.toLowerCase()}.png` }]
                                  : draft.browser.icons.filter((icon) => icon.name !== name),
                              })}
                            />
                          )}
                        />
                      ))}
                    </Stack>
                  </Stack>
                  {draft.claim && (
                    <Stack spacing={1}>
                      <Typography variant="subtitle2" fontWeight={800}>보험금 청구 안내</Typography>
                      <Fields item={draft.claim} fields={linkFields} disabled={working} onChange={(value) => update("claim", value)} />
                      <Button size="small" color="error" sx={{ alignSelf: "flex-start" }} onClick={() => update("claim", null)} disabled={working}>
                        청구 안내 링크 제거
                      </Button>
                    </Stack>
                  )}
                  <Stack spacing={1}>
                    <Typography component="h3" variant="subtitle2" fontWeight={800}>청구 한도 · 전자서명 마감 안내</Typography>
                    <Typography variant="caption" color="text.secondary">
                      비워 두면 사용자 화면에 확인 필요 또는 준비 중으로 표시됩니다.
                    </Typography>
                    <Fields item={draft} disabled={working} onChange={setDraft} fields={[["claim_copy_limit", "사본 청구 한도"], ["esign_cutoff_time", "전자서명 마감 시간 안내"]]} />
                  </Stack>
                </>
              )}

              {editorTab === "systems" && (
                <Rows
                  title="업무 시스템"
                  rows={draft.systems}
                  disabled={working}
                  fields={[
                    ["link.label", "시스템명"],
                    ["link.url", "전산 주소", "url"],
                    ...sourceFields.map(([path, label, type]) => [`link.${path}`, label, type]),
                    ["browser.value", "시스템별 브라우저 안내"],
                    ["security_program.value", "필수 프로그램"],
                    ["login.value", "로그인·이용 권한"],
                    ...["browser", "security_program", "login"].flatMap((key) =>
                      sourceFields.map(([path, label, type]) => [`${key}.${path}`, `${key === "browser" ? "브라우저" : key === "login" ? "로그인" : "프로그램"} ${label}`, type]),
                    ),
                  ]}
                  makeRow={() => ({
                    link: { label: "업무 전산", url: "", ...evidence() },
                    browser: { value: "", icons: [], ...evidence() },
                    security_program: { value: "", ...evidence() },
                    login: { value: "", ...evidence() },
                  })}
                  onChange={(value) => update("systems", value)}
                />
              )}

              {editorTab === "extra" && (
                <>
                  <Rows title="약관·청구양식·기타 링크" rows={draft.links} fields={linkFields} makeRow={() => ({ label: "", url: "", ...evidence() })} onChange={(value) => update("links", value)} disabled={working} />
                  {[
                    ["contacts", "연락처·팩스 안내"],
                    ["card_payment", "카드납 정보"],
                    ["notes", "추가 안내"],
                  ].map(([key, title]) => (
                    <Rows key={key} title={title} rows={draft[key]} fields={infoFields} makeRow={() => ({ label: "", value: "", ...evidence() })} onChange={(value) => update(key, value)} disabled={working} />
                  ))}
                </>
              )}
            </Stack>
          </Paper>
        ) : (
          <AdminEmptyState
            icon={BusinessCenterOutlinedIcon}
            title="수정할 보험사를 선택해 주세요."
            description="좌측 목록에서 보험사를 클릭하거나 상단의 '새 보험사' 버튼을 눌러 정보를 편집할 수 있습니다."
            action={<Button variant="contained" startIcon={<AddRoundedIcon />} disabled={working} onClick={() => choose(blank())}>새 보험사</Button>}
          />
        )}
      </Box>
    </AdminPageContainer>
  );
}
