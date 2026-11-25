import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
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
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { useEffect, useState } from "react";
import AdminEmailSettings from "./AdminEmailSettings";
import AdminSettingsAudit from "./AdminSettingsAudit";
import MaintenanceSettings from "./MaintenanceSettings";
import UserMenuSettings from "./UserMenuSettings";

import {
  getPromptPointCosts,
  getProposalSettings,
  updatePromptPointCost,
  updateProposalSettings,
} from "@/services/proposal-service";

const FIELDS = [
  ["max_output_tokens", "최대 출력 토큰", 1, 65536],
  ["max_pdf_bytes", "파일당 최대 바이트", 1, 104857600],
  ["max_active_jobs_per_user", "사용자당 활성 작업", 1, 100],
  ["max_global_running_jobs", "전체 동시 생성", 1, 100],
];

const SETTING_TABS = [
  { key: "user-menu", label: "좌측 메뉴 관리" },
  { key: "proposal", label: "AI · 생성 제한" },
  { key: "point-costs", label: "문서별 꼬막 · 혜택" },
  { key: "operations", label: "서비스 점검 · 알림" },
  { key: "audit", label: "설정 변경 이력" },
];

function readInitialTab() {
  if (typeof window === "undefined") return "user-menu";
  const tab = new URLSearchParams(window.location.search).get("tab");
  return SETTING_TABS.some((item) => item.key === tab) ? tab : "user-menu";
}

function formatBytesHelper(key, value) {
  if (key !== "max_pdf_bytes") return undefined;
  const mb = Number(value) / (1024 * 1024);
  return Number.isFinite(mb) && mb > 0 ? `약 ${mb.toFixed(1)} MB` : undefined;
}

