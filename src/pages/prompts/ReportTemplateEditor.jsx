/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from "react";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import {
  Alert, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, MenuItem, Paper, Stack, TextField, Typography,
} from "@mui/material";

import { listReportShells, previewReportTemplate, reportTemplateError } from "@/services/report-template-service";

const fragmentField = { key: "fragment_html", filename: "html_filename", label: "유형별 HTML 템플릿", accept: ".html,.htm" };

const fields = [
  { key: "html", filename: "html_filename", label: "HTML 템플릿", accept: ".html,.htm" },
  { key: "schema_document", filename: "schema_filename", label: "출력 데이터 스키마", accept: ".json" },
  { key: "example_data", filename: "example_filename", label: "템플릿 점검용 예시 데이터", accept: ".json", optional: true },
];

function DataTree({ name, value, onChange }) {
  const object = value !== null && typeof value === "object";
  if (object) {
    const array = Array.isArray(value);
    return <details open>
      <summary>{name} ({Object.keys(value).length})</summary>
      <Stack spacing={1} sx={{ pl: 2, pt: 1 }}>
        {Object.entries(value).map(([key, child]) => (
          <Stack key={key} direction="row" spacing={1} alignItems="flex-start">
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <DataTree name={key} value={child} onChange={(next) => {
                if (array) onChange(value.map((item, index) => index === Number(key) ? next : item));
                else onChange({ ...value, [key]: next });
              }} />
            </Box>
            <Button size="small" aria-label={`${key} 삭제`} onClick={() => {
              if (array) onChange(value.filter((_, index) => index !== Number(key)));
              else onChange(Object.fromEntries(Object.entries(value).filter(([entry]) => entry !== key)));
            }}>삭제</Button>
          </Stack>
        ))}
        <Button size="small" onClick={() => {
          if (array) onChange([...value, ""]);
          else {
            const key = window.prompt("추가할 필드 이름");
            if (key && !Object.hasOwn(value, key)) onChange({ ...value, [key]: "" });
          }
        }}>{array ? "항목 추가" : "필드 추가"}</Button>
      </Stack>
    </details>;
  }
  if (typeof value === "boolean") {
    return <FormControlLabel label={name} control={<Checkbox checked={value} onChange={(e) => onChange(e.target.checked)} />} />;
  }
  return <TextField
    size="small" label={name} fullWidth
    type={typeof value === "number" ? "number" : "text"}
    value={value ?? ""}
    placeholder={value === null ? "null" : undefined}
    onChange={(event) => {
      const next = event.target.value;
      if (typeof value === "number" && !Number.isFinite(Number(next))) return;
      onChange(typeof value === "number" ? Number(next) : next);
    }}
  />;
}

function preparePreview(source, example) {
  const doc = new DOMParser().parseFromString(source, "text/html");
  const channel = Array.from(crypto.getRandomValues(new Uint32Array(4))).join("-");
  const nodes = Array.from(doc.body.querySelectorAll("*")).filter((node) =>
    node.namespaceURI === "http://www.w3.org/1999/xhtml"
    && !node.closest("script,style,textarea,template,select")
    && node.children.length === 0 && (node.textContent.trim() || node.hasAttribute("data-bojogae-empty-text"))
  );
  const selectors = nodes.map((node, index) => {
    const id = String(index);
    node.setAttribute("data-bojogae-template-node", id);
    return id;
  });
  if (example && doc.getElementById("proposalData")) {
    doc.getElementById("proposalData").textContent = JSON.stringify(example).replaceAll("<", "\\u003c");
  }
  const csp = doc.createElement("meta");
  csp.httpEquiv = "Content-Security-Policy";
  csp.content = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'";
  doc.head.prepend(csp);
  const bridge = doc.createElement("script");
  bridge.textContent = `
    window.addEventListener("load", () => {
      const nodes = document.querySelectorAll("[data-bojogae-template-node]");
      for (const node of nodes) {
        node.contentEditable = "true";
        node.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopImmediatePropagation();
        }, true);
        node.addEventListener("input", () => parent.postMessage({
          channel: ${JSON.stringify(channel)},
          id: node.dataset.bojogaeTemplateNode,
          text: node.textContent,
          style: node.getAttribute("style")
        }, "*"));
      }
      window.addEventListener("message", (event) => {
        if (event.source !== parent || event.data?.channel !== ${JSON.stringify(channel)}) return;
        const node = document.activeElement;
        if (!node?.hasAttribute("data-bojogae-template-node")) return;
        if (event.data.command === "bold") {
          node.style.fontWeight = node.style.fontWeight === "bold" ? "" : "bold";
        } else if (event.data.command === "italic") {
          node.style.fontStyle = node.style.fontStyle === "italic" ? "" : "italic";
        }
        node.dispatchEvent(new Event("input"));
      });
    });
  `;
  doc.body.append(bridge);
  return { html: "<!doctype html>\n" + doc.documentElement.outerHTML, channel, selectors };
}

