/* eslint-disable react/prop-types */
import { useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Pagination,
  Stack,
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
export default function CrmImport({ onClose, onDone }) {
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
  const headers = text.split(/\r?\n/)[0]?.split(format === "CSV" ? "," : "\t").map((header) => header.replace(/^"|"$/g, "").trim()).filter(Boolean) || [];
  async function upload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 2000000) {
      setError("2MB 이하 파일을 선택해 주세요.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const parsed = await crmPost("/imports/parse-file", form);
      setText(parsed.text);
      setFormat(parsed.format);
      setMapping({});
      setJob(null);
    } catch (error) {
      setError(crmError(error));
    } finally {
      setBusy(false);
    }
  }
  async function preview() {
    setError("");
    setBusy(true);
    try {
      const data = await crmPost("/imports", { format, text, mapping }, { timeout: 300000 });
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
    <Dialog open onClose={busy ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>고객 자료 가져오기</DialogTitle>
      <DialogContent>
        <Stack gap={2}>
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
              <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
                <Button component="a" variant="outlined" href={`${import.meta.env.BASE_URL}templates/bojogae-customer-import.xlsx`} download="보조개_고객등록양식.xlsx">엑셀 양식 다운로드</Button>
                <Button component="a" variant="outlined" href={`${import.meta.env.BASE_URL}templates/bojogae-customer-import.csv`} download="보조개_고객등록양식.csv">CSV 양식 다운로드</Button>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                양식의 첫 줄을 유지하고 2행의 가상 고객 샘플을 삭제한 뒤 한 행에 고객 한 명씩 입력해 주세요. 고객명과 연락처 또는 주소가 필요하며 최대 5,000명·2MB까지 가져올 수 있습니다. 엑셀은 첫 번째 시트를 읽습니다.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                생년월일은 연도를 알면 19850307처럼 8자리로 입력하세요. 윤달 여부는 윤달·평달로 입력하며 예·아니오도 사용할 수 있습니다. 빈칸은 평달로 처리하고, 윤달은 음력 생일에만 입력할 수 있습니다.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                주민번호는 앞 6자리와 뒤 첫 1자리만 입력하세요(예: 850307-1). 비우면 생년월일·성별로 자동 입력합니다. 상담 단계는 미접촉·연락 중·상담 중·제안 중·보류·상담 종료 중 하나이며, 비우면 미접촉으로 등록합니다. 태그는 쉼표로 구분하세요.
              </Typography>
              <Field
                label="자료 형식"
                value={format}
                options={{
                  TSV: "표 붙여넣기 (엑셀에서 복사)",
                  CSV: "CSV (쉼표 구분)",
                  HTML: "첨부 고객 HTML",
                }}
                onChange={setFormat}
              />
              <Button component="label" disabled={busy}>
                {busy ? "파일 읽는 중…" : "파일 선택"}
                <input
                  type="file"
                  hidden
                  accept=".xlsx,.csv,.html,.htm,.tsv,.txt"
                  onChange={upload}
                />
              </Button>
              <Field
                label="원본 내용 붙여넣기"
                value={text}
                onChange={setText}
                multiline
                minRows={8}
              />
              {format !== "HTML" &&
                headers.map((h, i) => (
                  <Field
                    key={`${i}:${h}`}
                    label={`${h} → 저장 항목`}
                    value={mapping[h] || ""}
                    options={{ "": "기본 매핑 사용", ...MAPPABLE }}
                    onChange={(v) =>
                      setMapping((old) => {
                        const next = { ...old };
                        if (v) next[h] = v;
                        else delete next[h];
                        return next;
                      })
                    }
                  />
                ))}
              <Button
                variant="contained"
                disabled={busy || !text}
                onClick={preview}
              >
                미리보기
              </Button>
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
              <Button disabled={busy} onClick={() => setJob(null)}>
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