function ProposalSettingsPage() {
  const [activeTab, setActiveTab] = useState(readInitialTab);
  const [values, setValues] = useState(null);
  const [proposalLoading, setProposalLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const [promptCosts, setPromptCosts] = useState([]);
  const [costDrafts, setCostDrafts] = useState({});
  const [workingPromptId, setWorkingPromptId] = useState(null);
  const [promptSearch, setPromptSearch] = useState("");
  const [onlyModifiedCosts, setOnlyModifiedCosts] = useState(false);

  useEffect(() => {
    Promise.all([getProposalSettings(), getPromptPointCosts()])
      .then(([settings, costs]) => {
        setValues(settings);
        setPromptCosts(costs);
        setCostDrafts(Object.fromEntries(costs.map((item) => [item.prompt_id, item.point_cost])));
      })
      .catch(() => setError("설정을 불러오지 못했습니다."))
      .finally(() => setProposalLoading(false));
  }, []);

  const handleTabChange = (_, nextTab) => {
    setActiveTab(nextTab);
    setError("");
    setMessage("");
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", nextTab);
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }
  };

  const save = async () => {
    setWorking(true);
    setError("");
    setMessage("");
    try {
      const payload = { ...values };
      delete payload.updated_at;
      delete payload.updated_by;
      delete payload.llm_models;
      FIELDS.forEach(([key]) => { payload[key] = Number(payload[key]); });
      setValues(await updateProposalSettings(payload));
      setMessage("설정을 저장했습니다. 새 작업부터 적용됩니다.");
    } catch {
      setError("설정값을 확인해 주세요.");
    } finally {
      setWorking(false);
    }
  };

  const savePromptCost = async (promptId) => {
    setWorkingPromptId(promptId);
    setError("");
    setMessage("");
    try {
      const saved = await updatePromptPointCost(promptId, costDrafts[promptId]);
      setPromptCosts((current) => current.map((item) => (
        item.prompt_id === promptId ? saved : item
      )));
      setCostDrafts((current) => ({ ...current, [promptId]: saved.point_cost }));
      setMessage("문서별 꼬막을 저장했습니다. 새 작업부터 적용됩니다.");
    } catch {
      setError("문서별 꼬막은 1 이상의 정수여야 합니다.");
    } finally {
      setWorkingPromptId(null);
    }
  };

  const normalizedQuery = promptSearch.trim().toLowerCase();
  const filteredPromptCosts = promptCosts.filter((item) => {
    const matchesSearch = !normalizedQuery || (item.prompt_title || "").toLowerCase().includes(normalizedQuery);
    const isModified = Number(costDrafts[item.prompt_id] ?? item.point_cost) !== Number(item.point_cost);
    return matchesSearch && (!onlyModifiedCosts || isModified);
  });

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1140, mx: "auto" }}>
      <Typography variant="h4" sx={{ fontWeight: 800 }}>설정 및 서식</Typography>
      <Typography color="text.secondary" sx={{ mb: 2.5 }}>
        유저 좌측 메뉴, AI 생성 제한, 문서별 소진 꼬막, 서비스 점검 및 운영 알림을 항목별로 관리합니다.
      </Typography>

      <Paper variant="outlined" sx={{ borderRadius: 3, mb: 3, px: 1.5, bgcolor: "#FFFFFF" }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="설정 카테고리 탭"
          sx={{
            "& .MuiTab-root": { minHeight: 50, fontWeight: 750, fontSize: 14 },
          }}
        >
          {SETTING_TABS.map((tab) => (
            <Tab key={tab.key} value={tab.key} label={tab.label} />
          ))}
        </Tabs>
      </Paper>

      {activeTab !== "user-menu" && error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {activeTab !== "user-menu" && message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

      {activeTab === "user-menu" && <UserMenuSettings />}

      {activeTab === "proposal" && (
        proposalLoading ? (
          <Paper variant="outlined" sx={{ p: 4, borderRadius: 3 }}>
            <Typography color="text.secondary">AI 및 생성 제한 설정을 불러오는 중...</Typography>
          </Paper>
        ) : !values ? (
          <Alert severity="error">AI 및 생성 제한 설정을 불러오지 못했습니다.</Alert>
        ) : (
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="h6" fontWeight={800}>AI 모델 · 동시 생성 제한</Typography>
                <Typography variant="body2" color="text.secondary">
                  제한과 모델 설정은 서버가 검증하며 작업 생성 시점에 고정됩니다.
                </Typography>
              </Box>
              <Alert severity="info">입력 자료 개수는 프롬프트의 입력 UI 설정에서 변경합니다. 기본값은 10개입니다.</Alert>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <TextField
                  select
                  label="LLM 모델"
                  value={values.llm_model}
                  onChange={(event) => setValues({ ...values, llm_model: event.target.value })}
                >
                  {values.llm_models.map((model) => (
                    <MenuItem key={model.id} value={model.id}>{model.label}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Thinking level"
                  value={values.thinking_level}
                  onChange={(event) => setValues({ ...values, thinking_level: event.target.value })}
                >
                  {["minimal", "low", "medium", "high"].map((level) => (
                    <MenuItem key={level} value={level}>{level}</MenuItem>
                  ))}
                </TextField>
                {FIELDS.map(([key, label, min, max]) => (
                  <TextField
                    key={key}
                    type="number"
                    label={label}
                    value={values[key]}
                    helperText={formatBytesHelper(key, values[key])}
                    inputProps={{ min, max }}
                    onChange={(event) => setValues({ ...values, [key]: event.target.value })}
                  />
                ))}
              </Box>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={1}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={750}>간소화 버전 기능 제공</Typography>
                    <Typography variant="caption" color="text.secondary">
                      끄면 간소화 템플릿이 있는 모든 보고서에서 간소화 미리보기와 생성 선택지를 숨깁니다.
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        color="success"
                        checked={Boolean(values.simple_report_enabled ?? true)}
                        onChange={(event) => setValues({ ...values, simple_report_enabled: event.target.checked })}
                      />
                    }
                    label={values.simple_report_enabled !== false ? "켜짐" : "꺼짐"}
                    sx={{ mr: 0 }}
                  />
                </Stack>
              </Paper>
              <Stack direction="row" justifyContent="flex-end">
                <Button variant="contained" onClick={save} disabled={working}>
                  {working ? "저장 중..." : "설정 저장"}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )
      )}

      {activeTab === "point-costs" && (
        <Stack spacing={3}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
            <Stack spacing={1.5}>
              <Typography variant="h6" fontWeight={800}>개인 무료체험 꼬막</Typography>
              <Typography variant="body2" color="text.secondary">
                FREE 가입자에게 계정 승인 시 200꼬막을 최초 1회 지급합니다. 지급일부터 30일간 사용할 수 있으며 월별 리셋이나 재지급은 없습니다.
              </Typography>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
            <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                gap={1}
              >
                <Box>
                  <Typography variant="h6" fontWeight={800}>문서별 소진 꼬막</Typography>
                  <Typography variant="body2" color="text.secondary">
                    프롬프트를 이용해 문서 한 건을 생성할 때 예약되는 꼬막입니다.
                  </Typography>
                </Box>
                <Chip size="small" label={`총 ${promptCosts.length}종`} />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="프롬프트 이름 검색"
                  value={promptSearch}
                  onChange={(event) => setPromptSearch(event.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
                <FormControlLabel
                  sx={{ whiteSpace: "nowrap", m: 0 }}
                  control={
                    <Switch
                      size="small"
                      checked={onlyModifiedCosts}
                      onChange={(_, checked) => setOnlyModifiedCosts(checked)}
                    />
                  }
                  label="변경된 항목만 보기"
                />
              </Stack>

              {proposalLoading ? (
                <Typography color="text.secondary">문서별 소진 꼬막을 불러오는 중...</Typography>
              ) : (
                <Stack divider={<Divider flexItem />}>
                  {filteredPromptCosts.map((item) => {
                    const draftValue = costDrafts[item.prompt_id] ?? item.point_cost;
                    const changed = Number(draftValue) !== Number(item.point_cost);
                    return (
                      <Stack
                        key={item.prompt_id}
                        direction={{ xs: "column", sm: "row" }}
                        alignItems={{ xs: "stretch", sm: "center" }}
                        justifyContent="space-between"
                        gap={2}
                        sx={{ py: 1.5 }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography fontWeight={650}>{item.prompt_title}</Typography>
                          {changed && <Chip size="small" color="warning" label="수정됨" />}
                        </Stack>
                        <Stack direction="row" spacing={1}>
                          <TextField
                            size="small"
                            type="number"
                            label="꼬막"
                            value={draftValue}
                            inputProps={{ min: 1 }}
                            onChange={(event) => setCostDrafts((current) => ({
                              ...current,
                              [item.prompt_id]: event.target.value,
                            }))}
                            sx={{ width: 130 }}
                          />
                          <Button
                            variant={changed ? "contained" : "outlined"}
                            disabled={workingPromptId === item.prompt_id}
                            onClick={() => savePromptCost(item.prompt_id)}
                          >
                            저장
                          </Button>
                        </Stack>
                      </Stack>
                    );
                  })}
                  {!filteredPromptCosts.length && (
                    <Typography color="text.secondary" sx={{ py: 2 }}>
                      {promptCosts.length ? "조건에 맞는 프롬프트가 없습니다." : "등록된 프롬프트가 없습니다."}
                    </Typography>
                  )}
                </Stack>
              )}
            </Stack>
          </Paper>
        </Stack>
      )}

      {activeTab === "operations" && (
        <Stack spacing={0}>
          <MaintenanceSettings />
          <AdminEmailSettings />
        </Stack>
      )}

      {activeTab === "audit" && <AdminSettingsAudit autoLoad />}
    </Box>
  );
}

export default ProposalSettingsPage;
