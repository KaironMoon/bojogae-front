/* eslint-disable react/prop-types */
import { useRef, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  FormControlLabel,
  Stack,
  Typography,
} from "@mui/material";
import { crmPost, crmError } from "@/services/crm-service";
import { Field } from "./CrmShared";
import { CustomerForm } from "./CrmForms";
import { CustomerPopupHeader } from "./CustomerReference";
import Icon from "./ContractDesignIcon";

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

export default function CrmImport({ onClose, onDone, renderRegistration }) {
  const fileInput = useRef(null);
  const inFlight = useRef(false);
  const [mappingOpen, setMappingOpen] = useState(false);
  const [table, setTable] = useState(null);
  const [sourceFile, setSourceFile] = useState(null);
  const [format, setFormat] = useState("TSV");
  const [text, setText] = useState("");
  const [mapping, setMapping] = useState({});
  const [useTransform, setUseTransform] = useState(false);
  const [job, setJob] = useState(null);
  const [position, setPosition] = useState(0);
  const [selected, setSelected] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(action) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(crmError(err));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  async function preview(input, warning, customerLines = 1) {
    const next = await crmPost("/imports", { ...input, mapping_confirmed: true }, { timeout: 300000 });
    setJob({ ...next, warning, customerLines });
    setPosition(0);
    setSelected([]);
    setOverrides({});
    setMappingOpen(false);
  }

  function parseFile(file, layout) {
    return run(async () => {
      const form = new FormData();
      form.append("file", file);
      if (layout) {
        form.append("header_row", layout.headerRow);
        form.append("customer_lines", layout.customerLines);
        if (layout.dataStart !== undefined) form.append("data_start", layout.dataStart);
      }
      const parsed = await crmPost("/imports/parse-file", form, { timeout: 150000 });
      setSourceFile(file);
      setTable(parsed);
      setText(parsed.text);
      setFormat(parsed.format);
      setMapping(parsed.mapping);
      setUseTransform(Boolean(parsed.transform_source));
      if (parsed.layout_error || parsed.transform_warning) {
        setMappingOpen(true);
      } else if (!layout) {
        await preview({
          format: parsed.format, text: parsed.text, mapping: parsed.mapping,
          ...(parsed.transform_source && {
            transform_source: parsed.transform_source, transform_row_width: parsed.transform_row_width,
          }),
        }, parsed.warning, parsed.customer_lines);
      }
    });
  }

  function acceptFiles(files) {
    if (busy || inFlight.current || !files.length) return;
    if (files.length !== 1 || !/\.(xlsx|xls|csv)$/i.test(files[0].name)) {
      setError("엑셀(.xlsx, .xls) 또는 CSV 파일을 한 번에 하나씩 올려 주세요.");
      return;
    }
    if (files[0].size > 2000000) {
      setError("2MB 이하 파일을 선택해 주세요.");
      return;
    }
    void parseFile(files[0]);
  }

  function rememberDraft(index, draft) {
    if (draft) setOverrides((old) => ({ ...old, [index]: draft }));
  }

  function commit(index, draft) {
    rememberDraft(index, draft);
    const edits = { ...overrides, ...(draft ? { [index]: draft } : {}) };
    const selectedEdits = Object.fromEntries(selected.filter((id) => edits[id]).map((id) => [id, edits[id]]));
    return run(async () => {
      const saved = await crmPost(`/imports/${job.id}/commit`, {
        indices: selected,
        overrides: selectedEdits,
        reviewed: true,
      }, { timeout: 300000 });
      onDone(saved.count);
    });
  }

  const registration = renderRegistration?.({ open: !job && !mappingOpen, onFiles: acceptFiles, busy, error });
  if (job && !mappingOpen) {
    const row = job.rows[position];
    const otherErrors = row.errors.filter((item) => item.field !== "resident_number");
    const value = overrides[row.index] || row.customer;
    const selectable = job.rows.filter((item) => !item.errors.length || overrides[item.index]);
    const selectedSet = new Set(selected);
    return <>{registration}
      <CustomerForm
        key={`${job.id}:${row.index}`}
        value={value}
        onClose={onClose}
        importReview={{
          busy,
          error,
          renderDetails: (draft) => (
            <Stack gap={1} mb={2}>
              <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center" justifyContent="space-between">
                <Typography role="status" fontWeight={700}>고객 {position + 1} / {job.rows.length} · 선택 {selected.length}명</Typography>
                <Button type="button" disabled={busy} onClick={() => {
                  rememberDraft(row.index, draft);
                  setError("");
                  setMappingOpen(true);
                }}>항목 연결 확인·수정</Button>
              </Stack>
              {job.customerLines > 1 && <Typography variant="body2">엑셀 {job.customerLines}행을 고객 한 명으로 읽었습니다.</Typography>}
              {job.warning && <Alert severity="warning">{job.warning}</Alert>}
              {row.kakao_name_duplicate && (draft || value).alias === row.customer.alias && (
                <Alert severity="warning">같은 카톡대화명이 있습니다. 대화명을 수정하거나 중복 행을 등록 대상에서 제외해 주세요.</Alert>
              )}
              {row.duplicates?.length > 0 && (draft || value).phone === row.customer.phone && (
                <Alert severity="warning">같은 연락처 고객이 있습니다. {row.duplicates.map((item) => item.name).join(", ")}</Alert>
              )}
              {otherErrors.length > 0 && !overrides[row.index] && (
                <Alert severity="warning">{otherErrors.map((item) => item.message).join(" / ")}</Alert>
              )}
              {(row.original.original_contract || row.original.original_status) && (
                <Typography variant="body2">원본 계약 여부 {row.original.original_contract || "—"} · 원본 상태 {row.original.original_status || "—"}</Typography>
              )}
              <details>
                <summary>원본 행 확인</summary>
                <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{JSON.stringify(row.raw, null, 2)}</pre>
              </details>
            </Stack>
          ),
          renderFooter: (draft) => {
            function move(offset) {
              rememberDraft(row.index, draft);
              setPosition(position + offset);
            }
            const allSelected = selectable.length > 0 && selectable.length === selected.length
              && selectable.every((item) => selectedSet.has(item.index));
            return (
              <div className="customer-import-review-actions">
                <Stack direction="row" gap={1}>
                  <Button type="button" variant="outlined" disabled={busy || position === 0} onClick={() => move(-1)}>이전</Button>
                  <Button type="button" variant="outlined" disabled={busy || position === job.rows.length - 1} onClick={() => move(1)}>다음</Button>
                </Stack>
                <Stack direction="row" flexWrap="wrap" alignItems="center" columnGap={1}>
                  <FormControlLabel
                    label="이 고객 등록"
                    control={<Checkbox checked={selectedSet.has(row.index)} disabled={busy || (row.errors.length > 0 && !draft && !overrides[row.index])}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        rememberDraft(row.index, draft);
                        setSelected((old) => checked ? [...old, row.index] : old.filter((id) => id !== row.index));
                      }} />}
                  />
                  <FormControlLabel
                    label="등록 가능 고객 모두 선택"
                    control={<Checkbox checked={allSelected} disabled={busy || !selectable.length}
                      onChange={(event) => setSelected(event.target.checked ? selectable.map((item) => item.index) : [])} />}
                  />
                </Stack>
                <Button type="button" variant="contained" disabled={busy || !selected.length} onClick={() => commit(row.index, draft)}>
                  {busy ? "등록 중…" : "선택한 고객 일괄 등록"}
                </Button>
              </div>
            );
          },
        }}
      />
    </>;
  }

  if (renderRegistration && !mappingOpen) return <>{registration}</>;

  const headers = table?.headers || text.split(/\r?\n/)[0]?.split(format === "CSV" ? "," : "\t")
    .map((header) => header.replace(/^"|"$/g, "").trim()).filter(Boolean) || [];

  return <>{registration}
    <Dialog
      open
      onClose={busy ? undefined : onClose}
      aria-labelledby="customer-import-title"
      fullWidth
      maxWidth={mappingOpen ? "md" : "sm"}
      slotProps={{ paper: { className: "crm-customer-dialog crm-customer-import-dialog" } }}
    >
      <CustomerPopupHeader id="customer-import-title" title={mappingOpen ? "항목 연결 확인·수정" : "고객 등록 · 엑셀 가져오기"} icon="sheet" busy={busy} onClose={onClose} />
      <DialogContent>
        <Stack gap={2}>
          {error && <Alert severity="error">{error}</Alert>}
          {mappingOpen ? (
            <>
              {table ? (
                <>
                  {table.warning && <Alert severity="warning">{table.warning}</Alert>}
                  {table.layout_error && <Alert severity="warning">{table.layout_error}</Alert>}
                  {table.transform_warning && <Alert severity="warning">{table.transform_warning}</Alert>}
                  <Field
                    label="제목 행"
                    value={String(table.header_row)}
                    disabled={busy}
                    options={Object.fromEntries(table.header_options.map((option) => [String(option.value), option.label]))}
                    onChange={(value) => parseFile(sourceFile, { headerRow: Number(value), customerLines: table.customer_lines ?? 1 })}
                  />
                  <Field label="고객당 행 수" value={String(table.customer_lines ?? 1)} disabled={busy}
                    options={Object.fromEntries(Array.from({ length: 10 }, (_, i) => [String(i + 1), `${i + 1}행`]))}
                    onChange={(value) => parseFile(sourceFile, { headerRow: table.header_row, customerLines: Number(value) })} />
                  <Field label="첫 고객 행" value={String(table.data_start)} disabled={busy}
                    options={Object.fromEntries(table.data_start_options.map((index) => [String(index), `${index + 1}행`]))}
                    onChange={(value) => parseFile(sourceFile, { headerRow: table.header_row, customerLines: table.customer_lines, dataStart: Number(value) })} />
                  {table.layout_error && (
                    <Button disabled={busy} onClick={() => parseFile(sourceFile)}>루나로 다시 분석</Button>
                  )}
                </>
              ) : (
                <>
                  <Field label="자료 형식" value={format} options={{ TSV: "엑셀 표", CSV: "CSV" }}
                    disabled={busy} onChange={(value) => { setFormat(value); setMapping({}); }} />
                  <Field label="원본 내용 붙여넣기" value={text} multiline minRows={5}
                    disabled={busy} onChange={(value) => { setText(value); setMapping({}); }} />
                </>
              )}
              {headers.map((header, index) => (
                <Field
                  key={`${index}:${header}`}
                  label={`${header} → 저장 항목${table && (table.confidence[header] ?? 0) < 0.8 ? " · 확인 필요" : ""}`}
                  value={mapping[header] || ""}
                  options={{ ...(table ? {} : { "": "기본 연결 사용" }), __ignore__: "가져오지 않음", ...MAPPABLE }}
                  helperText={table ? `샘플: ${table.samples.map((row) => row[index] || "(빈칸)").join(" / ")}` : undefined}
                  disabled={busy}
                  onChange={(value) => setMapping((old) => {
                    const next = { ...old };
                    if (value) next[header] = value;
                    else delete next[header];
                    return next;
                  })}
                />
              ))}
              {table?.transform_source && (
                <Stack gap={1}>
                  <FormControlLabel label="AI가 만든 값 처리 함수 적용"
                    control={<Checkbox checked={useTransform} disabled={busy} onChange={(event) => setUseTransform(event.target.checked)} />} />
                  <details>
                    <summary>함수와 변환 샘플 확인</summary>
                    <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{table.transform_source}</pre>
                    {table.transform_samples.map((sample) => (
                      <Stack key={sample.index} gap={0.5} mb={1}>
                        <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>원본 {sample.index + 1} · {sample.input.join(" / ")}</Typography>
                        <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                          함수 결과 · {Object.entries(sample.output).map(([field, value]) => `${MAPPABLE[field] || field} ${value}`).join(" / ") || "변경 항목 없음"}
                        </Typography>
                        {sample.errors.length > 0 && <Alert severity="warning">{sample.errors.map((item) => item.message).join(" / ")}</Alert>}
                      </Stack>
                    ))}
                  </details>
                </Stack>
              )}
              {job && <Alert severity="info">항목 연결을 적용하면 원본에서 다시 불러오므로 기존 수정 내용과 등록 선택이 초기화됩니다.</Alert>}
            </>
          ) : (
            <>
              <div className="customer-popup-import-choices">
                <button type="button" disabled={busy} onClick={() => fileInput.current?.click()}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => { event.preventDefault(); acceptFiles(Array.from(event.dataTransfer.files)); }}>
                  <Icon name="upload" />
                  <strong>{busy ? <span className="crm-import-reading">고객 자료를 읽는 중<span aria-hidden="true">...</span></span> : "엑셀 · CSV 파일 업로드"}</strong>
                  <p>파일을 끌어다 놓거나 클릭해서 선택하세요. 최대 2MB</p>
                </button>
              </div>
              <input ref={fileInput} type="file" hidden disabled={busy} accept=".xlsx,.xls,.csv"
                onChange={(event) => {
                  const files = Array.from(event.target.files);
                  event.target.value = "";
                  acceptFiles(files);
                }} />
              <div className="customer-ref-import-template">
                <span>고객 업로드 표준 양식</span>
                <a href={`${import.meta.env.BASE_URL}templates/bojogae-customer-import.xlsx`} download>엑셀 양식</a>
                <a href={`${import.meta.env.BASE_URL}templates/bojogae-customer-import.csv`} download>CSV 양식</a>
              </div>
              <Button disabled={busy} onClick={() => setMappingOpen(true)}>
                {table ? "항목 연결 확인·수정" : "엑셀 표 붙여넣기"}
              </Button>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        {mappingOpen && <Button disabled={busy} onClick={() => { setError(""); setMappingOpen(false); }}>{job ? "고객 검토로 돌아가기" : "돌아가기"}</Button>}
        {mappingOpen && <Button disabled={busy || !text.trim() || Boolean(table?.layout_error)} variant="contained"
          onClick={() => run(() => preview({
            format, text, mapping,
            ...(useTransform && table?.transform_source && {
              transform_source: table.transform_source, transform_row_width: table.transform_row_width,
            }),
          }, "", table?.customer_lines))}>
          {busy ? "자료 처리 중…" : job ? "적용하고 고객 다시 불러오기" : "고객 정보 확인"}
        </Button>}
        {!mappingOpen && <Button disabled={busy} onClick={onClose}>닫기</Button>}
      </DialogActions>
    </Dialog>
  </>;
}
