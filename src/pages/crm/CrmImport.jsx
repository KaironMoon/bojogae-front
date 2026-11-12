import { CustomerPopupHeader } from "./CustomerReference";
import "./crm-customers.css";
import "./customer-popup-reference.css";
import Icon from "./ContractDesignIcon";
/* eslint-disable react/prop-types */
import { useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  FormControlLabel,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { crmPost, crmError } from "@/services/crm-service";
import { Field, Panel } from "./CrmShared";
import { CustomerForm } from "./CrmForms";
const MAPPABLE = {
  name: "고객명",
  alias: "카톡대화명",
  occupation: "직업",
  phone: "연락처",
  address: "주소",
  address_detail: "상세주소",
  visit_note: "방문 참고사항",
  gender: "성별",
  received_raw: "접수일 원문",
  birth_raw: "생년월일 원문",
  birth_calendar: "양력·음력",
  birth_is_leap_month: "윤달 여부",
  birth_century: "출생 연도 확인",
  resident_number: "주민번호 앞 6자리·뒤 첫 1자리",
  stage: "상담 단계",
  tags: "태그",
  call_preference: "통화 가능 시간",
  visit_preference: "방문 가능 시간",
  premium_note: "상담 보험료",
  memo: "메모",
  source: "유입 경로",
  original_contract: "원본 계약여부",
  original_status: "원본 상태",
};
function sampleValue(row, field) {
  const value = field === "address" ? row.customer.location?.address
    : field.startsWith("original_") ? row.original[field] : row.customer[field];
  if (value === true) return "예";
  if (value === false) return "아니오";
  if (Array.isArray(value)) return value.join(", ") || "—";
  const labels = { MALE: "남성", FEMALE: "여성", UNKNOWN: "미확인", SOLAR: "양력", LUNAR: "음력",
    UNCONTACTED: "미접촉", CONTACTING: "연락 중", CONSULTING: "상담 중", PROPOSING: "제안 중", HOLD: "보류", CLOSED: "상담 종료" };
  return labels[value] || String(value ?? "").trim() || "—";
}
export default function CrmImport({ onClose, onDone }) {
  const fileInput = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const uploadInProgress = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [sample, setSample] = useState(null);
  const [mappingConfirmed, setMappingConfirmed] = useState(false);
  const [table, setTable] = useState(null);
  const [sourceFile, setSourceFile] = useState(null);
  const [format, setFormat] = useState("TSV");
  const [text, setText] = useState("");
  const [mapping, setMapping] = useState({});
  const [previewPage, setPreviewPage] = useState(1);
  const [job, setJob] = useState(null);
  const [selected, setSelected] = useState([]);
  const [reviewed, setReviewed] = useState(false);
  const [overrides, setOverrides] = useState({});
  const [edit, setEdit] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const headers = table?.headers || text.split(/\r?\n/)[0]?.split(format === "CSV" ? "," : "\t").map((header) => header.replace(/^"|"$/g, "").trim()).filter(Boolean) || [];
  function resetMappingReview() {
    setSample(null);
    setMappingConfirmed(false);
  }
  async function showMappingSample() {
    if (format === "HTML") {
      await extractHtml();
      return;
    }
    resetMappingReview();
    setError("");
    setBusy(true);
    try {
      setSample(await crmPost("/imports/mapping-sample", { format, text, mapping }));
    } catch (e) {
      setError(crmError(e));
    } finally {
      setBusy(false);
    }
  }
  function applyParsed(parsed, file = null) {
    setText(parsed.text);
    setFormat(parsed.format);
    setMapping(parsed.mapping || {});
    setTable(parsed.headers ? parsed : null);
    setSourceFile(file);
    setJob(null);
  }
  async function extractHtml() {
    resetMappingReview();
    setBusy(true);
    setError("");
    try {
      applyParsed(await crmPost("/imports/extract-html", { format: "HTML", text }, { timeout: 150000 }));
    } catch (error) {
      setError(crmError(error));
    } finally {
      setBusy(false);
    }
  }
  async function upload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) await acceptFiles([file]);
  }
  async function acceptFiles(files) {
    if (busy || uploadInProgress.current || !files.length) return;
    if (files.length !== 1) {
      setError("파일은 한 번에 하나씩 올려 주세요.");
      return;
    }
    if (!/\.(xlsx|xls|csv)$/i.test(files[0].name)) {
      setError("엑셀(.xlsx, .xls) 또는 CSV 파일을 선택해 주세요.");
      return;
    }
    await parseFile(files[0]);
  }
  function dropFile(event) {
    event.preventDefault();
    setDragging(false);
    void acceptFiles(Array.from(event.dataTransfer.files));
  }
  async function parseFile(file, headerRow) {
    if (busy || uploadInProgress.current) return;
    resetMappingReview();
    if (file.size > 2000000) {
      setError("2MB 이하 파일을 선택해 주세요.");
      return;
    }
    uploadInProgress.current = true;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      if (headerRow !== undefined) form.append("header_row", headerRow);
      const parsed = await crmPost("/imports/parse-file", form, { timeout: 150000 });
      applyParsed(parsed, file);
    } catch (error) {
      setError(crmError(error));
    } finally {
      uploadInProgress.current = false;
      setBusy(false);
    }
  }
  async function preview() {
    if (!sample || !mappingConfirmed) return;
    setError("");
    setBusy(true);
    try {
      const data = await crmPost("/imports", { format, text, mapping, mapping_confirmed: mappingConfirmed }, { timeout: 300000 });
      setJob(data);
      setPreviewPage(1);
      setSelected([]);
      setReviewed(false);
      setOverrides({});
    } catch (e) {
      setError(crmError(e));
    } finally {
      setBusy(false);
    }
  }
  async function commit() {
    setBusy(true);
    setError("");
    try {
      const data = await crmPost(`/imports/${job.id}/commit`, {
        indices: selected,
        overrides,
        reviewed,
      }, { timeout: 300000 });
      setResult(data);
      onDone();
    } catch (e) {
      setError(crmError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog slotProps={{ paper: { className: `crm-customer-dialog crm-customer-import-dialog${!expanded && !job && !result ? " customer-ref-import-initial" : ""}` } }} open onClose={busy ? undefined : onClose} fullWidth maxWidth={expanded || job || result ? "md" : "sm"}>
      <CustomerPopupHeader title="고객 자료 가져오기 (엑셀·CSV 전용)" icon="sheet" busy={busy} onClose={onClose} />
      <DialogContent>
        {!job && !result && <div className="customer-popup-import-choices"><button type="button" disabled={busy} onClick={() => { setExpanded(true); fileInput.current?.click(); }} onDragOver={e => e.preventDefault()} onDrop={e => { setExpanded(true); dropFile(e); }}><Icon name="upload" /><strong>엑셀 · CSV 파일 업로드</strong><p>기존 GA 고객관리 엑셀 파일을 드래그하거나 클릭하여 일괄 등록</p></button></div>}
        {!expanded && !job && !result && <div className="customer-ref-import-template"><span>표준 고객 업로드 양식이 필요하신가요?</span><a href={`${import.meta.env.BASE_URL}templates/bojogae-customer-import.xlsx`} download="보조개_고객업로드_표준양식.xlsx">양식 다운로드</a></div>}
        {!expanded && !job && !result && <Button onClick={() => setExpanded(true)}>엑셀 표 붙여넣기 · 업로드 상세 설정</Button>}
        <Stack gap={2} sx={{ display: expanded || job || result ? "flex" : "none" }}>
          {error && <Alert severity="error">{error}</Alert>}
          {result ? (
            <Alert severity="success">
              {result.count}명의 고객을 등록했습니다.
            </Alert>
          ) : !job ? (
            <>
              <Alert severity="info">
                원본을 미리보기로 검토한 뒤 선택한 고객만 등록합니다. 계약
                상태와 불완전한 날짜·금액은 자동 확정하지 않습니다.
              </Alert>
              <Stack alignItems="flex-end">
                <details>
                  <summary style={{ cursor: "pointer", fontSize: 13 }}>양식 다운로드</summary>
                  <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
                <Button component="a" size="small" href={`${import.meta.env.BASE_URL}templates/bojogae-customer-import.xlsx`} download="보조개_고객등록양식.xlsx">엑셀 양식 다운로드</Button>
                <Button component="a" size="small" href={`${import.meta.env.BASE_URL}templates/bojogae-customer-import.csv`} download="보조개_고객등록양식.csv">CSV 양식 다운로드</Button>
                  </Stack>
                </details>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                기존에 사용하던 엑셀을 그대로 올릴 수 있습니다. 첫 번째 시트의 표 하나를 읽어 제목 행과 저장 항목을 제안합니다. 고객명과 연락처 또는 주소가 필요하며 최대 5,000명·2MB까지 가져올 수 있습니다. 제목 행은 처음 10행 안에 있어야 합니다.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                엑셀·CSV의 첫 10행을 분석해 저장 항목을 제안합니다. 등록 전에 매핑과 고객 정보를 확인하고 수정할 수 있습니다.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                생년월일은 연도를 알면 19850307처럼 8자리로 입력하세요. 윤달 여부는 윤달·평달로 입력하며 예·아니오도 사용할 수 있습니다. 빈칸은 평달로 처리하고, 윤달은 음력 생일에만 입력할 수 있습니다.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                주민번호는 앞 6자리와 뒤 첫 1자리만 입력하세요(예: 850307-1). 비우면 생년월일·성별로 자동 입력합니다. 상담 단계는 미접촉·연락 중·상담 중·제안 중·보류·상담 종료 중 하나이며, 비우면 미접촉으로 등록합니다. 태그는 쉼표로 구분하세요.
              </Typography>
              <Box
                component="button"
                type="button"
                aria-label="고객 자료 파일 업로드"
                aria-busy={busy}
                disabled={busy}
                onClick={() => fileInput.current?.click()}
                onDragEnter={(event) => { event.preventDefault(); if (!busy && event.dataTransfer.types.includes("Files")) setDragging(true); }}
                onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = busy ? "none" : "copy"; }}
                onDragLeave={() => setDragging(false)}
                onDrop={dropFile}
                sx={{ width: "100%", p: { xs: 2.5, sm: 4 }, border: "2px dashed", borderColor: dragging ? "primary.main" : "divider",
                  borderRadius: 2, bgcolor: dragging ? "action.selected" : "background.default", color: "text.primary",
                  cursor: busy ? "wait" : "pointer", textAlign: "center", font: "inherit",
                  "& > *": { pointerEvents: "none" }, "&:hover:not(:disabled)": { borderColor: "primary.main", bgcolor: "action.hover" },
                  "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 3 },
                  "&:disabled": { opacity: 0.6 } }}
              >
                <Typography component="span" display="block" fontWeight={600}>
                  {busy ? "자료 처리 중…" : dragging ? "여기에 파일을 놓아 주세요" : "파일을 끌어다 놓거나 클릭해서 선택하세요"}
                </Typography>
                <Typography component="span" display="block" variant="body2" color="text.secondary" mt={1}>
                  엑셀(.xlsx, .xls)·CSV · 최대 2MB · 파일 1개
                </Typography>
                {sourceFile && <Typography component="span" display="block" variant="body2" mt={1} sx={{ overflowWrap: "anywhere" }}>선택한 파일: {sourceFile.name}</Typography>}
              </Box>
              <input ref={fileInput} type="file" hidden disabled={busy}
                accept=".xlsx,.xls,.csv" onChange={upload} />
              <Field
                label="자료 형식"
                value={format}
                options={{
                  TSV: "표 붙여넣기 (엑셀에서 복사)",
                  CSV: "CSV (쉼표 구분)",
                }}
                disabled={busy}
                onChange={(value) => { resetMappingReview(); setFormat(value); setTable(null); setMapping({}); setSourceFile(null); }}
              />
              <Field
                label={table?.extractor ? "추출된 CSV (수정 가능)" : "원본 내용 붙여넣기"}
                value={text}
                disabled={busy}
                onChange={(value) => { resetMappingReview(); setText(value); setTable(null); setMapping({}); setSourceFile(null); }}
                multiline
                minRows={8}
              />
              {table?.warning && <Alert severity="warning">{table.warning}</Alert>}
              {table && (
                <>
                  {table.header_options.length > 0 && <Field label="제목 행" value={String(table.header_row)} disabled={busy}
                    options={Object.fromEntries(table.header_options.map((option) => [String(option.value), option.label]))}
                    onChange={(value) => parseFile(sourceFile, Number(value))} />}
                  <Typography variant="body2">각 열의 저장 항목을 확인해 주세요. 불확실한 제안은 직접 확인하고, 필요 없는 열은 가져오지 않을 수 있습니다.</Typography>
                </>
              )}
              {format !== "HTML" &&
                headers.map((h, i) => (
                  <Field
                    key={`${i}:${h}`}
                    label={`${h} → 저장 항목${table && (table.confidence[h] ?? 0) < 0.8 ? " · 확인 필요" : ""}`}
                    disabled={busy}
                    helperText={table ? `샘플: ${table.samples.map((row) => row[i] || "(빈칸)").join(" / ")}` : undefined}
                    value={mapping[h] || ""}
                    options={{ ...(table ? {} : { "": "기본 매핑 사용" }), __ignore__: "가져오지 않음", ...MAPPABLE }}
                    onChange={(v) => {
                      resetMappingReview();
                      setMapping((old) => {
                        const next = { ...old };
                        if (v) next[h] = v;
                        else delete next[h];
                        return next;
                      });
                    }}
                  />
                ))}
              <Button
                variant="contained"
                disabled={busy || !text}
                onClick={showMappingSample}
              >
                {format === "HTML" ? "HTML 추출 및 매핑" : "매핑 결과 10명 확인"}
              </Button>
              {sample && (
                <Panel>
                  <Stack gap={2}>
                    <Typography variant="h6">매핑된 고객 데이터 · {sample.rows.length}명 (최대 10명)</Typography>
                    <Typography variant="body2">아래 고객 정보와 제외된 열을 확인해 주세요. 동의 후 전체 데이터의 오류와 중복을 검증하며, 최종 등록은 별도로 선택합니다.</Typography>
                    <Stack gap={0.5}>
                      {sample.columns.map((column) => (
                        <Typography variant="body2" key={column.source} sx={{ overflowWrap: "anywhere" }}>
                          {column.source} → {MAPPABLE[column.field] || (column.field === "__ignore__" ? "가져오지 않음" : column.field)}
                        </Typography>
                      ))}
                    </Stack>
                    <TableContainer sx={{ maxWidth: "100%" }}>
                      <Table size="small" aria-label="매핑된 고객 데이터 샘플">
                        <TableHead><TableRow>
                          <TableCell>번호</TableCell>
                          {sample.columns.filter((column) => column.field !== "__ignore__").map((column) => (
                            <TableCell key={column.source}>{MAPPABLE[column.field] || column.field}</TableCell>
                          ))}
                          <TableCell>확인 사항</TableCell>
                        </TableRow></TableHead>
                        <TableBody>
                          {sample.rows.map((row) => (
                            <TableRow key={row.index}>
                              <TableCell>{row.index + 1}</TableCell>
                              {sample.columns.filter((column) => column.field !== "__ignore__").map((column) => (
                                <TableCell key={column.source} sx={{ minWidth: 100, maxWidth: 240, overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}>{sampleValue(row, column.field)}</TableCell>
                              ))}
                              <TableCell sx={{ minWidth: 160 }}>{row.errors.length ? row.errors.map((error) => `${MAPPABLE[error.field] || error.field}: ${error.message}`).join(" / ") : "형식 확인 완료"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <FormControlLabel control={<Checkbox checked={mappingConfirmed} disabled={busy} onChange={(event) => setMappingConfirmed(event.target.checked)} />}
                      label="표시된 매핑 결과를 확인했으며, 이 방식으로 가져오는 데 동의합니다" />
                    <Button variant="contained" disabled={busy || !mappingConfirmed} onClick={preview}>동의하고 전체 데이터 검증</Button>
                  </Stack>
                </Panel>
              )}
            </>
          ) : (
            <>
              <Typography>
                총 {job.rows.length}행 · 선택 {selected.length}행
              </Typography>
              <Alert severity="warning">
                중복 후보, 원본 날짜·보험료·계약 상태를 확인해 주세요. 기존
                좌표는 정확도를 확인하지 않았으므로 자동 반영하지 않습니다.
              </Alert>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={
                      selected.length ===
                        job.rows.filter(
                          (r) => !r.errors.length || overrides[r.index],
                        ).length && selected.length > 0
                    }
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? job.rows
                              .filter(
                                (r) => !r.errors.length || overrides[r.index],
                              )
                              .map((r) => r.index)
                          : [],
                      )
                    }
                  />
                }
                label="등록 가능한 행 모두 선택"
              />
              {job.rows.slice((previewPage - 1) * 50, previewPage * 50).map((r) => {
                const c = overrides[r.index] || r.customer;
                return (
                  <Panel key={r.index}>
                    <Stack gap={1}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            disabled={
                              r.errors.length > 0 && !overrides[r.index]
                            }
                            checked={selected.includes(r.index)}
                            onChange={(e) =>
                              setSelected(
                                e.target.checked
                                  ? [...selected, r.index]
                                  : selected.filter((i) => i !== r.index),
                              )
                            }
                          />
                        }
                        label={`${r.index + 1}. ${c.name || "이름 미확인"}${c.alias ? ` (${c.alias})` : ""} · ${c.phone || "연락처 없음"}`}
                      />
                      <Typography variant="body2">
                        {c.location?.address} · 접수{" "}
                        {c.received_display || c.received_raw || "미확인"} · 생년월일{" "}
                        {c.birth_raw || "미확인"}
                      </Typography>
                      <Typography variant="body2">
                        상담 보험료: {c.premium_note || "미확인"} / 원본 계약:{" "}
                        {r.original.original_contract || "미확인"}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: "pre-wrap" }}
                      >
                        {c.memo}
                      </Typography>
                      {r.kakao_name_duplicate && !overrides[r.index] && (
                        <Alert severity="warning">
                          기존 고객 또는 가져올 자료에 같은 카톡대화명이 있습니다. 대화명을 수정하거나 중복 행의 선택을 해제해 주세요.
                        </Alert>
                      )}
                      {r.duplicates?.length > 0 && (
                        <Alert severity="warning">
                          같은 연락처 고객:{" "}
                          {r.duplicates.map((d) => d.name).join(", ")}
                        </Alert>
                      )}
                      {r.errors.length > 0 && !overrides[r.index] && (
                        <Alert severity="error">
                          {r.errors
                            .map((e) => `${e.field}: ${e.message}`)
                            .join(" / ")}
                        </Alert>
                      )}
                      <Button onClick={() => setEdit(r)}>내용 수정</Button>
                      <details>
                        <summary>원본 행 확인</summary>
                        <pre
                          style={{
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-all",
                          }}
                        >
                          {JSON.stringify(r.raw, null, 2)}
                        </pre>
                      </details>
                    </Stack>
                  </Panel>
                );
              })}
              {job.rows.length > 50 && <Pagination count={Math.ceil(job.rows.length / 50)} page={previewPage} onChange={(_, page) => setPreviewPage(page)} disabled={busy} />}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={reviewed}
                    onChange={(e) => setReviewed(e.target.checked)}
                  />
                }
                label="선택한 고객 정보·중복 여부·미확인 항목을 검토했습니다"
              />
              <Button
                disabled={busy || !reviewed || !selected.length}
                variant="contained"
                onClick={commit}
              >
                {busy ? "서버에서 순차 등록 중…" : "선택 고객 등록"}
              </Button>
              <Button disabled={busy} onClick={() => { setJob(null); resetMappingReview(); }}>
                매핑 다시 하기
              </Button>
            </>
          )}
          {edit && (
            <CustomerForm
              value={{
                ...(overrides[edit.index] || edit.customer),
                version: 1,
              }}
              onClose={() => setEdit(null)}
              onSave={async (data) => {
                const customer = { ...data };
                delete customer.version;
                setOverrides({ ...overrides, [edit.index]: customer });
              }}
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={busy} onClick={onClose}>
          {result ? "완료" : "닫기"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
