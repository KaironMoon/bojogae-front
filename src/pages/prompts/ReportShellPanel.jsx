/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { Alert, Button, MenuItem, Paper, Stack, TextField } from "@mui/material";
import TemplateFileDropZone from "./TemplateFileDropZone";

import {
  createReportShell, getReportShell, listReportShells, reportTemplateError,
} from "@/services/report-template-service";

const emptyShell = { filename: "shell_service.html", html: "" };

export default function ReportShellPanel({ onDirtyChange }) {
  const [versions, setVersions] = useState([]);
  const [selected, setSelected] = useState("");
  const [draft, setDraft] = useState(emptyShell);
  const [saved, setSaved] = useState(emptyShell);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const dirty = draft.filename !== saved.filename || draft.html !== saved.html;

  useEffect(() => {
    listReportShells().then(setVersions).catch((exception) => {
      setError(reportTemplateError(exception, "공통 HTML 목록을 불러오지 못했습니다."));
    });
  }, []);

  useEffect(() => {
    onDirtyChange(dirty);
    return () => onDirtyChange(false);
  }, [dirty, onDirtyChange]);

  const choose = async (versionId) => {
    if (dirty && !window.confirm("저장하지 않은 공통 HTML 변경사항을 버릴까요?")) return;
    setWorking(true);
    setError("");
    setMessage("");
    try {
      const version = versionId ? await getReportShell(versionId) : emptyShell;
      const source = { filename: version.filename, html: version.html };
      setSelected(versionId);
      setDraft(source);
      setSaved(source);
    } catch (exception) {
      setError(reportTemplateError(exception, "공통 HTML을 불러오지 못했습니다."));
    } finally {
      setWorking(false);
    }
  };

  const upload = async (files) => {
    if (working || !files?.length) return;
    if (files.length !== 1) {
      setError("HTML 파일을 한 개만 선택해 주세요.");
      return;
    }
    const file = files[0];
    if (!/\.html?$/i.test(file.name) || file.size > 1_000_000) {
      setError("1MB 이하의 HTML 파일을 선택해 주세요.");
      return;
    }
    setWorking(true);
    setError("");
    setMessage("");
    try {
      setDraft({ filename: file.name, html: await file.text() });
    } catch {
      setError("HTML 파일을 읽지 못했습니다.");
    } finally {
      setWorking(false);
    }
  };

  const save = async () => {
    setWorking(true);
    setError("");
    setMessage("");
    try {
      const source = { ...draft, filename: draft.filename.trim() };
      const version = await createReportShell(source);
      setVersions((items) => [version, ...items]);
      setSelected(version.id);
      setDraft(source);
      setSaved(source);
      setMessage(`공통 HTML #${version.id} 버전을 등록했습니다.`);
    } catch (exception) {
      setError(reportTemplateError(exception, "공통 HTML을 저장하지 못했습니다."));
    } finally {
      setWorking(false);
    }
  };

  return <Paper variant="outlined" sx={{ p: 2 }}>
    <Stack spacing={2}>
      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      <TextField select label="편집할 공통 HTML" value={selected}
        slotProps={{ inputLabel: { shrink: true } }} disabled={working}
        onChange={(event) => choose(event.target.value)}>
        <MenuItem value="">새 공통 HTML</MenuItem>
        {versions.map((item) => <MenuItem key={item.id} value={item.id}>#{item.id} · {item.filename}</MenuItem>)}
      </TextField>
      <TemplateFileDropZone label="공통 HTML" accept=".html,.htm"
        filename={draft.html ? draft.filename : undefined} disabled={working} onFiles={upload} />
      <TextField label="파일명" value={draft.filename} disabled={working}
        onChange={(event) => setDraft({ ...draft, filename: event.target.value })} />
      <TextField label="공통 HTML 소스" value={draft.html} disabled={working}
        onChange={(event) => setDraft({ ...draft, html: event.target.value })}
        multiline minRows={12} maxRows={26}
        slotProps={{ input: { sx: { fontFamily: "monospace", fontSize: 13 } } }} />
      <Button variant="contained" onClick={save} disabled={working || !dirty || !draft.filename.trim() || !draft.html.trim()}
        sx={{ alignSelf: "flex-start" }}>새 버전으로 등록</Button>
    </Stack>
  </Paper>;
}
