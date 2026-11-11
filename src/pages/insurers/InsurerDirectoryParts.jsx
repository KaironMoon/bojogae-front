/* eslint-disable react/prop-types */
import { useCallback, useState } from "react";
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Button, Chip, Dialog, DialogContent, DialogTitle,
  IconButton, Link, Snackbar, Stack, TextField, Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import SmartDisplayOutlinedIcon from "@mui/icons-material/SmartDisplayOutlined";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";

import { ciColor, contactsFor, external, kindLabel, linksFor, portalFor, sourcesFor, videos } from "./insurer-directory";

export function InsurerLogo({ insurer, large = false }) {
  const [failedPath, setFailedPath] = useState(null);
  const { logo } = insurer;
  const path = logo?.path;
  const available = path && path !== failedPath;
  const watchImage = useCallback(node => {
    node?.addEventListener("error", () => setFailedPath(path), { once: true });
  }, [path]);
  return (
    <div className={`insurer-logo-slot${large ? " insurer-logo-slot--large css-sweg9x" : ""}${available ? "" : " insurer-logo-slot--empty"}`}>
      {available ? (
        <svg viewBox={logo.view_box} role="img" aria-label={`${insurer.name} 로고`} preserveAspectRatio="xMidYMid meet">
          <image key={path} ref={watchImage} href={path} width={logo.width} height={logo.height} />
        </svg>
      ) : <span aria-label={`${insurer.name} 로고 없음`}>LOGO AREA<br />{insurer.short_logo_text || insurer.name}</span>}
    </div>
  );
}

export function BrowserBadges({ browser, className }) {
  return browser?.icons?.length ? (
    <Stack className={className} direction="row" flexWrap="wrap" useFlexGap gap={0.5} aria-label="권장 브라우저">
      {browser.icons.map(icon => <Chip key={icon.name} size="small" variant="outlined" label={icon.name} title={browser.value}
        icon={<img src={icon.path} alt="" width="15" height="15" />} />)}
    </Stack>
  ) : <small className={className ? `insurer-muted ${className}` : "insurer-muted"}>{browser?.value || "브라우저 확인 필요"}</small>;
}

export function Sector({ kind }) {
  return <span className={`insurer-sector insurer-sector--${kind}`}>{kindLabel[kind]}</span>;
}

export function FavoriteButton({ name, favorite, onToggle }) {
  return <IconButton className="insurer-favorite" aria-label={`${name} 즐겨찾기`} aria-pressed={favorite}
    title={favorite ? "즐겨찾기 해제" : "즐겨찾기 추가"} onClick={onToggle}>
    {favorite ? <StarRoundedIcon /> : <StarBorderRoundedIcon />}
  </IconButton>;
}

export function VideoLinks() {
  return <Stack direction="row" useFlexGap flexWrap="wrap" gap={1}>
    {videos.map(([label, url], index) => (
      <Button key={url} href={url} {...external} className={`insurer-video-link insurer-video-link--${index + 1}`}
        variant="outlined" size="small" startIcon={<SmartDisplayOutlinedIcon />}
        aria-label={`${label} (새 창)`}>{label}</Button>
    ))}
  </Stack>;
}

function OfficialLink({ link, label, className, variant = "outlined" }) {
  return <Button className={className} href={link?.url || undefined} {...(link?.url ? external : {})} disabled={!link?.url}
    variant={variant} size="small" endIcon={link?.url ? <OpenInNewOutlinedIcon /> : null}
    aria-label={`${label || link.label} (${link?.url ? "새 창" : "주소 미확인"})`}>
    {label || link.label}
  </Button>;
}

function ContactValue({ entry, onCopy }) {
  if (!entry.value) {
    return <span className="insurer-contact"><span>{entry.label}</span><strong>미확인</strong></span>;
  }
  return <button type="button" className="insurer-contact" aria-label={`${entry.label} ${entry.value} 복사`}
    onClick={() => onCopy(entry.value, entry.label)}>
    <span>{entry.label}</span><strong>{entry.value}</strong><ContentCopyRoundedIcon aria-hidden="true" />
  </button>;
}

