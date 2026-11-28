/* eslint-disable react/prop-types */
import { useState } from "react";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { extractTaxError } from "@/services/tax-service";

const JOB_STATUS_COLOR = {
  PENDING_AUTH: "warning",
  RUNNING: "info",
  COMPLETED: "success",
  FAILED: "error",
  CANCELLED: "default",
};

const SOURCE_GUIDES = [
  {
    key: "hometax",
    title: "1. 국세청 홈택스",
    path: "조회/발급 > 현금영수증·신용카드 > 소비내역(또는 사업용카드) > 엑셀 내려받기",
    description: "연간·월별 카드/현금영수증 내역을 한 번에 내려받을 수 있습니다.",
    url: "https://www.hometax.go.kr",
    icon: AccountBalanceOutlinedIcon,
    color: "#006E43",
    bg: "#ECFDF5",
  },
  {
    key: "card",
    title: "2. 카드사 앱·웹",
    path: "신한·삼성·현대·KB·롯데·우리·하나·농협 > 세금신고용 이용내역 엑셀/CSV",
    description: "월 1회 카드사 이용내역 파일을 올리면 컬럼을 자동 인식합니다.",
    icon: CreditCardOutlinedIcon,
    color: "#2563EB",
    bg: "#EAF3FF",
  },
  {
    key: "bank",
    title: "3. 은행 인터넷뱅킹",
    path: "주거래 은행 > 거래내역 조회 > 엑셀 저장 (.xlsx / .xls / .csv)",
    description: "입금(수당)·출금(경비) 내역을 자동으로 구분해 장부에 적재합니다.",
    icon: AccountBalanceOutlinedIcon,
    color: "#6B38FB",
    bg: "#F3EEFF",
  },
];

const SUPPORTED_EXT_RE = /\.(xlsx|xls|csv|tsv)$/i;

