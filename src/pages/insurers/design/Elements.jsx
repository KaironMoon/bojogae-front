/* eslint-disable react/prop-types */
import { useState } from "react";
import Icon from "./InsurerIcon";
import { external, kindLabel } from "../insurer-directory";
export function PortalLink({ href, children, ...props }) {
  return href ? (
    <a href={href} {...external} {...props}>
      {children}
    </a>
  ) : (
    <span {...props} aria-disabled="true" title="정보 준비 중입니다.">
      {children}
      <span className="insurer-unavailable">준비 중</span>
    </span>
  );
}
// Preserve the reference footer button even when a portal is not registered.
export function FooterPortalLink({href,children,...props}) {
  return href ? <a href={href} {...external} {...props}>{children}</a> :
    <button {...props} type="button" disabled title="포털 주소 준비 중입니다.">{children}<span className="insurer-unavailable">준비 중</span></button>;
}
export function Logo({ insurer, large = false }) {
  const [failed, setFailed] = useState(null),
    logo = insurer.logo,
    valid = logo?.path && failed !== logo.path;
  return (
    <div
      className={`reference-logo ${large ? "reference-logo-large" : ""} ${valid ? "" : "reference-logo-empty"}`}
    >
      {valid ? (
        <svg
          viewBox={logo.view_box}
          role="img"
          aria-label={`${insurer.name} 로고`}
          preserveAspectRatio="xMidYMid meet"
        >
          <image
            href={logo.path}
            width={logo.width}
            height={logo.height}
            ref={(node) => {
              if (node) node.onerror = () => setFailed(logo.path);
            }}
          />
        </svg>
      ) : (
        <span>
          LOGO AREA
          <br />
          {insurer.short_logo_text || insurer.name}
        </span>
      )}
    </div>
  );
}
export function Sector({ kind }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full border text-[10px] font-black ${kind === "life" ? "bg-sub-soft text-sub border-purple-200" : kind === "non_life" ? "bg-primary-soft text-primary border-emerald-200" : "bg-amber-50 text-[#92400e] border-amber-200"}`}
    >
      {kindLabel[kind]}
    </span>
  );
}
export function Browser({ browser }) {
  return (
    <div className="css-1co4l1n flex items-center gap-2">
      {browser?.icons?.length ? (
        browser.icons.map((icon) => (
          <span
            key={icon.name}
            title={browser.value}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f8fafc] border border-[#d1d6db] text-xs font-extrabold text-[#121314]"
          >
            <img src={icon.path} alt="" width="16" height="16" />
            {icon.name}
          </span>
        ))
      ) : (
        <span className="text-[11px] text-[#8b95a1]">
          {browser?.value || "권장 브라우저 확인 필요"}
        </span>
      )}
    </div>
  );
}
const linkIcons = [
  "globe",
  "clipboard-check",
  "book-open-check",
  "file-down",
  "smile-plus",
];
const linkStyles = [
  "bg-[#f8fafc] hover:bg-primary-soft text-[#121314]",
  "bg-primary-soft/60 hover:bg-primary-soft border-emerald-200 text-primary",
  "bg-sub-soft/60 hover:bg-sub-soft border-purple-200 text-sub",
  "bg-[#f8fafc] hover:bg-amber-50 text-[#121314]",
];
export function OfficialLinks({ items }) {
  return items.map((link, i) => (
    <PortalLink
      key={`${link.label}-${i}`}
      href={link.url}
      aria-label={`${link.label} (새 창)`}
      className={`px-3 py-2.5 rounded-xl border border-[#e6eaee] ${linkStyles[i] || linkStyles[3]} text-xs font-extrabold flex items-center justify-between gap-1.5 transition-all`}
    >
      <span className="flex items-center gap-1.5">
        <Icon
          name={linkIcons[i] || "external-link"}
          className="w-3.5 h-3.5 shrink-0"
        />
        {link.label}
      </span>
      <Icon name="external-link" className="w-3 h-3 shrink-0 opacity-70" />
    </PortalLink>
  ));
}
const contactStyles = [
  "bg-[#f8fafc] border-[#e6eaee]",
  "bg-primary-soft/40 border-emerald-200",
  "bg-sub-soft/40 border-purple-200",
  "bg-[#fffbeb] border-amber-200",
];
const contactColors = [
  "text-[#121314]",
  "text-[#121314]",
  "text-sub",
  "text-[#121314]",
];
const hints = [
  "대표 ARS · 증명서 · 일반문의",
  "완전판매 모니터링 · 해피콜 직통",
  "설계사 전산 · 수납 · 심사 문의",
  "청구서류 팩스 접수",
];
export function Contacts({ items, copy, claimLimit }) {
  return items.map((entry, i) => (
    <button
      type="button"
      key={`${entry.label}-${i}`}
      disabled={!entry.value}
      onClick={() => copy(entry.value, entry.label)}
      className={`text-left p-3.5 rounded-2xl border hover:border-primary transition-all ${contactStyles[i] || contactStyles[0]}`}
    >
      <div className="flex items-center justify-between">
        <p
          className={`text-[11px] font-bold ${i === 1 ? "text-primary" : i === 2 ? "text-sub" : i === 3 ? "text-[#92400e]" : "text-[#8b95a1]"}`}
        >
          {entry.label}
        </p>
        <span className={`text-[10px] font-extrabold ${i===2?"text-sub":i===3?"text-[#92400e]":"text-primary"} flex items-center gap-0.5`}>
          <Icon name="copy" className="w-2.5 h-2.5" />
          복사
        </span>
      </div>
      <p
        className={`text-base font-black mt-1 break-words ${contactColors[i] || contactColors[0]}`}
      >
        {entry.value || "미확인"}
      </p>
      <span
        className={`text-[10px] ${i === 3 ? "font-bold text-[#92400e]" : i ? "text-[#4e5968]" : "text-[#8b95a1]"}`}
      >
        {i === 3 ? claimLimit || "사본 청구 한도 확인 필요" : hints[i]}
      </span>
    </button>
  ));
}
export function Payments({ items }) {
  const labels = ["구분", "수납", "카드 범위", "제휴사"],
    rows = [
      ...labels.map(
        (label) => items.find((e) => e.label === label) || { label },
      ),
      ...items.filter((e) => !labels.includes(e.label)),
    ];
  return rows.map((e, i) => (
    <div
      key={`${e.label}-${i}`}
      className="css-r0y72f p-3 rounded-xl bg-[#f8fafc] border border-[#e6eaee]"
    >
      <dt className="css-yc8tle text-[11px] font-bold text-[#8b95a1]">
        {e.label}
      </dt>
      <dd
        className={`css-n8gfvj text-xs font-black mt-1 ${i === 0 ? "text-primary" : "text-[#121314]"}`}
      >
        {e.label === "제휴사" && e.value ? (
          <div className="flex flex-wrap gap-1">
            {e.value
              .split(/[,，]/)
              .filter((c) => c.trim())
              .map((c, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-white border border-[#d1d6db] text-[10.5px] font-extrabold text-[#121314]"
                >
                  {c.trim()}
                </span>
              ))}
          </div>
        ) : (
          e.value || "정보 준비 중입니다."
        )}
      </dd>
    </div>
  ));
}
export function Systems({ items, browser, copy }) {
  const ga =
    items.find((s) => /GA|교차/i.test(s.link.label)) ||
    items.find((s) => !/\bLC\b|전속/i.test(s.link.label));
  const lc = items.find((s) => /\bLC\b|전속/i.test(s.link.label));
  const rows = [
    ga || { link: { label: "GA/교차 전용 포털" } },
    lc || { link: { label: "LC 전용 포털" } },
    ...items.filter((s) => s !== ga && s !== lc),
  ];
  return rows.map((s, i) => (
    <div
      key={`${s.link.label}-${i}`}
      className={`css-1jrmhhe p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${i === 0 ? "bg-primary-soft/35 border-emerald-200" : "bg-[#f8fafc] border-[#e6eaee]"}`}
    >
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`px-2 py-0.5 rounded text-white text-[10px] font-black ${i === 0 ? "bg-primary" : "bg-[#121314]"}`}
          >
            {i === 0
              ? "GA / 교차 설계사 전용"
              : i === 1
                ? "전속 LC 전용"
                : "설계사 업무 시스템"}
          </span>
          <button
            type="button"
            disabled={!s.link.url}
            onClick={() => copy(s.link.url, "전산 주소")}
            className={`text-[11px] font-extrabold ${i===0?"text-primary":"text-[#4e5968]"} flex items-center gap-1`}
          >
            <Icon name="copy" className="w-3 h-3" />
            주소 복사
          </button>
        </div>
        <PortalLink
          href={s.link.url}
          className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-black flex items-center justify-between ${i === 0 ? "bg-primary text-white" : "bg-white border-2 border-[#121314] text-[#121314]"}`}
        >
          {s.link.label}
          <Icon name="external-link" className="w-4 h-4" />
        </PortalLink>
        <div className="space-y-2 pt-1 text-xs">
          {[
            ["지원 브라우저", (s.browser || browser)?.value],
            ["보안·필수 프로그램", s.security_program?.value],
            ["로그인·이용 권한", s.login?.value],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-[11px] font-extrabold text-[#8b95a1]">
                {label}
              </p>
              <p className={`mt-0.5 ${label==="지원 브라우저"?"font-bold text-[#121314]":"font-semibold text-[#4e5968]"}`}>
                {value || "정보 준비 중입니다."}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  ));
}
