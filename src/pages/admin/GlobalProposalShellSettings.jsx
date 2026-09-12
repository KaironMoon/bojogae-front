import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  activateProposalShellVersion,
  createProposalShellVersion,
  deleteProposalShellVersion,
  getCurrentProposalShell,
  getProposalShellVersions,
  proposalShellDownloadUrl,
  recoverProposalShellVersion,
  validateProposalShell,
} from "@/services/proposal-service";


const MAX_SHELL_BYTES = 500_000;

const SHELL_ERROR_MESSAGES = {
  active_shell_missing: "등록된 활성 껍데기가 없습니다.",
  content_slot_must_exist_once: "콘텐츠 슬롯은 사용하는 경우 한 번만 포함할 수 있습니다.",
  report_content_missing: "껍데기에 id=\"reportContent\" 영역이 필요합니다.",
  shell_content_unchanged: "동일한 내용의 껍데기 버전이 이미 존재합니다.",
};

function messageFor(error, fallback) {
  return SHELL_ERROR_MESSAGES[error.response?.data?.detail] || fallback;
}

function isHtmlFile(file) {
  return /\.html?$/i.test(file?.name || "");
}

function GlobalProposalShellSettings() {
  const [current, setCurrent] = useState(null);
  const [versions, setVersions] = useState([]);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [file, setFile] = useState(null);
  const [changeNote, setChangeNote] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const chooseFile = useCallback((files) => {
    const candidates = Array.from(files || []);
    setMessage("");
    if (candidates.length !== 1) {
      setFile(null);
      setError("HTML 파일을 한 개만 선택해 주세요.");
      return;
    }
    const selected = candidates[0];
    if (!isHtmlFile(selected)) {
      setFile(null);
      setError(".html 또는 .htm 파일만 사용할 수 있습니다.");
      return;
    }
    if (selected.size > MAX_SHELL_BYTES) {
      setFile(null);
      setError("껍데기 HTML 파일은 500KB 이하여야 합니다.");
      return;
    }
    setError("");
    setFile(selected);
  }, []);

  const dropFile = (event) => {
    event.preventDefault();
    setDragging(false);
    if (!working) chooseFile(event.dataTransfer.files);
  };

  const load = useCallback(async () => {
    const [activeResult, versionResult] = await Promise.allSettled([
      getCurrentProposalShell(),
      getProposalShellVersions(includeDeleted),
    ]);
    if (activeResult.status === "fulfilled") {
      setCurrent(activeResult.value);
    } else if (activeResult.reason?.response?.status === 404) {
      setCurrent(null);
    } else {
      throw activeResult.reason;
    }
    if (versionResult.status === "rejected") throw versionResult.reason;
    setVersions(versionResult.value);
  }, [includeDeleted]);

  useEffect(() => {
    load().catch(() => setError("공통 껍데기 정보를 불러오지 못했습니다."));
  }, [load]);

  const save = async () => {
    if (!file) {
      setError("저장할 HTML 파일을 선택해 주세요.");
      return;
    }
    setWorking(true);
    setError("");
    setMessage("");
    try {
      const html = await file.text();
      await validateProposalShell({ filename: file.name, html, changeNote });
      const saved = await createProposalShellVersion({
        filename: file.name,
        html,
        changeNote,
        activate: true,
      });
      setFile(null);
      setChangeNote("");
      setMessage(`공통 껍데기 v${saved.version_no}을 저장하고 활성화했습니다.`);
      await load();
    } catch (requestError) {
      setError(messageFor(requestError, "껍데기 파일을 저장하지 못했습니다."));
    } finally {
      setWorking(false);
    }
  };

  const activate = async (version) => {
    setWorking(true);
    setError("");
    setMessage("");
    try {
      await activateProposalShellVersion(version.id);
      setMessage(`v${version.version_no}을 활성화했습니다. 새 작업부터 적용됩니다.`);
      await load();
    } catch (requestError) {
      setError(messageFor(requestError, "껍데기 버전을 활성화하지 못했습니다."));
    } finally {
      setWorking(false);
    }
  };

  const toggleDeleted = async (version) => {
    setWorking(true);
    setError("");
    setMessage("");
    try {
      if (version.is_deleted) {
        await recoverProposalShellVersion(version.id);
        setMessage(`v${version.version_no}을 복구했습니다.`);
      } else {
        await deleteProposalShellVersion(version.id);
        setMessage(`v${version.version_no}을 삭제 상태로 변경했습니다.`);
      }
      await load();
    } catch (requestError) {
      setError(messageFor(requestError, "껍데기 버전 상태를 변경하지 못했습니다."));
    } finally {
      setWorking(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mt: 3 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h6" fontWeight={800}>공통 문서 껍데기</Typography>
          <Typography variant="body2" color="text.secondary">
            업로드한 HTML 원본을 그대로 보관하고, 생성 시 reportContent 내부만 교체합니다. 새 버전은 새 작업부터 적용됩니다.
          </Typography>
        </Box>

        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
        {current ? (
          <Alert severity="info">
            현재 활성 버전: v{current.version_no} · {current.original_filename} · SHA-256 {current.sha256.slice(0, 12)}…
          </Alert>
        ) : (
          <Alert severity="warning">활성 껍데기가 없어 문서 생성 작업을 시작할 수 없습니다.</Alert>
        )}

        <Stack spacing={1.5}>
          <Box
            component="label"
            role="button"
            tabIndex={working ? -1 : 0}
            aria-label="공통 문서 껍데기 HTML 파일 선택 또는 드래그앤드롭"
            aria-disabled={working}
            onDragEnter={(event) => {
              event.preventDefault();
              if (!working) setDragging(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = working ? "none" : "copy";
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false);
            }}
            onDrop={dropFile}
            onKeyDown={(event) => {
              if (!working && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            sx={{
              minHeight: 160,
              px: 3,
              py: 2.5,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              border: "2px dashed",
              borderColor: dragging ? "primary.main" : file ? "success.main" : "divider",
              borderRadius: 3,
              backgroundColor: dragging
                ? "rgba(37, 99, 235, 0.06)"
                : file
                  ? "rgba(22, 163, 74, 0.06)"
                  : "background.default",
              cursor: working ? "not-allowed" : "pointer",
              opacity: working ? 0.6 : 1,
              transition: "border-color .15s ease, background-color .15s ease",
              "&:focus-visible": {
                outline: "3px solid",
                outlineColor: "primary.light",
                outlineOffset: 2,
              },
            }}
          >
            <input
              ref={fileInputRef}
              hidden
              type="file"
              accept="text/html,.html,.htm"
              disabled={working}
              onChange={(event) => {
                chooseFile(event.target.files);
                event.target.value = "";
              }}
            />
            <Stack spacing={1} alignItems="center">
              {file ? (
                <InsertDriveFileOutlinedIcon color="success" sx={{ fontSize: 42 }} />
              ) : (
                <CloudUploadRoundedIcon color={dragging ? "primary" : "action"} sx={{ fontSize: 46 }} />
              )}
              <Typography fontWeight={800}>
                {dragging ? "여기에 HTML 파일을 놓으세요" : file ? file.name : "HTML 파일을 드래그하거나 클릭해 선택하세요"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {file
                  ? `${file.size.toLocaleString()} bytes · 다른 파일을 놓으면 교체됩니다.`
                  : ".html 또는 .htm · 한 번에 1개 · 최대 500KB"}
              </Typography>
            </Stack>
          </Box>
          <TextField
            label="변경 설명"
            value={changeNote}
            onChange={(event) => setChangeNote(event.target.value)}
            inputProps={{ maxLength: 1000 }}
            multiline
            minRows={2}
          />
          <Button variant="contained" onClick={save} disabled={working || !file}>
            {working ? "처리 중..." : "새 버전 저장 및 활성화"}
          </Button>
        </Stack>

        <Divider />
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography fontWeight={800}>버전 이력</Typography>
          <Button size="small" onClick={() => setIncludeDeleted((value) => !value)}>
            {includeDeleted ? "삭제 버전 숨기기" : "삭제 버전 포함"}
          </Button>
        </Stack>
        <Stack divider={<Divider flexItem />}>
          {versions.map((version) => (
            <Stack
              key={version.id}
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ sm: "center" }}
              gap={1.5}
              sx={{ py: 1.25, opacity: version.is_deleted ? 0.6 : 1 }}
            >
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography fontWeight={750}>v{version.version_no} · {version.original_filename}</Typography>
                  {version.is_active && <Chip label="활성" color="success" size="small" />}
                  {version.is_deleted && <Chip label="삭제됨" size="small" />}
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {version.change_note || "변경 설명 없음"}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button size="small" component="a" href={proposalShellDownloadUrl(version.id)}>
                  다운로드
                </Button>
                {!version.is_active && !version.is_deleted && (
                  <Button size="small" variant="outlined" disabled={working} onClick={() => activate(version)}>
                    활성화
                  </Button>
                )}
                {!version.is_active && (
                  <Button size="small" color={version.is_deleted ? "primary" : "error"} disabled={working} onClick={() => toggleDeleted(version)}>
                    {version.is_deleted ? "복구" : "삭제"}
                  </Button>
                )}
              </Stack>
            </Stack>
          ))}
          {!versions.length && <Typography color="text.secondary">저장된 껍데기 버전이 없습니다.</Typography>}
        </Stack>
      </Stack>
    </Paper>
  );
}

export default GlobalProposalShellSettings;