export function InsurerCard({ insurer, favorite, onToggle, onOpen, onCopy }) {
  const portal = portalFor(insurer);
  const summary = insurer.card_payment.find(entry => entry.label === "구분");
  return <article className="insurer-card" style={{ "--insurer-ci": ciColor(insurer) }}>
    <div className="insurer-card__heading">
      <InsurerLogo insurer={insurer} />
      <div className="insurer-card__identity">
        <div className="insurer-card__name">
          <Typography component="h2">{insurer.name}</Typography>
          <Sector kind={insurer.kind} />
        </div>
        <div className="insurer-card__system">
          {portal && <span title={portal.link.label}>{portal.link.label}</span>}
          {insurer.kind !== "other" && <BrowserBadges browser={insurer.browser} />}
        </div>
      </div>
      <FavoriteButton name={insurer.name} favorite={favorite} onToggle={onToggle} />
    </div>
    <div className="insurer-card__contacts">
      {contactsFor(insurer).slice(0, 4).map(entry => <ContactValue key={entry.label} entry={entry} onCopy={onCopy} />)}
      {summary && <div className="insurer-card__payment"><span>카드납</span> {summary.value}</div>}
    </div>
    <div className="insurer-card__links">
      {linksFor(insurer).slice(0, 4).map((link, index) => (
        <OfficialLink key={link.label} link={link} label={["홈페이지", "청구안내", "약관확인", "청구양식"][index]} />
      ))}
    </div>
    <div className="insurer-card__actions">
      <Button variant="outlined" size="small" onClick={onOpen} aria-label={`${insurer.name} 자세히 보기`}>자세히 보기</Button>
      <OfficialLink link={insurer.kind === "other" ? insurer.website : portal?.link} variant="contained"
        label={insurer.kind === "other" ? "웹사이트" : portal && /GA|교차/i.test(portal.link.label) ? "GA/교차 전산" : "설계사 전산"} />
    </div>
  </article>;
}

function Info({ label, value }) {
  return <div className="insurer-system__info"><dt>{label}</dt><dd>{value || "미확인"}</dd></div>;
}

function SystemCard({ system, defaultBrowser, onCopy }) {
  return <article className="insurer-detail__tile css-1jrmhhe">
    <Typography component="h4">{system.link.label}</Typography>
    <Stack direction="row" useFlexGap flexWrap="wrap" gap={0.75} sx={{ my: 1 }}>
      <OfficialLink link={system.link} label="전산 바로가기" variant="contained" />
      <Button size="small" startIcon={<ContentCopyRoundedIcon />} onClick={() => onCopy(system.link.url, "전산 주소")}>주소 복사</Button>
    </Stack>
    <dl className="insurer-system__details">
      <Info label="지원 브라우저" value={(system.browser || defaultBrowser)?.value} />
      <Info label="보안·필수 프로그램" value={system.security_program?.value} />
      <Info label="로그인·이용 권한" value={system.login?.value} />
    </dl>
  </article>;
}

function CardPayment({ rows, onCopy }) {
  return <section className="insurer-detail__section">
    <div className="insurer-detail__section-heading">
      <Typography className="css-wa9pgr" component="h3">카드납 정보</Typography>
      {!!rows.length && <Button size="small" startIcon={<ContentCopyRoundedIcon />}
        onClick={() => onCopy(rows.map(entry => `${entry.label}: ${entry.value}`).join("\n"), "카드납 기준")}>카드납 기준 복사</Button>}
    </div>
    {rows.length ? <dl className="insurer-detail__grid insurer-detail__grid--four css-dpoqzr">
      {rows.map((entry, index) => <div key={`${entry.label}-${index}`} className="insurer-detail__tile">
        <dt>{entry.label}</dt>
        <dd>{entry.label === "제휴사" ? (
          <div className="insurer-detail__chips">{entry.value.split(/[,，]/).map((card, cardIndex) => card.trim() &&
            <Chip key={cardIndex} size="small" label={card.trim()} />)}</div>
        ) : entry.value}</dd>
      </div>)}
    </dl> : <p className="insurer-muted">등록된 카드납 정보가 없습니다.</p>}
    <small className="insurer-muted css-1nt8e0h">상품·계약 시점에 따라 달라질 수 있으니 보험사 담당자에게 확인해 주세요.</small>
  </section>;
}

