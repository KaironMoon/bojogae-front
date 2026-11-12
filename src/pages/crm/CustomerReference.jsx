/* eslint-disable react/prop-types */
import { useId } from "react";
import { Dialog } from "@mui/material";
import Icon from "./ContractDesignIcon";
import "./crm-customers.css";
import "./customer-popup-reference.css";

// Native markup mirrors docs/design_improve/내고객 개편안.html.
// Business values and handlers are supplied by the existing CRM forms.
export function CustomerField({ id, label, labelAside, inputAside, value, onChange, options, type = "text", helperText, error, required, disabled, multiline, minRows = 3, inputProps = {}, InputLabelProps: _labelProps, SelectProps: _selectProps, ...props }) {
  void _labelProps; void _selectProps;
  const generated = useId();
  const fieldId = id || generated;
  const common = { ...props, ...inputProps, id: fieldId, value: value ?? "", required, disabled, onChange: e => onChange?.(e.target.value), "aria-invalid": error || undefined, "aria-describedby": helperText ? `${fieldId}-helper-text` : undefined };
  return <div className={`customer-ref-field${error ? " customer-ref-field-error" : ""}`}>
    {label && <label htmlFor={fieldId}>{label}{required && <span> *</span>}{labelAside && <span className="customer-ref-label-aside">{labelAside}</span>}</label>}
    {options ? <select {...common}>{Object.entries(options).map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select>
      : multiline ? <textarea {...common} rows={minRows} /> : <input {...common} type={type} />}
    {inputAside && <span className="customer-ref-input-aside">{inputAside}</span>}
    {helperText && <p id={`${fieldId}-helper-text`}>{helperText}</p>}
  </div>;
}

export function CustomerWorkspace({ title, description, badges, actions, children }) {
  return <div className="customer-ref-workspace">
    <header className="customer-ref-header">
      <div>{badges}<div className="customer-ref-heading"><h1>{title}</h1><p>{description}</p></div></div>
      <div className="customer-ref-header-actions">{actions}</div>
    </header>
    {children}
  </div>;
}

export function CustomerModal({ open, title, titleId, onClose, onSubmit, busy, error, children }) {
  return <Dialog open={open} onClose={busy ? undefined : onClose} aria-labelledby={titleId} fullWidth maxWidth={false} slotProps={{ paper: { className: "crm-customer-dialog customer-ref-register" } }}>
    <form onSubmit={event => { event.preventDefault(); if (!busy) onSubmit(); }}>
      <header className="customer-ref-modal-header">
        <span className="customer-ref-modal-icon"><Icon name="user_plus" /></span>
        <div className="customer-ref-modal-heading"><div><h2 id={titleId}>{title}</h2><span className={title === "고객 등록" ? "customer-ref-ai-badge" : undefined}>{title === "고객 등록" ? "✨ AI 텍스트·이미지 자동 파싱 탑재" : "생년월일·성별 → 주민번호 7자리 자동완성"}</span></div><p>{title === "고객 등록" ? "상단 AI 입력창에 카톡 대화·메모 텍스트나 명함·스크린샷 이미지를 올리면 고객정보가 자동 입력됩니다." : "카톡대화명과 주소를 입력하면 보조개톡 및 주변 고객 지도와 연동됩니다."}</p></div>
        <button className="customer-ref-close" type="button" disabled={busy} onClick={onClose} aria-label="닫기"><Icon name="close" /></button>
      </header>
      <div className="customer-ref-modal-body">{error && <p className="customer-ref-error" role="alert">{error}</p>}{children}</div>
      <footer className="customer-ref-modal-footer"><span>💡 등록 후에도 고객 상세 화면에서 언제든 수정할 수 있습니다.</span><button type="button" disabled={busy} onClick={onClose}>취소</button><button type="submit" className="customer-ref-primary" disabled={busy}>{busy ? "저장 중…" : "저장"}</button></footer>
    </form>
  </Dialog>;
}

// Header structure from the group/import/batch dialogs in the HTML reference.
export function CustomerPopupHeader({ title, icon, description, onClose, busy, badge = false }) {
  return <header className="customer-popup-header"><div><span className={badge ? "customer-popup-header-badge" : "customer-popup-header-icon"}><Icon name={icon} /></span><div><h2>{title}</h2>{description && <p>{description}</p>}</div></div><button type="button" aria-label={`${title} 닫기`} disabled={busy} onClick={onClose}><Icon name="close" /></button></header>;
}
