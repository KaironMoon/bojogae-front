/* eslint-disable react/prop-types */
import { useRef, useState } from "react";
import { Alert } from "@mui/material";
import { crmPost, crmError } from "@/services/crm-service";
import Icon from "./ContractDesignIcon";
// Input box structure and colors follow 내고객 수정 2026-11-12.html.
export default function CustomerAiFill({ onApply, onBusy, spreadsheet, disabled }) {
  const spreadsheetInput = useRef(null);
  const [text, setText] = useState(""),
    [file, setFile] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const input = useRef(null),
    inFlight = useRef(false);
  function attach(e) {
    const next = e.target.files?.[0];
    e.target.value = "";
    if (!next) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(next.type) ||
      next.size > 5000000
    ) {
      setError("JPG·PNG·WEBP 이미지 1개를 5MB 이하로 첨부해 주세요.");
      return;
    }
    setFile(next);
    setError("");
  }
  async function extract() {
    if (inFlight.current || disabled) return;
    inFlight.current = true;
    setBusy(true);
    onBusy(true);
    setError("");
    setNotice("");
    const form = new FormData();
    form.append("text", text);
    if (file) form.append("image", file);
    const requestId = globalThis.crypto?.randomUUID?.();
    if (requestId) form.append("request_id", requestId);
    let responseReceived = false;
    let extracted = [];
    function report(code, applied = []) {
      form.set("code", code);
      extracted.forEach((field) => form.append("extracted_fields", field));
      applied.forEach((field) => form.append("applied_fields", field));
      void crmPost("/customers/ai-extract/feedback", form).catch(() => {});
    }
    try {
      const result = await crmPost("/customers/ai-extract", form, {
        timeout: 120000,
      });
      responseReceived = true;
      if (result.request_id) form.set("request_id", result.request_id);
      const fields = result.fields && typeof result.fields === "object" ? result.fields : {};
      extracted = Object.keys(fields).filter((key) => key !== "resident_number_manual");
      const applied = await onApply(fields);
      if (!extracted.length || applied.length < extracted.length) {
        report("form_not_applied", applied);
        setError(applied.length ? "일부 항목이 입력되지 않았습니다. 추출 결과를 확인해 주세요." : "자동으로 입력된 고객 정보가 없습니다.");
      } else {
        setNotice(result.message);
      }
    } catch (e) {
      if (responseReceived) report("form_apply_error");
      else if (!e.response) report("request_failed");
      setError(crmError(e));
    } finally {
      inFlight.current = false;
      setBusy(false);
      onBusy(false);
    }
  }
  return (
    <div className="gemini-prompt-box">
      <div className="customer-ai-heading">
        <div className="customer-ai-title">
          <span className="customer-ai-icon">
            <Icon name="sparkles" />
          </span>
          <div>
            <strong>
              AI 고객정보 자동 추출 · 입력 (텍스트 붙여넣기 또는 명함·캡처
              이미지 첨부)
            </strong>
            <p>
              카톡 프로필·상담 메모 텍스트나 명함·캡처 이미지를 첨부하면 고객
              등록 입력칸을 자동으로 채워줍니다.
            </p>
          </div>
        </div>
        <div className="customer-ai-examples">
          <button
            type="button"
            disabled={busy || disabled}
            onClick={() =>
              setText(
                "예시 고객 홍길동 / 010-0000-0000 / 카톡대화명: 홍길동 상담 / 직업: 사무직 / 점심시간 통화 가능 / 보험 리모델링 상담 희망",
              )
            }
          >
            💬 카톡메모 예시 넣기
          </button>
          <button
            type="button"
            disabled={busy || disabled}
            onClick={() => input.current?.click()}
          >
            🖼️ 명함사진 첨부
          </button>
        </div>
      </div>
      <div className="customer-ai-input">
        <textarea
          id="aiCustomerPromptInput"
          rows={2}
          maxLength={10000}
          aria-label="AI 고객정보 입력"
          placeholder="고객명, 연락처, 카톡대화명, 상담 메모를 붙여넣거나 명함·캡처 이미지를 첨부해 주세요."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={busy || disabled}
        />
        {file && (
          <div className="customer-ai-attachment">
            <Icon name="image" />
            <div>
              <strong>{file.name}</strong>
              <p>OCR 비전 분석 준비 완료</p>
            </div>
            <button type="button" disabled={busy} onClick={() => setFile(null)}>
              삭제 ✕
            </button>
          </div>
        )}
        <div className="customer-ai-actions">
          <div className="customer-ai-source-actions">
            <input
              ref={input}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={attach}
            />
            <div className="customer-ai-image-action">
              <button type="button" disabled={busy || disabled} onClick={() => input.current?.click()}>
                <Icon name="image_plus" />
                이미지 첨부 (명함·카톡캡처)
              </button>
              <small>JPG, PNG, WEBP 지원</small>
            </div>
            {spreadsheet && <>
              <input ref={spreadsheetInput} type="file" accept=".xlsx,.xls,.csv" hidden onChange={(event) => {
                const files = Array.from(event.target.files);
                event.target.value = "";
                spreadsheet.onFiles(files);
              }} />
              <button type="button" disabled={busy || disabled || spreadsheet.busy}
                onClick={() => spreadsheetInput.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  if (!busy && !disabled) spreadsheet.onFiles(Array.from(event.dataTransfer.files));
                }}>
                <Icon name="sheet" />
                {spreadsheet.busy ? <span className="crm-import-reading">엑셀 읽는 중<span aria-hidden="true">...</span></span> : "엑셀 · CSV 가져오기"}
              </button>
            </>}
          </div>
          <button
            className="customer-ai-run"
            type="button"
            disabled={busy || disabled || (!text.trim() && !file)}
            onClick={extract}
          >
            <Icon name="wand" />
            {busy ? "AI 분석 중…" : "AI 자동 채움 실행"}
          </button>
        </div>
      </div>
      {error && <Alert severity="error">{error}</Alert>}
      {spreadsheet?.error && <Alert severity="error">{spreadsheet.error}</Alert>}
      {notice && <Alert severity="success">{notice}</Alert>}
      <p className="customer-ai-disclosure">
        텍스트·이미지는 AI 추출을 위해 전송됩니다. 자동 채움에 실패하면 원인 확인을 위해 입력 자료가 7일간 보관됩니다.
      </p>
    </div>
  );
}