function ClaimNotes({ insurer }) {
  return <div className="insurer-detail__tile">
    <Typography component="h4">보험금 청구 세부 기준</Typography>
    <div className="insurer-detail__chips">
      {[insurer.claim_copy_limit, insurer.esign_cutoff_time, ...(insurer.feature_tags || [])].filter(Boolean).map((value, index) => (
        <Chip key={index} size="small" label={value} />
      ))}
    </div>
    {insurer.notes.length > 0 && <dl className="insurer-system__details">
      {insurer.notes.map((entry, index) => <Info key={index} label={entry.label} value={entry.value} />)}
    </dl>}
    {!!insurer.claim_notes?.length && <ul>{insurer.claim_notes.map((note, index) => <li key={index}>{note}</li>)}</ul>}
    {insurer.uw_tip && <p className="insurer-uw-tip"><strong>실무 심사 팁</strong> {insurer.uw_tip}</p>}
    {!insurer.claim_copy_limit && <p className="insurer-muted">사본 청구 한도는 보험사의 공식 청구 안내를 확인해 주세요.</p>}
  </div>;
}

function Memo({ value, onSave }) {
  const [draft, setDraft] = useState(value);
  return <div className="insurer-detail__tile">
    <Typography component="h4">내 지점 매니저·전산 코드 메모</Typography>
    <TextField fullWidth multiline minRows={3} maxRows={7} size="small" label="내 메모"
      placeholder="담당자 연락처나 전산 사번을 적어 두세요." value={draft} onChange={event => setDraft(event.target.value)}
      slotProps={{ htmlInput: { maxLength: 1000 } }} sx={{ my: 1.5 }} />
    <Button variant="contained" size="small" onClick={() => onSave(draft)} disabled={draft === value}>저장</Button>
    <p className="insurer-muted">이 브라우저의 현재 계정에 저장됩니다.</p>
    <VideoLinks />
  </div>;
}

function Sources({ sources }) {
  return <Accordion disableGutters elevation={0} className="insurer-detail__sources css-26brsf">
    <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
      <Typography component="span" fontWeight={850}>자료 출처·확인일</Typography>
    </AccordionSummary>
    <AccordionDetails>
      {sources.length ? <div className="insurer-detail__grid insurer-detail__grid--two">
        {sources.map(entry => <div className="insurer-detail__tile" key={`${entry.source_url}|${entry.checked_at}`}>
          <strong>{entry.label}</strong>
          <p><Link href={entry.source_url} {...external}>출처 확인 (새 창)</Link> · <time>{entry.checked_at}</time></p>
        </div>)}
      </div> : <p className="insurer-muted">등록된 자료 출처가 없습니다.</p>}
    </AccordionDetails>
  </Accordion>;
}

function fullInformation(insurer, contacts, links, sources) {
  const rows = (entries, field) => entries.map(entry => `${entry.label}: ${entry[field] || "미확인"}`).join("\n");
  const systems = insurer.systems.map(system => [
    `${system.link.label}: ${system.link.url}`, `지원 브라우저: ${(system.browser || insurer.browser)?.value || "미확인"}`,
    `보안·필수 프로그램: ${system.security_program?.value || "미확인"}`, `로그인·이용 권한: ${system.login?.value || "미확인"}`,
  ].join("\n"));
  return [
    `${insurer.name} · ${kindLabel[insurer.kind]}`, insurer.browser?.value, rows(links, "url"), rows(contacts, "value"),
    rows(insurer.card_payment, "value"), ...systems, rows(insurer.notes, "value"),
    insurer.claim_copy_limit, insurer.esign_cutoff_time, (insurer.feature_tags || []).join(", "),
    ...(insurer.claim_notes || []), insurer.uw_tip,
    ...sources.map(source => `${source.label}: ${source.source_url} (${source.checked_at})`),
  ].filter(Boolean).join("\n\n");
}

