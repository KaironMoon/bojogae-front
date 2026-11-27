import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import MergeTypeRoundedIcon from "@mui/icons-material/MergeTypeRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import { Link, useSearchParams } from "react-router-dom";

import { getUsage } from "@/services/proposal-service";
import {
  backfillAnalyticsGeo,
  downloadAnalyticsSegmentsExport,
  getAnalyticsCompanies,
  getAnalyticsKkomak,
  getAnalyticsOverview,
  getAnalyticsSegments,
  getAnalyticsTraffic,
  triggerAnalyticsRollup,
} from "@/services/analytics-service";
import {
  ActivityHeatmap,
  DonutChart,
  FunnelChart,
  HorizontalBarList,
  KpiStatCard,
  TimeSeriesChart,
} from "./analytics/AnalyticsCharts";
import CompanyAliasDialog from "./analytics/CompanyAliasDialog";
import IpGeoOverrideDialog from "./analytics/IpGeoOverrideDialog";

function formatDuration(seconds) {
  const sec = Math.max(0, Math.round(Number(seconds) || 0));
  if (sec < 60) return `${sec}초`;
  const mins = Math.floor(sec / 60);
  const rem = sec % 60;
  if (mins < 60) return rem > 0 ? `${mins}분 ${rem}초` : `${mins}분`;
  const hrs = Math.floor(mins / 60);
  const remMin = mins % 60;
  return `${hrs}시간 ${remMin}분`;
}

const EMPTY_GEMINI = {
  call_count: 0,
  input_tokens: 0,
  output_tokens: 0,
  thought_tokens: 0,
  cached_tokens: 0,
  total_tokens: 0,
};

const TAB_KEYS = ["overview", "traffic", "companies", "kkomak", "segments", "gemini"];

function formatKstDate(dateObj) {
  const kst = new Date(dateObj.getTime() + 9 * 3600 * 1000);
  return kst.toISOString().slice(0, 10);
}