function AgentFileUploadView({
  apiClient,
  profiles,
  jobs,
  onReload,
  onNotify,
  onGoWithholding,
}) {
  const [profileId, setProfileId] = useState(profiles[0]?.id || "");
  const [uploadDirection, setUploadDirection] = useState("EXPENSE");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  const activeProfileId = profileId || profiles[0]?.id || "";
  const fileJobs = jobs.filter((j) => j.job_type === "FILE_IMPORT");

  const appendFiles = (fileList) => {
    const incoming = Array.from(fileList || []).filter((file) => SUPPORTED_EXT_RE.test(file.name));
    if (incoming.length === 0) {
      onNotify("warning", ".xlsx, .xls, .csv, .tsv 형식의 엑셀·CSV 파일만 업로드할 수 있습니다.");
      return;
    }
    setSelectedFiles((prev) => {
      const seen = new Set(prev.map((f) => `${f.name}:${f.size}`));
      const next = [...prev];
      for (const file of incoming) {
        const sig = `${file.name}:${file.size}`;
        if (!seen.has(sig)) {
          seen.add(sig);
          next.push(file);
        }
      }
      return next;
    });
  };

  const handleUploadAll = async () => {
    if (selectedFiles.length === 0) return;
    setBusy(true);
    let totalImported = 0;
    let totalSkipped = 0;
    const failed = [];
    try {
      for (const file of selectedFiles) {
        try {
          const res = await apiClient.importSpreadsheet(file, activeProfileId, uploadDirection);
          totalImported += Number(res.imported_count || 0);
          totalSkipped += Number(res.skipped_duplicate_count || 0);
        } catch (err) {
          failed.push(`${file.name}: ${extractTaxError(err)}`);
        }
      }
      if (failed.length === 0) {
        onNotify(
          "success",
          `${selectedFiles.length}개 파일 업로드 완료 — 신규 ${totalImported}건 적재 (중복 ${totalSkipped}건 자동 제외)`,
        );
        setSelectedFiles([]);
      } else {
        onNotify(
          "warning",
          `신규 ${totalImported}건 적재, 일부 파일 오류: ${failed[0]}`,
        );
      }
      await onReload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: "#fff" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ sm: "center" }}
          spacing={1.5}
          mb={2}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight={800}>
              어디서 파일을 받나요? (별도 프로그램 설치 없음)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              홈택스·카드사·은행에서 내려받은 엑셀이나 CSV를 아래에 끌어다 놓으면 중복 없이 자동으로 정리됩니다.
            </Typography>
          </Box>
          {onGoWithholding && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<PictureAsPdfOutlinedIcon />}
              onClick={onGoWithholding}
              sx={{ flexShrink: 0 }}
            >
              원천징수영수증 PDF 올리기
            </Button>
          )}
        </Stack>

        <Grid container spacing={1.5}>
          {SOURCE_GUIDES.map((guide) => {
            const Icon = guide.icon;
            return (
              <Grid item xs={12} md={4} key={guide.key}>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, borderRadius: 2.5, height: "100%", bgcolor: "#F8FAFC" }}
                >
                  <Stack spacing={1} height="100%">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box
                        sx={{
                          width: 30,
                          height: 30,
                          borderRadius: 1.5,
                          bgcolor: guide.bg,
                          color: guide.color,
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon sx={{ fontSize: 17 }} />
                      </Box>
                      <Typography variant="subtitle2" fontWeight={800}>
                        {guide.title}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#0F172A" }}>
                      {guide.path}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
                      {guide.description}
                    </Typography>
                    {guide.url && (
                      <Box>
                        <Button
                          size="small"
                          variant="text"
                          endIcon={<OpenInNewRoundedIcon sx={{ fontSize: 14 }} />}
                          href={guide.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ px: 0, fontWeight: 700, color: "#006E43" }}
                        >
                          홈택스 바로 열기
                        </Button>
                      </Box>
                    )}
                  </Stack>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: "#fff" }}>
        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="적재 대상 사업장"
                value={activeProfileId}
                onChange={(e) => setProfileId(e.target.value)}
              >
                {profiles.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.business_name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="기본 거래 구분 (입금/출금 컬럼이 분리된 은행 파일은 자동 판별)"
                value={uploadDirection}
                onChange={(e) => setUploadDirection(e.target.value)}
              >
                <MenuItem value="EXPENSE">지출·카드 이용내역</MenuItem>
                <MenuItem value="INCOME">수입·입금 내역</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <Box
            component="label"
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              appendFiles(e.dataTransfer?.files);
            }}
            sx={{
              display: "block",
              p: { xs: 3, sm: 4 },
              borderRadius: 3,
              border: "2px dashed",
              borderColor: dragging ? "#03C75A" : "#CBD5E1",
              bgcolor: dragging ? "#ECFDF5" : "#F8FAFC",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 140ms ease",
              "&:hover": { borderColor: "#03C75A", bgcolor: "#F0FDF4" },
            }}
          >
            <input
              hidden
              multiple
              type="file"
              accept=".xlsx,.xls,.csv,.tsv"
              onChange={(e) => {
                appendFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <CloudUploadOutlinedIcon sx={{ fontSize: 38, color: "#03C75A", mb: 1 }} />
            <Typography variant="subtitle1" fontWeight={800} color="#0F172A">
              여기에 엑셀(.xlsx, .xls) 또는 CSV 파일을 끌어다 놓거나 클릭해 선택하세요
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              여러 카드사·은행 파일을 한꺼번에 선택해도 중복 거래는 자동으로 걸러집니다.
            </Typography>
          </Box>

          {selectedFiles.length > 0 && (
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {selectedFiles.map((file, idx) => (
                  <Chip
                    key={`${file.name}-${idx}`}
                    label={`${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB)`}
                    onDelete={() =>
                      setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))
                    }
                  />
                ))}
              </Stack>
              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="contained"
                  disabled={busy}
                  onClick={handleUploadAll}
                  sx={{ bgcolor: "#03C75A", "&:hover": { bgcolor: "#008A60" } }}
                >
                  {busy ? "업로드 및 AI 분류 중..." : `${selectedFiles.length}개 파일 장부에 반영하기`}
                </Button>
                <Button
                  variant="text"
                  color="inherit"
                  disabled={busy}
                  onClick={() => setSelectedFiles([])}
                >
                  선택 비우기
                </Button>
              </Stack>
            </Stack>
          )}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: "#fff" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Typography variant="subtitle2" fontWeight={800}>
            최근 파일 업로드 내역
          </Typography>
          <Button size="small" startIcon={<RefreshRoundedIcon />} onClick={onReload}>
            새로고침
          </Button>
        </Stack>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>파일명</TableCell>
              <TableCell>사업장</TableCell>
              <TableCell>거래 기간</TableCell>
              <TableCell>상태</TableCell>
              <TableCell align="right">신규 적재 / 중복 제외</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fileJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3, color: "text.secondary" }}>
                  아직 업로드한 엑셀·CSV 파일이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              fileJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell sx={{ fontWeight: 700 }}>
                    {job.meta?.filename || `파일 업로드 #${job.id}`}
                  </TableCell>
                  <TableCell>{job.business_name}</TableCell>
                  <TableCell>{`${job.period_start} ~ ${job.period_end}`}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={job.status === "COMPLETED" ? "완료" : job.status}
                      color={JOB_STATUS_COLOR[job.status] || "default"}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {job.imported_count}건 / {job.skipped_duplicate_count}건
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  );
}