export function InsurerDetailDialog({ insurer, open, favorite, memo, onClose, onExited, onToggle, onSaveMemo, onCopy, notice, onDismissNotice }) {
  const links = insurer ? linksFor(insurer) : [];
  const contacts = insurer ? contactsFor(insurer) : [];
  const sources = insurer ? sourcesFor(insurer) : [];
  const portal = insurer ? portalFor(insurer) : null;
  const lcPortal = insurer?.systems.find(system => /\bLC\b|전속/i.test(system.link.label));
  return <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth aria-labelledby="insurer-detail-title"
    slotProps={{ transition: { onExited }, paper: { className: "insurer-detail", sx: { maxWidth: 920, m: { xs: 1, sm: 3 }, width: { xs: "calc(100% - 16px)", sm: "calc(100% - 48px)" } } } }}>
    {insurer && <>
      <header className="insurer-detail__header" style={{ "--insurer-ci": ciColor(insurer) }}>
        <div>
          <DialogTitle id="insurer-detail-title" className="css-7cjhhb"><span className="css-1itxtsy">{insurer.name}</span></DialogTitle>
          <Sector kind={insurer.kind} />
        </div>
        <Stack direction="row" alignItems="center" useFlexGap flexWrap="wrap" gap={0.5}>
          <Button size="small" variant="outlined" startIcon={<ContentCopyRoundedIcon />}
            onClick={() => onCopy(fullInformation(insurer, contacts, links, sources), "전체 정보")}>전체 정보 복사</Button>
          <FavoriteButton name={insurer.name} favorite={favorite} onToggle={onToggle} />
          <IconButton onClick={onClose} aria-label="상세 정보 닫기"><CloseRoundedIcon /></IconButton>
        </Stack>
      </header>
      <DialogContent className="insurer-detail__content" dividers>
        <section aria-label="보험사 로고와 공식 바로가기" className="insurer-detail__section">
          <div className="insurer-detail__section-heading">
            <InsurerLogo insurer={insurer} large />
            {(insurer.browser || insurer.kind !== "other") && <BrowserBadges className="css-1co4l1n" browser={insurer.browser} />}
          </div>
          <div className="insurer-detail__official css-17outbb">
            {links.map((link, index) => <OfficialLink key={`${link.label}-${index}`} link={link} />)}
          </div>
          {!insurer.claim && <small className="insurer-muted">보험금 청구 안내는 공식 홈페이지에서 확인해 주세요.</small>}
        </section>
        <section className="insurer-detail__section">
          <Typography component="h3">핵심 연락처</Typography>
          <div className="insurer-detail__grid insurer-detail__grid--four insurer-detail__contacts css-c7fp9u">
            {contacts.map((entry, index) => <ContactValue key={`${entry.label}-${index}`} entry={entry} onCopy={onCopy} />)}
          </div>
        </section>
        <CardPayment rows={insurer.card_payment} onCopy={onCopy} />
        <section className="insurer-detail__section">
          <Typography className="css-19pwusq" component="h3">설계사 업무 시스템</Typography>
          {insurer.systems.length ? (
            <div className="insurer-detail__grid insurer-detail__grid--two">
              {insurer.systems.map((system, index) => <SystemCard key={`${system.link.url}-${index}`} system={system} defaultBrowser={insurer.browser} onCopy={onCopy} />)}
            </div>
          ) : <p className="insurer-muted">등록된 설계사 업무 시스템이 없습니다.</p>}
          <small className="insurer-muted css-np7jog">브라우저 안내는 보험사 업무 시스템에 대한 정보입니다. 미확인 항목은 보험사 또는 소속 담당자에게 확인해 주세요.</small>
        </section>
        <section className="insurer-detail__section">
          <Typography component="h3">청구 안내와 내 메모</Typography>
          <div className="insurer-detail__grid insurer-detail__grid--two">
            <ClaimNotes insurer={insurer} />
            <Memo key={insurer.id} value={memo} onSave={onSaveMemo} />
          </div>
        </section>
        <Sources sources={sources} />
      </DialogContent>
      <footer className="insurer-detail__footer">
        <Button component={RouterLink} to="/help/contact" size="small" startIcon={<FlagOutlinedIcon />}>정보 오류 수정 문의</Button>
        <div>
          <Button onClick={onClose} size="small" variant="outlined">닫기</Button>
          {lcPortal && <OfficialLink link={lcPortal.link} label="LC 전용 포털" className="insurer-detail__lc-link" variant="contained" />}
          {portal && <OfficialLink link={portal.link} label={/GA|교차/i.test(portal.link.label) ? "GA/교차 전용 포털 바로가기" : "설계사 전산 바로가기"} variant="contained" />}
        </div>
      </footer>
      {notice && <Snackbar key={notice.message} open autoHideDuration={2700}
        onClose={(_, reason) => reason !== "clickaway" && onDismissNotice()}>
        <Alert severity={notice.severity} variant="filled" onClose={onDismissNotice}>{notice.message}</Alert>
      </Snackbar>}
    </>}
  </Dialog>;
}
