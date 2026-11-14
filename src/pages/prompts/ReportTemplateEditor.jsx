/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, Paper, Stack, TextField, Typography,
} from "@mui/material";

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
  const [source, setSource] = useState(() => field.key === "html" ? value : JSON.stringify(value, null, 2));
  const parsed = useMemo(() => {
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
  }, [field.key, source]);
  return <Dialog open onClose={onClose} fullWidth maxWidth="xl">
    <DialogTitle>{field.label} 편집</DialogTitle>
    <DialogContent dividers>
      {parsed.error && <Alert severity="warning" sx={{ mb: 2 }}>{parsed.error}</Alert>}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
        {field.key === "html" ? <HtmlEditor source={source} onChange={setSource} example={example} /> : <>
          <TextField label="JSON 소스" value={source} onChange={(event) => setSource(event.target.value)}
            multiline minRows={20} maxRows={26} fullWidth slotProps={{ input: { sx: { fontFamily: "monospace", fontSize: 13 } } }} />
          <Paper variant="outlined" sx={{ p: 2, maxHeight: 560, overflow: "auto" }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>데이터 편집기</Typography>
            {parsed.value && <DataTree name="JSON" value={parsed.value} onChange={(data) => setSource(JSON.stringify(data, null, 2))} />}
          </Paper>
        </>}
      </Box>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>취소</Button>
      <Button variant="contained" disabled={Boolean(parsed.error)} onClick={() => onApply(parsed.value)}>적용</Button>
    </DialogActions>
  </Dialog>;
}

export default function ReportTemplateEditor({ value, onChange, disabled }) {
  const [field, setField] = useState(null);
  const [error, setError] = useState("");
  const upload = async (definition, event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (!definition.accept.split(",").some((extension) => file.name.toLowerCase().endsWith(extension))) {
        throw new Error("지정된 확장자의 파일을 선택해 주세요.");
      }
      if (file.size > 1_000_000) throw new Error("파일은 1MB 이하로 선택해 주세요.");
      const source = await file.text();
      const content = definition.key === "html" ? source : JSON.parse(source);
      if (definition.key !== "html" && (!content || typeof content !== "object" || Array.isArray(content))) {
        throw new Error("JSON 객체가 들어 있는 파일을 선택해 주세요.");
      }
      onChange((current) => ({ ...current, [definition.key]: content, [definition.filename]: file.name }));
      setError("");
    } catch (exception) {
      setError(exception.message);
    }
  };
  return <Stack spacing={1.5}>
    {fields.map((item) => <Stack key={item.key} direction="row" gap={1} alignItems="center" flexWrap="wrap">
      <Typography variant="body2" sx={{ flex: 1 }}>{item.label}{item.optional ? " (선택)" : ""} {value[item.filename] || ""}</Typography>
      <Button component="label" size="small" disabled={disabled}>
        파일 선택
        <input type="file" hidden accept={item.accept} onChange={(event) => upload(item, event)} />
      </Button>
      <Button size="small" disabled={disabled || value[item.key] == null} onClick={() => setField(item)}>편집</Button>
      {item.optional && value[item.key] != null && <Button size="small" disabled={disabled}
        onClick={() => onChange((current) => ({ ...current, [item.key]: null, [item.filename]: undefined }))}>제거</Button>}
    </Stack>)}
    {error && <Alert severity="error">{error}</Alert>}
    {field && value?.[field.key] != null && <FileDialog field={field} value={value[field.key]} example={value.example_data}
      onClose={() => setField(null)}
      onApply={(content) => { onChange((current) => ({ ...current, [field.key]: content })); setField(null); }} />}
  </Stack>;
}