function getPresetRange(presetKey) {
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 3600 * 1000);
  const yyyy = kstNow.getUTCFullYear();
  const mm = kstNow.getUTCMonth();
  const dd = kstNow.getUTCDate();
  const todayStr = `${yyyy}-${String(mm + 1).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;

  const shiftDays = (days) => {
    const d = new Date(Date.UTC(yyyy, mm, dd - days));
    return d.toISOString().slice(0, 10);
  };

  switch (presetKey) {
    case "today":
      return { date_from: todayStr, date_to: todayStr };
    case "7d":
      return { date_from: shiftDays(6), date_to: todayStr };
    case "30d":
      return { date_from: shiftDays(29), date_to: todayStr };
    case "90d":
      return { date_from: shiftDays(89), date_to: todayStr };
    case "month":
      return { date_from: `${yyyy}-${String(mm + 1).padStart(2, "0")}-01`, date_to: todayStr };
    case "year":
      return { date_from: `${yyyy}-01-01`, date_to: todayStr };
    case "all":
      return { date_from: "2026-09-01", date_to: todayStr };
    default:
      return { date_from: shiftDays(29), date_to: todayStr };
  }
}

function formatDateTimeKo(isoStr) {
  if (!isoStr) return "-";
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("ko-KR", { hour12: false });
}

function ScopeBadge({ scope, count }) { // eslint-disable-line react/prop-types
  if (scope === "BOTH") {
    return <Chip size="small" color="secondary" label={`개인+단체 중복 (${count || 2})`} sx={{ fontWeight: 700 }} />;
  }
  if (scope === "GROUP") {
    return <Chip size="small" color="info" variant="outlined" label="단체" />;
  }
  return <Chip size="small" variant="outlined" label="개인" />;
}

function GeminiMetrics({ values = EMPTY_GEMINI }) { // eslint-disable-line react/prop-types
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", lg: "repeat(6, 1fr)" }, gap: 1.5 }}>
      {[
        ["호출", "call_count"],
        ["입력 토큰", "input_tokens"],
        ["출력 토큰", "output_tokens"],
        ["사고 토큰", "thought_tokens"],
        ["캐시 토큰", "cached_tokens"],
        ["전체 토큰", "total_tokens"],
      ].map(([label, key]) => (
        <Paper key={key} variant="outlined" sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>{(values[key] || 0).toLocaleString()}</Typography>
        </Paper>
      ))}
    </Box>
  );
}

function UsagePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = TAB_KEYS.includes(searchParams.get("tab")) ? searchParams.get("tab") : "overview";
  const [activeTab, setActiveTab] = useState(initialTab);

  const defaultRange = useMemo(() => getPresetRange("30d"), []);
  const [preset, setPreset] = useState("30d");
  const [dateFrom, setDateFrom] = useState(defaultRange.date_from);
  const [dateTo, setDateTo] = useState(defaultRange.date_to);
  const [granularity, setGranularity] = useState("day");
  const [excludeAdmins, setExcludeAdmins] = useState(true);

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [rollingUp, setRollingUp] = useState(false);

  // Overview state
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewChartMode, setOverviewChartMode] = useState("signups_usage");

  // Traffic state
  const [traffic, setTraffic] = useState(null);
  const [trafficLoading, setTrafficLoading] = useState(false);
  const [backfillingGeo, setBackfillingGeo] = useState(false);
  const [geoOverrideTarget, setGeoOverrideTarget] = useState(null);

  // Companies state
  const [companies, setCompanies] = useState(null);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companyQuery, setCompanyQuery] = useState("");
  const [aliasDialog, setAliasDialog] = useState({ open: false, rawLabel: "", canonicalName: "" });

  // Kkomak state
  const [kkomak, setKkomak] = useState(null);
  const [kkomakLoading, setKkomakLoading] = useState(false);

  // Segments state
  const [segment, setSegment] = useState("unused");
  const [segCompany, setSegCompany] = useState("");
  const [segScope, setSegScope] = useState("ALL");
  const [segMinDays, setSegMinDays] = useState("");
  const [segDraftQuery, setSegDraftQuery] = useState("");
  const [segQuery, setSegQuery] = useState("");
  const [segPage, setSegPage] = useState(1);
  const [segmentsData, setSegmentsData] = useState(null);
  const [segmentsLoading, setSegmentsLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [companyOptions, setCompanyOptions] = useState([]);

  // Gemini token tab state
  const [geminiUserId, setGeminiUserId] = useState("");
  const [geminiData, setGeminiData] = useState({ totals: EMPTY_GEMINI, by_date: [], by_user: [] });
  const [geminiLoading, setGeminiLoading] = useState(false);

  const handleTabChange = (_event, nextTab) => {
    setActiveTab(nextTab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", nextTab);
      return next;
    }, { replace: true });
  };

  const applyPreset = (key) => {
    setPreset(key);
    const range = getPresetRange(key);
    setDateFrom(range.date_from);
    setDateTo(range.date_to);
    if (key === "all" || key === "year") {
      setGranularity("week");
    } else if (key === "today" || key === "7d") {
      setGranularity("day");
    }
  };

  const commonParams = useMemo(
    () => ({
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      granularity,
      exclude_admins: excludeAdmins,
    }),
    [dateFrom, dateTo, granularity, excludeAdmins],
  );

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    setError("");
    try {
      setOverview(await getAnalyticsOverview(commonParams));
    } catch {
      setError("종합 대시보드 집계를 불러오지 못했습니다.");
    } finally {
      setOverviewLoading(false);
    }
  }, [commonParams]);

  const loadTraffic = useCallback(async () => {
    setTrafficLoading(true);
    setError("");
    try {
      setTraffic(
        await getAnalyticsTraffic({
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          exclude_admins: excludeAdmins,
        }),
      );
    } catch {
      setError("접속·지역·체류 통계를 불러오지 못했습니다.");
    } finally {
      setTrafficLoading(false);
    }
  }, [dateFrom, dateTo, excludeAdmins]);

  const loadCompanies = useCallback(async () => {
    setCompaniesLoading(true);
    setError("");
    try {
      const data = await getAnalyticsCompanies({
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        exclude_admins: excludeAdmins,
        q: companyQuery.trim() || undefined,
      });
      setCompanies(data);
      if (data?.items && !companyQuery.trim()) {
        setCompanyOptions(data.items.map((item) => item.canonical_company));
      }
    } catch {
      setError("회사별 통합 통계를 불러오지 못했습니다.");
    } finally {
      setCompaniesLoading(false);
    }
  }, [dateFrom, dateTo, excludeAdmins, companyQuery]);

  const loadKkomak = useCallback(async () => {
    setKkomakLoading(true);
    setError("");
    try {
      setKkomak(await getAnalyticsKkomak({ ...commonParams, limit: 30 }));
    } catch {
      setError("꼬막·기능 사용 통계를 불러오지 못했습니다.");
    } finally {
      setKkomakLoading(false);
    }
  }, [commonParams]);

  const loadSegments = useCallback(async () => {
    setSegmentsLoading(true);
    setError("");
    try {
      const data = await getAnalyticsSegments({
        segment,
        company: segCompany || undefined,
        account_scope: segScope,
        q: segQuery || undefined,
        min_days_since_signup: Number(segMinDays) > 0 ? Number(segMinDays) : 0,
        page: segPage,
        page_size: 50,
        exclude_admins: excludeAdmins,
      });
      setSegmentsData(data);
    } catch {
      setError("활성화·마케팅 대상자 목록을 불러오지 못했습니다.");
    } finally {
      setSegmentsLoading(false);
    }
  }, [segment, segCompany, segScope, segQuery, segMinDays, segPage, excludeAdmins]);

  const loadGemini = useCallback(async () => {
    setGeminiLoading(true);
    setError("");
    try {
      const params = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (geminiUserId) params.user_id = geminiUserId;
      setGeminiData(await getUsage(params));
    } catch {
      setError("Gemini 사용량을 불러오지 못했습니다.");
    } finally {
      setGeminiLoading(false);
    }
  }, [dateFrom, dateTo, geminiUserId]);

  const reloadActiveTab = useCallback(() => {
    if (activeTab === "overview") return loadOverview();
    if (activeTab === "traffic") return loadTraffic();
    if (activeTab === "companies") return loadCompanies();
    if (activeTab === "kkomak") return loadKkomak();
    if (activeTab === "segments") return loadSegments();
    if (activeTab === "gemini") return loadGemini();
    return Promise.resolve();
  }, [activeTab, loadOverview, loadTraffic, loadCompanies, loadKkomak, loadSegments, loadGemini]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (activeTab === "traffic") loadTraffic();
    if (activeTab === "companies") loadCompanies();
    if (activeTab === "kkomak") loadKkomak();
    if (activeTab === "segments") {
      loadSegments();
      if (!companyOptions.length) loadCompanies();
    }
    if (activeTab === "gemini") loadGemini();
  }, [activeTab, loadTraffic, loadCompanies, loadKkomak, loadSegments, loadGemini, companyOptions.length]);

  const handleRunRollup = async (mode) => {
    setRollingUp(true);
    setError("");
    setNotice("");
    try {
      const res = await triggerAnalyticsRollup(mode, mode === "full" ? 30 : 15);
      if (res?.skipped) {
        setNotice("이미 다른 집계 작업이 실행 중입니다. 잠시 후 새로고침해 주세요.");
      } else {
        setNotice(
          `${mode === "full" ? "전체 기간 재집계" : "최근 집계 갱신"} 완료 (${res?.duration_ms ?? 0}ms · 고유 설계사 ${res?.unique_persons ?? "-"}명)`,
        );
      }
      await loadOverview();
      if (activeTab !== "overview") await reloadActiveTab();
    } catch {
      setError("통계 집계 갱신에 실패했습니다.");
    } finally {
      setRollingUp(false);
    }
  };

  const handleBackfillGeo = async () => {
    setBackfillingGeo(true);
    setError("");
    setNotice("");
    try {
      const res = await backfillAnalyticsGeo(30);
      const geo = res?.geo || {};
      setNotice(
        `IP 지역 보강 완료: ${geo.resolved || 0}개 확인됨 (남은 미확인 IP ${geo.remaining || 0}개)`,
      );
      await loadTraffic();
    } catch {
      setError("IP 지역 보강에 실패했습니다.");
    } finally {
      setBackfillingGeo(false);
    }
  };

  const handleExport = async (format) => {
    setExporting(true);
    setError("");
    try {
      await downloadAnalyticsSegmentsExport({
        format,
        segment,
        company: segCompany || undefined,
        account_scope: segScope,
        q: segQuery || undefined,
        min_days_since_signup: Number(segMinDays) > 0 ? Number(segMinDays) : 0,
        exclude_admins: excludeAdmins,
      });
      setNotice(`${format.toUpperCase()} 파일을 다운로드했습니다.`);
    } catch {
      setError("마케팅 대상자 파일 추출에 실패했습니다.");
    } finally {
      setExporting(false);
    }
  };

  const handleCopyList = async (field) => {
    setError("");
    try {
      const full = await getAnalyticsSegments({
        segment,
        company: segCompany || undefined,
        account_scope: segScope,
        q: segQuery || undefined,
        min_days_since_signup: Number(segMinDays) > 0 ? Number(segMinDays) : 0,
        page: 1,
        page_size: 200,
        exclude_admins: excludeAdmins,
      });
      const values = (full?.items || [])
        .map((item) => (item[field] || "").trim())
        .filter(Boolean);
      const uniqueValues = Array.from(new Set(values));
      if (!uniqueValues.length) {
        setError(`복사할 ${field === "phone" ? "전화번호" : "이메일"}가 없습니다.`);
        return;
      }
      await navigator.clipboard.writeText(uniqueValues.join("\n"));
      setNotice(
        `현재 조건 대상자 ${uniqueValues.length}건의 ${field === "phone" ? "전화번호" : "이메일"}를 클립보드에 복사했습니다.`,
      );
    } catch {
      setError("클립보드 복사에 실패했습니다.");
    }
  };

  const jumpToCompanyUnused = (companyName) => {
    setSegment("unused");
    setSegCompany(companyName);
    setSegPage(1);
    handleTabChange(null, "segments");
  };

  const rollupStatus = overview?.rollup_status;
  const acctOverview = overview?.account_overview;
  const kpis = overview?.kpis;
  const signupSum = overview?.signup_summary;
  const breakdown = overview?.activation_breakdown;

  const overviewChartConfig = useMemo(() => {
    if (overviewChartMode === "signups_only") {
      return {
        series: [
          { key: "signups", label: "고유 신규 회원가입", color: "#03C75A", type: "bar" },
          { key: "account_signups", label: "전체 가입 계정수", color: "#0F172A", type: "line" },
        ],
        formatter: (v) => `${Number(v || 0).toLocaleString()}명`,
      };
    }
    if (overviewChartMode === "traffic") {
      return {
        series: [
          { key: "sessions", label: "접속 세션", color: "#1D4ED8", type: "bar" },
          { key: "active_users", label: "활성 설계사", color: "#03C75A", type: "line" },
        ],
        formatter: (v) => `${Number(v || 0).toLocaleString()}`,
      };
    }
    if (overviewChartMode === "kkomak") {
      return {
        series: [
          { key: "doc_kkomak", label: "문서 생성 꼬막", color: "#03C75A", type: "bar" },
          { key: "kkomak_used", label: "총 사용 꼬막", color: "#6B38FB", type: "line" },
        ],
        formatter: (v) => `${Number(v || 0).toLocaleString()}꼬막`,
      };
    }
    if (overviewChartMode === "dwell") {
      return {
        series: [
          { key: "avg_dwell_seconds", label: "평균 체류시간(초)", color: "#F59E0B", type: "line" },
          { key: "page_views", label: "페이지뷰", color: "#0F172A", type: "bar" },
        ],
        formatter: (v, key) => (key === "avg_dwell_seconds" ? formatDuration(v) : `${Number(v || 0).toLocaleString()}뷰`),
      };
    }
    return {
      series: [
        { key: "sessions", label: "접속 세션", color: "#3B82F6", type: "bar" },
        { key: "active_users", label: "활성 설계사", color: "#03C75A", type: "line" },
        { key: "signups", label: "신규 가입", color: "#F59E0B", type: "line" },
      ],
      formatter: (v) => `${Number(v || 0).toLocaleString()}`,
    };
  }, [overviewChartMode]);

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1480, mx: "auto" }}>
      {/* Header */}
      <Stack
        direction={{ xs: "column", lg: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", lg: "center" }}
        gap={2}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 850, letterSpacing: "-0.03em" }}>
            통계 · 분석 대시보드
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
            사전 집계(롤업) 기반으로 서버 부하 없이 일간·주간·월간 접속·체류·유사 회사명 통합·꼬막 사용량·마케팅 추출을 제공합니다.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
          <Button
            size="small"
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={reloadActiveTab}
          >
            새로고침
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<SyncRoundedIcon />}
            disabled={rollingUp}
            onClick={() => handleRunRollup("incremental")}
          >
            집계 갱신
          </Button>
          <Button
            size="small"
            variant="contained"
            disabled={rollingUp}
            onClick={() => handleRunRollup("full")}
          >
            {rollingUp ? "집계 중..." : "전체 기간 재집계"}
          </Button>
        </Stack>
      </Stack>

      {/* Rollup & Deduplication Status Strip */}
      <Paper variant="outlined" sx={{ p: 1.5, px: 2, mb: 2, borderRadius: 2.5, bgcolor: "#F8FAFC" }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          gap={1}
        >
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              color={rollupStatus?.status === "SUCCEEDED" ? "success" : "warning"}
              label={
                rollupStatus?.last_run_at
                  ? `마지막 집계: ${formatDateTimeKo(rollupStatus.last_run_at)} (${rollupStatus.last_duration_ms ?? 0}ms)`
                  : "초기 집계 대기"
              }
            />
            {rollupStatus?.last_backfill_at && (
              <Typography variant="caption" color="text.secondary">
                전체 백필: {formatDateTimeKo(rollupStatus.last_backfill_at)}
              </Typography>
            )}
          </Stack>
          {acctOverview && (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
              <Chip
                size="small"
                color="primary"
                variant="outlined"
                label={`중복 제거 고유 설계사 ${acctOverview.unique_persons.toLocaleString()}명`}
                sx={{ fontWeight: 750 }}
              />
              <Typography variant="caption" color="text.secondary">
                전체 계정 {acctOverview.total_accounts.toLocaleString()}개 (개인 {acctOverview.personal_accounts.toLocaleString()} · 단체{" "}
                {acctOverview.group_accounts.toLocaleString()} · 개인+단체 중복 {acctOverview.overlap_both_persons.toLocaleString()}명)
              </Typography>
            </Stack>
          )}
        </Stack>
      </Paper>

      {/* Global Filters */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2.5, borderRadius: 2.5 }}>
        <Stack spacing={1.5}>
          <Stack
            direction={{ xs: "column", lg: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", lg: "center" }}
            gap={1.5}
          >
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {[
                ["today", "오늘"],
                ["7d", "최근 7일"],
                ["30d", "최근 30일"],
                ["90d", "최근 90일"],
                ["month", "이번 달"],
                ["year", "올해"],
                ["all", "전체 기간"],
              ].map(([key, label]) => (
                <Chip
                  key={key}
                  label={label}
                  clickable
                  color={preset === key ? "primary" : "default"}
                  variant={preset === key ? "filled" : "outlined"}
                  onClick={() => applyPreset(key)}
                  sx={{ fontWeight: 700 }}
                />
              ))}
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={granularity}
                onChange={(_e, val) => {
                  if (val) setGranularity(val);
                }}
              >
                <ToggleButton value="day">일간</ToggleButton>
                <ToggleButton value="week">주간</ToggleButton>
                <ToggleButton value="month">월간</ToggleButton>
              </ToggleButtonGroup>

              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={excludeAdmins}
                    onChange={(e) => setExcludeAdmins(e.target.checked)}
                  />
                }
                label={<Typography variant="body2" sx={{ fontWeight: 650 }}>관리자 제외</Typography>}
              />
            </Stack>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="center">
            <TextField
              size="small"
              type="date"
              label="시작일"
              InputLabelProps={{ shrink: true }}
              value={dateFrom}
              onChange={(e) => {
                setPreset("custom");
                setDateFrom(e.target.value);
              }}
            />
            <TextField
              size="small"
              type="date"
              label="종료일"
              InputLabelProps={{ shrink: true }}
              value={dateTo}
              onChange={(e) => {
                setPreset("custom");
                setDateTo(e.target.value);
              }}
            />
            <Typography variant="caption" color="text.secondary">
              모든 일자·주간·월간 집계는 한국 시간(KST) 및 개인+단체 동일인 통합 기준입니다.
            </Typography>
          </Stack>
        </Stack>
      </Paper>

      {notice && <Alert severity="success" onClose={() => setNotice("")} sx={{ mb: 2 }}>{notice}</Alert>}
      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}

      <Paper variant="outlined" sx={{ mb: 2.5, borderRadius: 2.5, overflow: "hidden" }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 1.5, borderBottom: "1px solid var(--bojogae-line)" }}
        >
          <Tab value="overview" label="종합 개요" sx={{ fontWeight: 750 }} />
          <Tab value="traffic" label="접속 · 지역 · 체류" sx={{ fontWeight: 750 }} />
          <Tab value="companies" label="회사별 통합 분석" sx={{ fontWeight: 750 }} />
          <Tab value="kkomak" label="꼬막 · 기능 사용" sx={{ fontWeight: 750 }} />
          <Tab
            value="segments"
            label={`활성화 · 마케팅 추출${breakdown ? ` (미사용 ${breakdown.unused_persons})` : ""}`}
            sx={{ fontWeight: 750 }}
          />
          <Tab value="gemini" label="Gemini 토큰" sx={{ fontWeight: 750 }} />
        </Tabs>
      </Paper>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        overviewLoading && !overview ? (
          <Box sx={{ py: 8, display: "grid", placeItems: "center" }}><CircularProgress /></Box>
        ) : overview && (
          <Stack spacing={2.5}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)", xl: "repeat(6, 1fr)" },
                gap: 1.5,
              }}
            >
              <KpiStatCard
                title="기간 신규 회원가입"
                value={`${(kpis?.new_person_signups || 0).toLocaleString()}명`}
                delta={kpis?.new_person_signups_delta}
                badge={`계정 +${kpis?.new_account_signups || 0}`}
                subtext={`오늘 +${signupSum?.today || 0}명 · 이번주 +${signupSum?.this_week || 0}명 · 이번달 +${signupSum?.this_month || 0}명`}
                accentColor="#03C75A"
              />
              <KpiStatCard
                title="활성 설계사 (DAU / WAU / MAU)"
                value={`${kpis?.wau || 0} / ${kpis?.mau || 0}명`}
                delta={kpis?.dau_avg_delta}
                badge={`고착도 ${kpis?.stickiness_pct || 0}%`}
                subtext={`일평균 DAU ${kpis?.dau_avg || 0}명 · 기간 내 활성 ${kpis?.period_active_persons || 0}명`}
                accentColor="#1D4ED8"
              />
              <KpiStatCard
                title="접속 세션 & 평균 체류"
                value={`${(kpis?.sessions || 0).toLocaleString()}회`}
                delta={kpis?.sessions_delta}
                badge={kpis?.telemetry_sessions ? `이탈률 ${kpis.bounce_rate_pct}%` : "실시간 추적"}
                subtext={
                  kpis?.telemetry_sessions
                    ? `평균 체류 ${formatDuration(kpis.avg_dwell_seconds)} · 페이지뷰 ${kpis.page_views.toLocaleString()}`
                    : "신규 웹 접속부터 페이지뷰·체류시간이 누적됩니다"
                }
                accentColor="#0EA5E9"
              />
              <KpiStatCard
                title="기간 꼬막 사용량"
                value={`${(kpis?.kkomak_used || 0).toLocaleString()}개`}
                delta={kpis?.kkomak_used_delta}
                badge={`${(kpis?.kkomak_count || 0).toLocaleString()}회`}
                subtext={`사용자 인당 평균 ${(kpis?.kkomak_per_spender || 0).toLocaleString()}꼬막`}
                accentColor="#6B38FB"
              />
              <KpiStatCard
                title="꼬막 활성화율"
                value={`${kpis?.activation_rate_pct || 0}%`}
                badge={`전체 ${acctOverview?.unique_persons || 0}명`}
                subtext={`사용 ${kpis?.used_persons || 0}명 · 가입 후 미사용 ${kpis?.unused_persons || 0}명`}
                accentColor="#008A49"
              />
              <KpiStatCard
                title="결제 전환 & 순매출"
                value={`${(kpis?.revenue_krw || 0).toLocaleString()}원`}
                delta={kpis?.revenue_delta}
                badge={`유료 ${kpis?.paid_persons || 0}명`}
                subtext={`유료 전환율 ${kpis?.paid_conversion_pct || 0}%`}
                accentColor="#F59E0B"
              />
            </Box>

            {/* Timeseries chart */}
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
                gap={1.5}
                sx={{ mb: 2 }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {granularity === "month" ? "월간" : granularity === "week" ? "주간" : "일간"} 지표 추이
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    회원가입(고유/계정), 활성 설계사, 접속 세션, 꼬막 소진량, 체류시간을 기간 단위로 비교합니다.
                  </Typography>
                </Box>
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={overviewChartMode}
                  onChange={(_e, v) => {
                    if (v) setOverviewChartMode(v);
                  }}
                >
                  <ToggleButton value="signups_usage">종합</ToggleButton>
                  <ToggleButton value="signups_only">회원가입</ToggleButton>
                  <ToggleButton value="traffic">접속·활성</ToggleButton>
                  <ToggleButton value="kkomak">꼬막 사용</ToggleButton>
                  <ToggleButton value="dwell">체류·뷰</ToggleButton>
                </ToggleButtonGroup>
              </Stack>
              <TimeSeriesChart
                data={overview.timeseries || []}
                series={overviewChartConfig.series}
                valueFormatter={overviewChartConfig.formatter}
              />
            </Paper>

            {/* Funnel & Activation Donut */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                  설계사 활성화 퍼널 (고유 인원 기준)
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                  개인+단체 중복 계정은 동일인으로 통합하여 실제 전환율을 계산합니다.
                </Typography>
                <FunnelChart steps={overview.funnel || []} />
              </Paper>

              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      꼬막 사용 vs 무활동 비율
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      미사용자를 바로 세그먼트 추출 탭에서 연락처로 내보낼 수 있습니다.
                    </Typography>
                  </Box>
                  <Button size="small" variant="outlined" onClick={() => jumpToCompanyUnused("")}>
                    미사용 대상자 추출 →
                  </Button>
                </Stack>
                <DonutChart
                  centerValue={`${breakdown?.used_rate_pct || 0}%`}
                  centerLabel="사용 전환"
                  segments={[
                    { label: "꼬막 사용 설계사", value: breakdown?.used_persons || 0, color: "#03C75A" },
                    { label: "로그인 후 미사용", value: breakdown?.logged_in_no_usage || 0, color: "#F59E0B" },
                    { label: "가입 후 미로그인", value: breakdown?.never_logged_in || 0, color: "#94A3B8" },
                  ]}
                />
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
                  <Chip size="small" label={`1회 체험: ${breakdown?.single_use || 0}명`} variant="outlined" />
                  <Chip size="small" label={`2회+ 재사용: ${breakdown?.repeat_use || 0}명`} variant="outlined" color="success" />
                  <Chip size="small" label={`파워유저(100+): ${breakdown?.power_use || 0}명`} variant="outlined" color="primary" />
                </Stack>
              </Paper>
            </Box>

            {/* Marketing Insights */}
            {(overview.marketing_insights || []).length > 0 && (
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, bgcolor: "#F8FAFC" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.25 }}>
                  마케팅 · 운영 인사이트 요약
                </Typography>
                <Stack spacing={0.85}>
                  {overview.marketing_insights.map((line, idx) => (
                    <Typography key={idx} variant="body2" sx={{ color: "#1E293B" }}>
                      • {line}
                    </Typography>
                  ))}
                </Stack>
              </Paper>
            )}
          </Stack>
        )
      )}

      {/* TAB 2: TRAFFIC / GEO / DWELL */}
      {activeTab === "traffic" && (
        trafficLoading && !traffic ? (
          <Box sx={{ py: 8, display: "grid", placeItems: "center" }}><CircularProgress /></Box>
        ) : traffic && (
          <Stack spacing={2.5}>
            <Alert
              severity="info"
              action={
                <Button
                  size="small"
                  color="inherit"
                  variant="outlined"
                  startIcon={<PublicRoundedIcon />}
                  disabled={backfillingGeo}
                  onClick={handleBackfillGeo}
                >
                  {backfillingGeo
                    ? "보강 중..."
                    : `IP 지역 보강 (${traffic.uncached_ip_count || 0}개 미확인)`}
                </Button>
              }
            >
              지역 통계는 IP 기반 추정치로, 국내 통신사(SKB·KT·LGU+) 유동·공용 IP는 인접 거점 지역(예: 대구 → 경상북도 경주)으로 표시될 수 있습니다. 아래 <strong>주요 접속 IP</strong> 목록에서 사무실·지점 IP의 실제 지역을 수동 고정할 수 있습니다.
            </Alert>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>접속 지역 (시/도)</Typography>
                <HorizontalBarList items={traffic.regions || []} color="#03C75A" unit="회" />
              </Paper>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>접속 도시 TOP 20</Typography>
                <HorizontalBarList items={traffic.cities || []} color="#0EA5E9" unit="회" />
              </Paper>
            </Box>

            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                주요 접속 IP · 수동 지역 보정
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                지점·사무실 공용 회선이 잘못된 지역으로 잡힌 경우 &quot;지역 보정&quot;을 눌러 실제 지역을 고정할 수 있습니다.
              </Typography>
              <TableContainer sx={{ maxHeight: 380 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>IP 주소</TableCell>
                      <TableCell>현재 지역 · 도시</TableCell>
                      <TableCell>출처</TableCell>
                      <TableCell>주요 소속 회사</TableCell>
                      <TableCell>통신사 / 메모</TableCell>
                      <TableCell align="right">접속 (인원)</TableCell>
                      <TableCell align="right">보정</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(traffic.top_ips || []).map((row) => (
                      <TableRow key={row.ip_address} hover>
                        <TableCell sx={{ fontFamily: "monospace", fontWeight: 700 }}>{row.ip_address}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {row.region_name}{row.city_name && row.city_name !== row.region_name ? ` · ${row.city_name}` : ""}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            color={row.geo_source === "manual" ? "success" : row.geo_source === "private" ? "default" : "warning"}
                            variant={row.geo_source === "manual" ? "filled" : "outlined"}
                            label={row.geo_source === "manual" ? "수동 고정" : row.geo_source === "private" ? "사설망" : "자동 추정"}
                          />
                        </TableCell>
                        <TableCell>
                          {(row.top_companies || []).length > 0 ? row.top_companies.join(", ") : "-"}
                        </TableCell>
                        <TableCell sx={{ color: "text.secondary", fontSize: 12 }}>
                          {row.isp_name || "-"}
                        </TableCell>
                        <TableCell align="right">
                          {row.sessions.toLocaleString()}회 ({row.unique_users}명)
                        </TableCell>
                        <TableCell align="right">
                          <Button size="small" variant="outlined" onClick={() => setGeoOverrideTarget(row)}>
                            지역 보정
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!(traffic.top_ips || []).length && (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 3, color: "text.secondary" }}>
                          집계된 접속 IP가 없습니다.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>유입 채널 (Acquisition)</Typography>
                <HorizontalBarList
                  items={traffic.channels || []}
                  color="#6B38FB"
                  unit="회"
                  secondaryRenderer={(item) =>
                    item.avg_dwell_seconds ? `평균 체류 ${formatDuration(item.avg_dwell_seconds)}` : ""
                  }
                />
              </Paper>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>외부 유입 도메인 (Referrer)</Typography>
                <HorizontalBarList
                  items={traffic.referrers || []}
                  color="#F59E0B"
                  unit="회"
                  emptyText="아직 외부 유입 레퍼러가 없습니다. (직접/북마크 접속 위주)"
                />
              </Paper>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5 }}>기기 (Device)</Typography>
                <HorizontalBarList items={traffic.devices || []} color="#0F172A" unit="회" />
              </Paper>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5 }}>운영체제 (OS)</Typography>
                <HorizontalBarList items={traffic.os_list || []} color="#008A49" unit="회" />
              </Paper>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5 }}>브라우저</Typography>
                <HorizontalBarList items={traffic.browsers || []} color="#2563EB" unit="회" />
              </Paper>
            </Box>

            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>
                페이지별 조회수 · 평균 체류시간 · 스크롤 깊이
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>경로 (Path)</TableCell>
                      <TableCell>메뉴 그룹</TableCell>
                      <TableCell align="right">조회수</TableCell>
                      <TableCell align="right">평균 체류시간</TableCell>
                      <TableCell align="right">평균 스크롤</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(traffic.top_pages || []).map((row) => (
                      <TableRow key={row.path}>
                        <TableCell sx={{ fontWeight: 650 }}>{row.path}</TableCell>
                        <TableCell><Chip size="small" label={row.page_group || "기타"} variant="outlined" /></TableCell>
                        <TableCell align="right">{row.views.toLocaleString()}</TableCell>
                        <TableCell align="right">{formatDuration(row.avg_dwell_seconds)}</TableCell>
                        <TableCell align="right">{row.avg_scroll_pct}%</TableCell>
                      </TableRow>
                    ))}
                    {!(traffic.top_pages || []).length && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                          아직 수집된 페이지뷰가 없습니다. (실시간 페이지 방문 시 자동 누적됩니다)
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                요일 × 시간대별 접속 히트맵 (KST)
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                설계사 고객이 어느 요일·시간대에 가장 활발하게 활동하는지 확인하여 알림톡·마케팅 발송 골든타임을 파악하세요.
              </Typography>
              <ActivityHeatmap cells={traffic.heatmap || []} />
            </Paper>
          </Stack>
        )
      )}

      {/* TAB 3: COMPANIES */}
      {activeTab === "companies" && (
        companiesLoading && !companies ? (
          <Box sx={{ py: 8, display: "grid", placeItems: "center" }}><CircularProgress /></Box>
        ) : companies && (
          <Stack spacing={2.5}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", md: "center" }}
                gap={1.5}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Chip color="primary" label={`통합 회사 ${companies.summary?.total_companies || 0}곳`} />
                  <Chip variant="outlined" label={`원본 표기 변형 ${companies.summary?.raw_variant_count || 0}종 통합`} />
                  <TextField
                    size="small"
                    placeholder="회사명 또는 원본 소속 검색..."
                    value={companyQuery}
                    onChange={(e) => setCompanyQuery(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment>,
                    }}
                    sx={{ minWidth: 240 }}
                  />
                </Stack>
                <Button
                  variant="outlined"
                  startIcon={<MergeTypeRoundedIcon />}
                  onClick={() => setAliasDialog({ open: true, rawLabel: "", canonicalName: "" })}
                >
                  유사 회사 병합 관리 ({(companies.aliases || []).length})
                </Button>
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                회사별 통합 랭킹 (유사 소속명·지점명 자동 병합 + 개인·단체 중복 제거)
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                예: &quot;현대홈쇼핑 GA&quot;, &quot;현대홈쇼핑&quot;, &quot;현대홈쇼핑 강대한지점&quot;, &quot;현대홈&quot; 등은 하나의 통합 회사로 묶이며, 클릭 시 해당 표기 별칭 규칙을 추가할 수 있습니다.
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>통합 회사명 / 원본 표기</TableCell>
                      <TableCell align="right">고유 인원</TableCell>
                      <TableCell align="right">개인/단체/중복</TableCell>
                      <TableCell align="right">사용(활성화율)</TableCell>
                      <TableCell align="right">미사용</TableCell>
                      <TableCell align="right">기간 접속(평균체류)</TableCell>
                      <TableCell align="right">기간 꼬막</TableCell>
                      <TableCell align="right">누적 꼬막</TableCell>
                      <TableCell align="right">추출</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(companies.items || []).map((row) => (
                      <TableRow key={row.canonical_company} hover>
                        <TableCell sx={{ maxWidth: 360 }}>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>
                            {row.canonical_company}
                          </Typography>
                          {(row.raw_variants || []).length > 0 && (
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                              {row.raw_variants.map((v) => (
                                <Chip
                                  key={v}
                                  size="small"
                                  label={v}
                                  variant="outlined"
                                  onClick={() =>
                                    setAliasDialog({
                                      open: true,
                                      rawLabel: v,
                                      canonicalName: row.canonical_company === "미입력" ? "" : row.canonical_company,
                                    })
                                  }
                                  sx={{ height: 20, fontSize: 11, cursor: "pointer" }}
                                />
                              ))}
                            </Stack>
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 750 }}>
                          {row.total_persons.toLocaleString()}명
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="caption" color="text.secondary">
                            {row.personal_persons}/{row.group_persons}/{row.both_persons}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            size="small"
                            color={row.activation_rate_pct >= 60 ? "success" : row.activation_rate_pct >= 30 ? "warning" : "default"}
                            label={`${row.used_persons}명 (${row.activation_rate_pct}%)`}
                          />
                        </TableCell>
                        <TableCell align="right">{row.unused_persons.toLocaleString()}명</TableCell>
                        <TableCell align="right">
                          {row.period_sessions.toLocaleString()}회
                          {row.avg_dwell_seconds > 0 ? ` (${formatDuration(row.avg_dwell_seconds)})` : ""}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 750, color: "#6B38FB" }}>
                          {row.period_kkomak_used.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">{row.lifetime_kkomak_used.toLocaleString()}</TableCell>
                        <TableCell align="right">
                          {row.unused_persons > 0 && (
                            <Button
                              size="small"
                              onClick={() => jumpToCompanyUnused(row.canonical_company)}
                            >
                              미사용 보기
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Stack>
        )
      )}

      {/* TAB 4: KKOMAK USAGE */}
      {activeTab === "kkomak" && (
        kkomakLoading && !kkomak ? (
          <Box sx={{ py: 8, display: "grid", placeItems: "center" }}><CircularProgress /></Box>
        ) : kkomak && (
          <Stack spacing={2.5}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(2, 1fr)", lg: "repeat(5, 1fr)" },
                gap: 1.5,
              }}
            >
              <KpiStatCard
                title="기간 총 소진 꼬막"
                value={`${(kkomak.totals?.kkomak_used || 0).toLocaleString()}개`}
                subtext={`${(kkomak.totals?.kkomak_count || 0).toLocaleString()}건 완료`}
                accentColor="#6B38FB"
              />
              <KpiStatCard
                title="문서 생성 꼬막"
                value={`${(kkomak.totals?.doc_kkomak || 0).toLocaleString()}개`}
                subtext={`${(kkomak.totals?.doc_count || 0).toLocaleString()}건 생성`}
                accentColor="#03C75A"
              />
              <KpiStatCard
                title="팩스 발송 꼬막"
                value={`${(kkomak.totals?.fax_kkomak || 0).toLocaleString()}개`}
                subtext={`${(kkomak.totals?.fax_count || 0).toLocaleString()}건 발송`}
                accentColor="#0EA5E9"
              />
              <KpiStatCard
                title="반환(환불) 꼬막"
                value={`${(kkomak.totals?.refunded_kkomak || 0).toLocaleString()}개`}
                subtext={`${(kkomak.totals?.refunded_count || 0).toLocaleString()}건 반환`}
                accentColor="#F04452"
              />
              <KpiStatCard
                title="사용자 수 · 인당 평균"
                value={`${(kkomak.totals?.unique_spenders || 0).toLocaleString()}명`}
                subtext={`1인당 평균 ${(kkomak.totals?.avg_per_spender || 0).toLocaleString()}꼬막`}
                accentColor="#F59E0B"
              />
            </Box>

            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>
                {granularity === "month" ? "월간" : granularity === "week" ? "주간" : "일간"} 꼬막 소진 추이
              </Typography>
              <TimeSeriesChart
                data={kkomak.timeseries || []}
                series={[
                  { key: "doc_kkomak", label: "문서 생성 꼬막", color: "#03C75A", type: "bar" },
                  { key: "kkomak_used", label: "총 사용 꼬막", color: "#6B38FB", type: "line" },
                  { key: "fax_kkomak", label: "팩스 꼬막", color: "#0EA5E9", type: "line" },
                ]}
                valueFormatter={(v) => `${Number(v || 0).toLocaleString()}꼬막`}
              />
            </Paper>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.4fr 1fr" }, gap: 2 }}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>
                  가장 많이 쓴 설계사 TOP 30 (개인+단체 통합)
                </Typography>
                <TableContainer sx={{ maxHeight: 460 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>이름</TableCell>
                        <TableCell>계정</TableCell>
                        <TableCell>통합 회사</TableCell>
                        <TableCell align="right">사용 꼬막</TableCell>
                        <TableCell align="right">문서/팩스</TableCell>
                        <TableCell align="right">보유</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(kkomak.top_users || []).map((u, idx) => (
                        <TableRow key={u.person_key} hover>
                          <TableCell sx={{ fontWeight: 750 }}>{idx + 1}</TableCell>
                          <TableCell>
                            <Link
                              to={`/admin/users?userId=${u.primary_user_id}`}
                              style={{ fontWeight: 750, textDecoration: "none", color: "inherit" }}
                            >
                              {u.name || u.nickname || `#${u.primary_user_id}`}
                            </Link>
                          </TableCell>
                          <TableCell><ScopeBadge scope={u.account_scope} count={u.account_count} /></TableCell>
                          <TableCell>{u.canonical_company}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: "#6B38FB" }}>
                            {u.kkomak_used.toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            {u.doc_count} / {u.fax_count}
                          </TableCell>
                          <TableCell align="right">{u.remaining_points.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                      {!(kkomak.top_users || []).length && (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                            선택한 기간에 꼬막 사용 이력이 없습니다.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>
                  가장 많이 쓴 회사 TOP
                </Typography>
                <HorizontalBarList
                  items={(kkomak.top_companies || []).map((c) => ({
                    label: c.canonical_company,
                    sessions: c.kkomak_used,
                    share_pct: c.share_pct,
                    extra: `사용자 ${c.spenders}명 · ${c.kkomak_count}회`,
                  }))}
                  color="#6B38FB"
                  unit="꼬막"
                />
              </Paper>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.4fr 1fr" }, gap: 2 }}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>인기 보고서 · 기능 TOP 15</Typography>
                <HorizontalBarList
                  items={(kkomak.top_prompts || []).map((p) => ({
                    label: p.dim_label,
                    sessions: p.usage_count,
                    extra: `${p.kind} · ${p.kkomak_used.toLocaleString()}꼬막`,
                  }))}
                  color="#03C75A"
                  unit="회"
                />
              </Paper>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>전체 설계사 누적 소비 분포</Typography>
                <HorizontalBarList
                  items={(kkomak.usage_distribution || []).map((d) => ({
                    label: d.label,
                    sessions: d.count,
                  }))}
                  color="#F59E0B"
                  unit="명"
                />
              </Paper>
            </Box>
          </Stack>
        )
      )}

      {/* TAB 5: SEGMENTS & MARKETING EXPORT */}
      {activeTab === "segments" && (
        <Stack spacing={2.5}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "360px 1fr" }, gap: 2 }}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5 }}>
                사용 vs 미사용 비율 (전체 고유 설계사)
              </Typography>
              <DonutChart
                size={140}
                centerValue={`${segmentsData?.segment_counts?.all ? Math.round((segmentsData.segment_counts.used / segmentsData.segment_counts.all) * 100) : 0}%`}
                centerLabel="사용 비율"
                segments={[
                  { label: "꼬막 사용", value: segmentsData?.segment_counts?.used || 0, color: "#03C75A" },
                  { label: "미사용", value: segmentsData?.segment_counts?.unused || 0, color: "#F04452" },
                ]}
              />
            </Paper>

            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5 }}>
                마케팅 타겟 세그먼트 선택 (클릭하여 조회·추출)
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", xl: "repeat(4, 1fr)" }, gap: 1 }}>
                {[
                  ["unused", "가입 후 꼬막 미사용", "#F04452"],
                  ["never_logged_in", "가입 후 미로그인", "#64748B"],
                  ["logged_in_unused", "로그인 후 미사용", "#F59E0B"],
                  ["dormant_14d", "14일+ 휴면(기존사용)", "#8B5CF6"],
                  ["dormant_30d", "30일+ 휴면(기존사용)", "#EC4899"],
                  ["low_balance", "잔액 20꼬막 이하", "#0EA5E9"],
                  ["power_users", "파워유저 (100꼬막+)", "#03C75A"],
                  ["overlap_both", "개인+단체 중복", "#1D4ED8"],
                ].map(([key, label, color]) => {
                  const selected = segment === key;
                  const cnt = segmentsData?.segment_counts?.[key] ?? 0;
                  return (
                    <Paper
                      key={key}
                      variant="outlined"
                      onClick={() => {
                        setSegment(key);
                        setSegPage(1);
                      }}
                      sx={{
                        p: 1.25,
                        borderRadius: 2,
                        cursor: "pointer",
                        borderColor: selected ? color : "var(--bojogae-line)",
                        borderWidth: selected ? 2 : 1,
                        bgcolor: selected ? "rgba(3, 199, 90, 0.04)" : "#fff",
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block" }}>
                        {label}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 850, color }}>
                        {cnt.toLocaleString()}명
                      </Typography>
                    </Paper>
                  );
                })}
              </Box>
            </Paper>
          </Box>

          {/* Filter & Export toolbar */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
            <Stack spacing={1.5}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }}>
                <TextField
                  size="small"
                  select
                  label="계정 구분"
                  value={segScope}
                  onChange={(e) => {
                    setSegScope(e.target.value);
                    setSegPage(1);
                  }}
                  sx={{ minWidth: 150 }}
                >
                  <MenuItem value="ALL">전체 (개인+단체)</MenuItem>
                  <MenuItem value="PERSONAL">개인 계정만</MenuItem>
                  <MenuItem value="GROUP">단체 계정만</MenuItem>
                  <MenuItem value="BOTH">개인+단체 중복만</MenuItem>
                </TextField>

                <TextField
                  size="small"
                  select
                  label="통합 회사"
                  value={segCompany}
                  onChange={(e) => {
                    setSegCompany(e.target.value);
                    setSegPage(1);
                  }}
                  sx={{ minWidth: 200 }}
                >
                  <MenuItem value="">전체 회사</MenuItem>
                  {companyOptions.map((c) => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </TextField>

                <TextField
                  size="small"
                  type="number"
                  label="가입 최소 경과(일)"
                  value={segMinDays}
                  onChange={(e) => {
                    setSegMinDays(e.target.value);
                    setSegPage(1);
                  }}
                  sx={{ width: 150 }}
                />

                <Stack
                  component="form"
                  direction="row"
                  spacing={1}
                  sx={{ flex: 1 }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSegQuery(segDraftQuery.trim());
                    setSegPage(1);
                  }}
                >
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="이름, 이메일, 전화번호, 소속 검색"
                    value={segDraftQuery}
                    onChange={(e) => setSegDraftQuery(e.target.value)}
                  />
                  <Button type="submit" variant="outlined">검색</Button>
                </Stack>
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  조회 결과: <strong>{(segmentsData?.total || 0).toLocaleString()}명</strong> (동일 이메일·전화번호 개인/단체 계정 중복 제거됨)
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ContentCopyRoundedIcon />}
                    onClick={() => handleCopyList("phone")}
                  >
                    전화번호 복사
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ContentCopyRoundedIcon />}
                    onClick={() => handleCopyList("email")}
                  >
                    이메일 복사
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DownloadRoundedIcon />}
                    disabled={exporting}
                    onClick={() => handleExport("csv")}
                  >
                    CSV 추출
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<DownloadRoundedIcon />}
                    disabled={exporting}
                    onClick={() => handleExport("xlsx")}
                  >
                    {exporting ? "추출 중..." : "엑셀(.xlsx) 추출"}
                  </Button>
                </Stack>
              </Stack>
            </Stack>
          </Paper>

          {/* Table */}
          <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: "hidden" }}>
            {segmentsLoading ? (
              <Box sx={{ py: 6, display: "grid", placeItems: "center" }}><CircularProgress /></Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>이름 / 닉네임</TableCell>
                      <TableCell>계정구분</TableCell>
                      <TableCell>통합 회사 (원본 소속)</TableCell>
                      <TableCell>전화번호</TableCell>
                      <TableCell>이메일</TableCell>
                      <TableCell align="right">가입일 (경과)</TableCell>
                      <TableCell align="right">최근 로그인</TableCell>
                      <TableCell align="right">사용 / 보유 꼬막</TableCell>
                      <TableCell align="right">관리</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(segmentsData?.items || []).map((row) => (
                      <TableRow key={row.person_key} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 750 }}>
                            {row.name || "-"}
                          </Typography>
                          {row.nickname && row.nickname !== row.name && (
                            <Typography variant="caption" color="text.secondary">
                              {row.nickname}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <ScopeBadge scope={row.account_scope} count={row.account_count} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 650 }}>
                            {row.canonical_company}
                          </Typography>
                          {row.raw_affiliation && row.raw_affiliation !== row.canonical_company && (
                            <Typography variant="caption" color="text.secondary">
                              {row.raw_affiliation}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{row.phone || "-"}</TableCell>
                        <TableCell>{row.email || "-"}</TableCell>
                        <TableCell align="right">
                          {row.first_signup_at ? formatKstDate(new Date(row.first_signup_at)) : "-"}
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            D+{row.days_since_signup ?? 0}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {row.last_login_at ? formatKstDate(new Date(row.last_login_at)) : "미로그인"}
                        </TableCell>
                        <TableCell align="right">
                          {row.total_kkomak_used.toLocaleString()} / {row.remaining_points.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            component={Link}
                            to={`/admin/users?userId=${row.primary_user_id}`}
                            size="small"
                          >
                            상세
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!(segmentsData?.items || []).length && (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 4, color: "text.secondary" }}>
                          조건에 해당하는 설계사가 없습니다.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            {(segmentsData?.total_pages || 1) > 1 && (
              <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
                <Pagination
                  count={segmentsData.total_pages}
                  page={segPage}
                  onChange={(_e, val) => setSegPage(val)}
                  color="primary"
                />
              </Box>
            )}
          </Paper>
        </Stack>
      )}

      {/* TAB 6: GEMINI TOKENS */}
      {activeTab === "gemini" && (
        <Stack spacing={2}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
            <Stack direction={{ xs: "column", sm: "row" }} gap={2} alignItems="center">
              <TextField
                size="small"
                type="number"
                label="사용자 ID 필터"
                value={geminiUserId}
                onChange={(e) => setGeminiUserId(e.target.value)}
              />
              <Button variant="contained" onClick={loadGemini} disabled={geminiLoading}>
                조회
              </Button>
            </Stack>
          </Paper>
          <GeminiMetrics values={geminiData.totals} />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 750, mb: 1 }}>일자별</Typography>
              {geminiData.by_date.map((row) => (
                <Typography key={row.date} variant="body2" sx={{ py: 0.75 }}>
                  {row.date} · 호출 {row.call_count} · 토큰 {row.total_tokens.toLocaleString()}
                </Typography>
              ))}
              {!geminiData.by_date.length && <Typography color="text.secondary">기록 없음</Typography>}
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 750, mb: 1 }}>사용자별</Typography>
              {geminiData.by_user.map((row) => (
                <Typography key={row.user_id} variant="body2" sx={{ py: 0.75 }}>
                  {row.user_display_name} · 호출 {row.call_count} · 토큰 {row.total_tokens.toLocaleString()}
                </Typography>
              ))}
              {!geminiData.by_user.length && <Typography color="text.secondary">기록 없음</Typography>}
            </Paper>
          </Box>
        </Stack>
      )}

      <CompanyAliasDialog
        open={aliasDialog.open}
        onClose={() => setAliasDialog({ open: false, rawLabel: "", canonicalName: "" })}
        aliases={companies?.aliases || []}
        initialRawLabel={aliasDialog.rawLabel}
        initialCanonicalName={aliasDialog.canonicalName}
        onChanged={() => {
          loadCompanies();
          loadOverview();
          if (activeTab === "kkomak") loadKkomak();
          if (activeTab === "segments") loadSegments();
        }}
      />

      <IpGeoOverrideDialog
        open={Boolean(geoOverrideTarget)}
        onClose={() => setGeoOverrideTarget(null)}
        ipEntry={geoOverrideTarget}
        onChanged={() => {
          loadTraffic();
          loadOverview();
        }}
      />
    </Box>
  );
}

export default UsagePage;