function HtmlEditor({ source, onChange, example }) {
  const frame = useRef(null);
  const [preview, setPreview] = useState(() => preparePreview(source, example));
  const sourceRef = useRef(source);
  sourceRef.current = source;

  useEffect(() => {
    const receive = (event) => {
      const message = event.data;
      if (event.source !== frame.current?.contentWindow || message?.channel !== preview.channel
          || !preview.selectors.includes(message.id) || typeof message.text !== "string"
          || (message.style !== null && typeof message.style !== "string")) return;
      const doc = new DOMParser().parseFromString(sourceRef.current, "text/html");
      const node = Array.from(doc.body.querySelectorAll("*")).filter((item) =>
        item.namespaceURI === "http://www.w3.org/1999/xhtml"
        && !item.closest("script,style,textarea,template,select")
        && item.children.length === 0 && (item.textContent.trim() || item.hasAttribute("data-bojogae-empty-text"))
      )[Number(message.id)];
      if (!node) return;
      node.textContent = message.text;
      node.toggleAttribute("data-bojogae-empty-text", !message.text.trim());
      if (message.style) node.setAttribute("style", message.style);
      else node.removeAttribute("style");
      const next = "<!doctype html>\n" + doc.documentElement.outerHTML;
      sourceRef.current = next;
      onChange(next);
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [onChange, preview]);

  const format = (command) => frame.current?.contentWindow?.postMessage({ channel: preview.channel, command }, "*");
  return <>
    <TextField label="HTML 소스" value={source} onChange={(event) => {
      const next = event.target.value;
      onChange(next);
      setPreview(preparePreview(next, example));
    }} multiline minRows={20} maxRows={26} fullWidth slotProps={{ input: { sx: { fontFamily: "monospace", fontSize: 13 } } }} />
    <Stack spacing={1} sx={{ minWidth: 0 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="subtitle2">위지위그 편집기</Typography>
        <Button size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => format("bold")}>굵게</Button>
        <Button size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => format("italic")}>기울임</Button>
      </Stack>
      <Typography variant="caption" color="text.secondary">템플릿의 고정 문구를 클릭해 편집합니다. 예시 값은 JSON에서 수정합니다.</Typography>
      <Box component="iframe" ref={frame} title="HTML 템플릿 편집" sandbox="allow-scripts"
        srcDoc={preview.html} sx={{ width: "100%", height: 530, border: 1, borderColor: "divider", bgcolor: "white" }} />
    </Stack>
  </>;
}

function FileDialog({ field, value, example, onClose, onApply }) {
  const isFragment = field.key === fragmentField.key;
  const [source, setSource] = useState(() => isFragment || field.key === "html" ? value : JSON.stringify(value, null, 2));
  const parsed = useMemo(() => {
    if (isFragment) return source.trim() ? { value: source } : { error: "유형별 HTML 소스를 입력해 주세요." };
    if (field.key === "html") {
      return /<!-- DATA_START -->[\s\S]*?<!-- DATA_END -->/.test(source) && /<html\b/i.test(source)
        ? { value: source } : { error: "HTML 문서에 DATA_START와 DATA_END가 필요합니다." };
    }
    try {
      const data = JSON.parse(source);
      if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("JSON 객체를 입력해 주세요.");
      return { value: data };
    } catch (error) {
      return { error: error.message };
    }
  }, [field.key, isFragment, source]);
  return <Dialog open onClose={onClose} fullWidth maxWidth="xl">
    <DialogTitle>{field.label} 편집</DialogTitle>
    <DialogContent dividers>
      {parsed.error && <Alert severity="warning" sx={{ mb: 2 }}>{parsed.error}</Alert>}
      {isFragment ? <TextField label="유형별 HTML 소스" value={source}
        onChange={(event) => setSource(event.target.value)} multiline minRows={20} maxRows={26} fullWidth
        slotProps={{ input: { sx: { fontFamily: "monospace", fontSize: 13 } } }} /> :
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
        {field.key === "html" ? <HtmlEditor source={source} onChange={setSource} example={example} /> : <>
          <TextField label="JSON 소스" value={source} onChange={(event) => setSource(event.target.value)}
            multiline minRows={20} maxRows={26} fullWidth slotProps={{ input: { sx: { fontFamily: "monospace", fontSize: 13 } } }} />
          <Paper variant="outlined" sx={{ p: 2, maxHeight: 560, overflow: "auto" }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>데이터 편집기</Typography>
            {parsed.value && <DataTree name="JSON" value={parsed.value} onChange={(data) => setSource(JSON.stringify(data, null, 2))} />}
          </Paper>
        </>}
      </Box>}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>취소</Button>
      <Button variant="contained" disabled={Boolean(parsed.error)} onClick={() => onApply(parsed.value)}>적용</Button>
    </DialogActions>
  </Dialog>;
}

function TemplateFileDropZone({ field, filename, disabled, onFiles }) {
  const input = useRef(null);
  const [dragging, setDragging] = useState(false);

  return (<>
    <input
      ref={input}
      type="file"
      hidden
      accept={field.accept}
      disabled={disabled}
      onChange={(event) => {
        onFiles(event.target.files);
        event.target.value = "";
      }}
    />
    <Paper
      component="button"
      type="button"
      variant="outlined"
      aria-label={`${field.label} 파일 선택 또는 드래그 앤 드롭`}
      disabled={disabled}
      onClick={() => input.current?.click()}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = disabled ? "none" : "copy";
        if (!disabled) setDragging(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!disabled) onFiles(event.dataTransfer.files);
      }}
      sx={{
        width: "100%", p: 2, borderWidth: 2, borderStyle: "dashed",
        borderColor: dragging ? "primary.main" : "divider", borderRadius: 2,
        bgcolor: dragging ? "action.selected" : "background.paper",
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1,
        "&:focus-visible": { outline: "3px solid", outlineColor: "primary.light", outlineOffset: 2 },
      }}
    >
      <Stack component="span" spacing={0.5} alignItems="center">
        <CloudUploadRoundedIcon color={dragging ? "primary" : "action"} />
        <Typography component="span" variant="body2" fontWeight={700}>
          {dragging ? "여기에 파일을 놓으세요" : "파일을 끌어다 놓거나 클릭해서 선택"}
        </Typography>
        <Typography component="span" variant="caption" color="text.secondary">
          {field.accept.split(",").join(" / ")} · 1개 · 최대 1MB
        </Typography>
        {filename && <Typography component="span" variant="caption" sx={{ overflowWrap: "anywhere" }}>{filename}</Typography>}
      </Stack>
    </Paper>
  </>);
}

function previewDocument(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const csp = doc.createElement("meta");
  csp.httpEquiv = "Content-Security-Policy";
  csp.content = "default-src 'none'; script-src 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; font-src data: https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; img-src data: blob:; base-uri 'none'; form-action 'none'";
  doc.head.prepend(csp);
  return "<!doctype html>\n" + doc.documentElement.outerHTML;
}

export default function ReportTemplateEditor({ value, onChange, disabled, title }) {
  const [field, setField] = useState(null);
  const [error, setError] = useState("");
  const [shells, setShells] = useState([]);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const assembled = value.shell_version_id != null;
  const fieldsToShow = assembled ? [fragmentField, ...fields.slice(1)] : fields;

  useEffect(() => {
    let active = true;
    listReportShells().then((items) => {
      if (active) setShells(items);
    }).catch((exception) => {
      if (active) setError(reportTemplateError(exception, "공통 HTML 목록을 불러오지 못했습니다."));
    });
    return () => { active = false; };
  }, []);

  const showPreview = async () => {
    setPreviewLoading(true);
    setError("");
    try {
      const result = await previewReportTemplate(title.trim() || "보고서", value);
      setPreview(previewDocument(result.html));
    } catch (exception) {
      setError(reportTemplateError(exception, "조립 미리보기를 불러오지 못했습니다."));
    } finally {
      setPreviewLoading(false);
    }
  };

  const upload = async (definition, files) => {
    if (disabled || !files?.length) return;
    try {
      if (files.length !== 1) throw new Error("파일을 한 개만 선택해 주세요.");
      const file = files[0];
      if (!definition.accept.split(",").some((extension) => file.name.toLowerCase().endsWith(extension))) {
        throw new Error("지정된 확장자의 파일을 선택해 주세요.");
      }
      if (file.size > 1_000_000) throw new Error("파일은 1MB 이하로 선택해 주세요.");
      const source = await file.text();
      const isHtml = definition.key === "html" || definition.key === fragmentField.key;
      const content = isHtml ? source : JSON.parse(source);
      if (!isHtml && (!content || typeof content !== "object" || Array.isArray(content))) {
        throw new Error("JSON 객체가 들어 있는 파일을 선택해 주세요.");
      }
      onChange((current) => ({ ...current, [definition.key]: content, [definition.filename]: file.name }));
      setError("");
    } catch (exception) {
      setError(exception.message);
    }
  };
  return <Stack spacing={1.5}>
    <TextField select label="공통 HTML 버전" value={value.shell_version_id ?? ""} disabled={disabled || previewLoading}
      onChange={(event) => {
        const shell = event.target.value || null;
        onChange((current) => {
          if ((current.shell_version_id != null) === (shell != null)) {
            return { ...current, shell_version_id: shell };
          }
          const next = { ...current };
          for (const field of ["html", "fragment_html", "html_filename", "shell_version_id", "assembly_version"]) {
            delete next[field];
          }
          if (shell) next.shell_version_id = shell;
          return next;
        });
      }}>
      <MenuItem value="">완성 HTML 직접 등록</MenuItem>
      {assembled && !shells.some((item) => item.id === value.shell_version_id)
        && <MenuItem value={value.shell_version_id}>#{value.shell_version_id}</MenuItem>}
      {shells.map((item) => <MenuItem key={item.id} value={item.id}>#{item.id} · {item.filename}</MenuItem>)}
    </TextField>
    {fieldsToShow.map((item) => <Stack key={item.key} spacing={0.75}>
      <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
        <Typography variant="body2" sx={{ flex: 1 }}>{item.label}{item.optional ? " (선택)" : ""}</Typography>
        <Button size="small" disabled={disabled || value[item.key] == null} onClick={() => setField(item)}>편집</Button>
        {item.optional && value[item.key] != null && <Button size="small" disabled={disabled}
          onClick={() => onChange((current) => ({ ...current, [item.key]: null, [item.filename]: undefined }))}>제거</Button>}
      </Stack>
      <TemplateFileDropZone field={item} filename={value[item.filename]} disabled={disabled}
        onFiles={(files) => upload(item, files)} />
    </Stack>)}
    {assembled && <Button variant="outlined" onClick={showPreview}
      disabled={previewLoading || !value.fragment_html || !value.schema_document || !value.example_data}
      sx={{ alignSelf: "flex-start" }}>예시 데이터로 조립 미리보기</Button>}
    {error && <Alert severity="error">{error}</Alert>}
    {preview && <Dialog open fullWidth maxWidth="xl" onClose={() => setPreview(null)}>
      <DialogTitle>조립 미리보기</DialogTitle>
      <DialogContent dividers>
        <Box component="iframe" title="조립된 보고서" sandbox="allow-scripts" srcDoc={preview}
          sx={{ width: "100%", height: "70vh", border: 0 }} />
      </DialogContent>
      <DialogActions><Button onClick={() => setPreview(null)}>닫기</Button></DialogActions>
    </Dialog>}
    {field && value?.[field.key] != null && <FileDialog field={field} value={value[field.key]} example={value.example_data}
      onClose={() => setField(null)}
      onApply={(content) => { onChange((current) => ({ ...current, [field.key]: content })); setField(null); }} />}
  </Stack>;
}