export default function TaxHometaxPanel({
  mode = "AGENT",
  apiClient,
  profiles = [],
  jobs = [],
  onReload,
  onNotify,
  onGoWithholding,
}) {
  const [profileId, setProfileId] = useState(profiles[0]?.id || "");
  const [busy, setBusy] = useState(false);
  const [uploadDirection, setUploadDirection] = useState("EXPENSE");
  const [selectedFile, setSelectedFile] = useState(null);

  if (mode === "AGENT") {
    return (
      <AgentFileUploadView
        apiClient={apiClient}
        profiles={profiles}
        jobs={jobs}
        onReload={onReload}
        onNotify={onNotify}
        onGoWithholding={onGoWithholding}
      />
    );
  }

  const activeProfileId = profileId || profiles[0]?.id || "";
  const uploadAndSyncJobs = jobs.filter((j) => j.job_type === "FILE_IMPORT" || j.job_type === "PG_SYNC");

  const handleSpreadsheetUpload = async () => {
    if (!selectedFile) return;
    setBusy(true);
    try {
      const res = await apiClient.importSpreadsheet(selectedFile, activeProfileId, uploadDirection);
      onNotify(
        "success",
        `파일 적재 완료: 신규 ${res.imported_count}건 (중복 건너뜀 ${res.skipped_duplicate_count}건)`,
      );
      setSelectedFile(null);
      await onReload();
    } catch (err) {
      onNotify("error", extractTaxError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: "#fff" }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" fontWeight={800}>
            마음 AI 매출·매입 엑셀/CSV 파일 업로드
          </Typography>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            홈택스(사업용 신용카드·전자세금계산서), 카드사 이용내역, 해외 AI API·서버 인보이스 엑셀(<code>.xlsx</code>,{" "}
            <code>.xls</code>) 또는 <code>.csv</code>(UTF-8/CP949)를 올리면 컬럼을 자동 매핑합니다.
          </Alert>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="적재 대상 사업장"
                value={activeProfileId}
                onChange={(e) => setProfileId(e.target.value)}
              >
                {profiles.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.business_name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="기본 거래 구분"
                value={uploadDirection}
                onChange={(e) => setUploadDirection(e.target.value)}
              >
                <MenuItem value="EXPENSE">지출·매입 내역 (카드/경비)</MenuItem>
                <MenuItem value="INCOME">수입·매출 내역 (입금/세금계산서)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={5}>
              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                <Button variant="outlined" component="label" startIcon={<CloudUploadOutlinedIcon />}>
                  {selectedFile ? selectedFile.name : "엑셀/CSV 파일 선택"}
                  <input
                    hidden
                    type="file"
                    accept=".xlsx,.xls,.csv,.tsv"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                </Button>
                <Button
                  variant="contained"
                  disabled={!selectedFile || busy}
                  onClick={handleSpreadsheetUpload}
                  sx={{ bgcolor: "#03C75A", "&:hover": { bgcolor: "#008A60" } }}
                >
                  자동 매핑 업로드
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: "#fff" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Typography variant="subtitle2" fontWeight={800}>
            최근 파일 업로드 · PG 동기화 이력
          </Typography>
          <Button size="small" startIcon={<RefreshRoundedIcon />} onClick={onReload}>
            새로고침
          </Button>
        </Stack>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>작업 유형 / 파일명</TableCell>
              <TableCell>사업장</TableCell>
              <TableCell>거래 기간</TableCell>
              <TableCell>상태</TableCell>
              <TableCell align="right">신규 적재 / 중복 제외</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {uploadAndSyncJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3, color: "text.secondary" }}>
                  아직 업로드한 파일이나 PG 동기화 이력이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              uploadAndSyncJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell sx={{ fontWeight: 700 }}>
                    {job.meta?.filename || (job.job_type === "PG_SYNC" ? "PG 결제 자동 동기화" : `파일 업로드 #${job.id}`)}
                  </TableCell>
                  <TableCell>{job.business_name}</TableCell>
                  <TableCell>{`${job.period_start} ~ ${job.period_end}`}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={job.status === "COMPLETED" ? "완료" : job.status}
                      color={JOB_STATUS_COLOR[job.status] || "default"}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {job.imported_count}건 / {job.skipped_duplicate_count}건
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  );
}
