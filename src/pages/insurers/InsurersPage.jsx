/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import {
  Alert, Button, Chip, CircularProgress, InputAdornment, Snackbar, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tabs, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from "@mui/material";
import AppsRoundedIcon from "@mui/icons-material/AppsRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";

import { useAuth } from "@/auth/AuthContext";
import { getInsurers } from "@/services/insurer-service";
import { FavoriteButton, InsurerCard, InsurerDetailDialog, InsurerLogo, Sector, VideoLinks } from "./InsurerDirectoryParts";
import { categories, contactsFor, external, initialFilters, initialFor, institutions, portalFor } from "./insurer-directory";
import "./insurers.css";

function readPreferences(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function DirectoryTable({ items, preferences, onToggle, onOpen, onCopy }) {
  return <TableContainer className="insurer-table" tabIndex={0} role="region" aria-label="보험사 일람표 스크롤 영역">
    <Table size="small" aria-label="보험사 일람표">
      <TableHead><TableRow>
        {["보험사", "고객센터", "인콜 모니터링", "전산 헬프데스크", "보험금 청구 팩스", "설계사 전산", "상세", "즐겨찾기"].map(label => (
          <TableCell key={label} scope="col">{label}</TableCell>
        ))}
      </TableRow></TableHead>
      <TableBody>
        {items.map(insurer => {
          const contacts = contactsFor(insurer);
          const portal = portalFor(insurer);
          return <TableRow key={insurer.id} hover>
            <TableCell component="th" scope="row">
              <div className="insurer-table__name">
                <InsurerLogo insurer={insurer} />
                <div><strong>{insurer.name}</strong><Sector kind={insurer.kind} /></div>
              </div>
            </TableCell>
            {contacts.slice(0, 4).map(entry => <TableCell key={entry.label}>
              {entry.value ? <Button size="small" onClick={() => onCopy(entry.value, entry.label)}
                aria-label={`${insurer.name} ${entry.label} ${entry.value} 복사`}>{entry.value}</Button> : "미확인"}
            </TableCell>)}
            <TableCell>{portal && <Button size="small" href={portal.link.url} {...external}
              endIcon={<OpenInNewOutlinedIcon />}>전산</Button>}</TableCell>
            <TableCell><Button size="small" onClick={() => onOpen(insurer)} aria-label={`${insurer.name} 자세히 보기`}>보기</Button></TableCell>
            <TableCell><FavoriteButton name={insurer.name} favorite={Boolean(preferences[insurer.id]?.favorite)} onToggle={() => onToggle(insurer.id)} /></TableCell>
          </TableRow>;
        })}
      </TableBody>
    </Table>
  </TableContainer>;
}

function DirectoryWorkspace({ storageKey }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [initial, setInitial] = useState("");
  const [view, setView] = useState("card");
  const [preferences, setPreferences] = useState(() => readPreferences(storageKey));
  const [directory, setDirectory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    const timer = setTimeout(async () => {
      try {
        const result = await getInsurers(query.trim(), controller.signal);
        if (!controller.signal.aborted) setDirectory(result);
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, query.trim() ? 250 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, retry]);

  function updatePreference(id, update) {
    const next = { ...preferences, [id]: { ...preferences[id], ...update } };
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setPreferences(next);
      return true;
    } catch {
      setNotice({ severity: "error", message: "브라우저에 저장하지 못했습니다." });
      return false;
    }
  }

  function toggleFavorite(id) {
    updatePreference(id, { favorite: !preferences[id]?.favorite });
  }

  function openDetails(insurer) {
    setNotice(null);
    setSelected(insurer);
    setDialogOpen(true);
  }

  function closeDetails() {
    setNotice(null);
    setDialogOpen(false);
  }

  async function copy(value, label) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice({ severity: "success", message: `${label} 복사 완료` });
    } catch {
      setNotice({ severity: "error", message: "복사하지 못했습니다. 표시된 내용을 직접 복사해 주세요." });
    }
  }

  const items = directory?.items || [];
  const counts = { ...directory?.counts, all: items.length, favorites: items.filter(item => preferences[item.id]?.favorite).length };
  const visible = items.filter(item => (
    (kind === "all" || (kind === "favorites" ? preferences[item.id]?.favorite : item.kind === kind))
    && (!initial || initialFor(item) === initial)
  ));

  return <div className="insurer-directory">
    <div className="insurer-directory__workspace">
      <header className="insurer-surface insurer-hero">
        <div>
          <div className="insurer-hero__badges">
            <Chip size="small" label="INSURER PORTAL & HELPDESK" />
            <Chip size="small" label="생명·손해·공제 통합" />
          </div>
          <Typography className="css-j405rk" component="h1" variant="h5">보험사 정보·링크</Typography>
          <p>보험사·공제기관의 업무 링크와 연락처, 청구서류, 카드납 정보를 확인하세요.</p>
        </div>
        <VideoLinks />
      </header>

      <section className="insurer-institutions" aria-label="외부 기관 바로가기">
        {institutions.map(([name, description, url], index) => (
          <a key={url} href={url} {...external} className="insurer-surface insurer-institution">
            <div><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><OpenInNewOutlinedIcon aria-label="새 창" /></div>
            <strong>{name}</strong><small>{description}</small>
          </a>
        ))}
      </section>

      <section className="insurer-surface insurer-filters" aria-label="보험사 검색과 필터">
        <Tabs value={kind} onChange={(_, value) => setKind(value)} aria-label="보험사 분류" variant="scrollable" scrollButtons="auto">
          {categories.map(category => <Tab key={category.value} value={category.value}
            id={`insurer-tab-${category.value}`} aria-controls={`insurer-panel-${category.value}`}
            icon={category.value === "favorites" ? <StarRoundedIcon /> : undefined} iconPosition="start"
            label={`${category.label}${!loading && !error && directory ? ` (${counts[category.value] || 0})` : ""}`} />)}
        </Tabs>
        <div className="insurer-filters__search">
          <TextField value={query} onChange={event => setQuery(event.target.value)} fullWidth size="small"
            placeholder="보험사명, 전산명, 전화번호로 검색"
            slotProps={{ htmlInput: { maxLength: 100, "aria-label": "보험사명, 전산명, 전화번호 검색" },
              input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> } }} />
          <ToggleButtonGroup exclusive value={view} onChange={(_, value) => value && setView(value)} size="small" aria-label="보기 방식">
            <ToggleButton value="card"><AppsRoundedIcon />카드뷰</ToggleButton>
            <ToggleButton value="table"><FormatListBulletedRoundedIcon />일람표</ToggleButton>
          </ToggleButtonGroup>
        </div>
        <div className="insurer-filters__initials" role="group" aria-label="보험사 초성">
          {["", ...initialFilters].map(letter => <button key={letter} type="button"
            aria-pressed={initial === letter} onClick={() => setInitial(letter)}>{letter || "전체"}</button>)}
        </div>
      </section>

      <section role="tabpanel" id={`insurer-panel-${kind}`} aria-labelledby={`insurer-tab-${kind}`} aria-busy={loading}>
        {loading ? <div role="status" className="insurer-empty"><CircularProgress size={22} /> 보험사 정보를 불러오는 중입니다.</div>
          : error ? <Alert severity="error" action={<Button color="inherit" onClick={() => setRetry(value => value + 1)}>다시 시도</Button>}>보험사 정보를 불러오지 못했습니다.</Alert>
          : <>
            <p className="insurer-result-count" role="status">{visible.length}개 기관</p>
            {!visible.length ? <div className="insurer-surface insurer-empty">
              {kind === "favorites" && !query.trim() && !initial ? "즐겨찾기한 보험사가 없습니다." : "검색 조건에 맞는 보험사가 없습니다."}
            </div> : view === "card" ? <div className="insurer-grid">
              {visible.map(insurer => <InsurerCard key={insurer.id} insurer={insurer}
                favorite={Boolean(preferences[insurer.id]?.favorite)} onToggle={() => toggleFavorite(insurer.id)}
                onOpen={() => openDetails(insurer)} onCopy={copy} />)}
            </div> : <DirectoryTable items={visible} preferences={preferences} onToggle={toggleFavorite} onOpen={openDetails} onCopy={copy} />}
          </>}
      </section>
    </div>

    <InsurerDetailDialog insurer={selected} open={dialogOpen} favorite={Boolean(preferences[selected?.id]?.favorite)}
      memo={preferences[selected?.id]?.memo || ""} onClose={closeDetails} onExited={() => setSelected(null)}
      onToggle={() => toggleFavorite(selected.id)} onSaveMemo={memo => {
        if (updatePreference(selected.id, { memo })) setNotice({ severity: "success", message: "메모를 저장했습니다." });
      }} onCopy={copy} notice={dialogOpen ? notice : null} onDismissNotice={() => setNotice(null)} />
    {!dialogOpen && notice && <Snackbar key={notice.message} open autoHideDuration={2700}
      onClose={(_, reason) => reason !== "clickaway" && setNotice(null)}>
      <Alert severity={notice.severity} variant="filled" onClose={() => setNotice(null)}>{notice.message}</Alert>
    </Snackbar>}
  </div>;
}

export default function InsurersPage() {
  const { user } = useAuth();
  const storageKey = `bojogae.insurers.preferences.${user.id}`;
  return <DirectoryWorkspace key={storageKey} storageKey={storageKey} />;
}
