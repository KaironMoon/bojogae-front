/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardBannerImageUrl } from "@/services/dashboard-service";
import Icon from "./HomeIcon";
const campaigns = [
  {
    title: "필요한 보고서를 선택하고\n고객 맞춤 상담을 시작하세요",
    tag: "보조개 AI 보고서",
    badge: "BOJOGAE AI REPORT",
    description:
      "보장분석부터 상품 비교까지, 실전 상담에 필요한 보고서를 확인하세요.",
    to: "/proposals?tab=all",
    cta: "보고서 만들기 →",
    icon: "file-text",
  },
  {
    title: "보험금 청구서 자동작성 후\n모바일에서 무료 팩스 발송",
    tag: "보험금 청구 · 모바일팩스 무료",
    badge: "FREE MOBILE FAX",
    description: "여러 보험사의 청구서를 한 번에 작성하고 모바일로 공유하세요.",
    to: "/claims/new",
    cta: "보험금 청구 바로가기 →",
    icon: "receipt",
  },
  {
    title: "자주 쓰는 상담 문구와 서명을\n보조개톡에 연결하세요",
    tag: "카톡 상용구·서명 관리",
    badge: "BOJOGAETALK",
    description: "고객 안내에 필요한 상용구와 서명을 관리하세요.",
    to: "/kakao-message-templates/snippets",
    cta: "상용구 관리 바로가기 →",
    icon: "message-circle",
  },
  {
    title: "내고객·계약과 일정을\n한 곳에서 확인하세요",
    tag: "내고객·계약 업무",
    badge: "CUSTOMER MANAGEMENT",
    description:
      "생일·상령일·면책·감액종료 참고 일정과 오늘 할 일을 확인하세요.",
    to: "/crm/tasks",
    cta: "오늘의 업무 보기 →",
    icon: "calendar-days",
  },
];
export default function HomeBanner({ banners = [] }) {
  const slides = banners.length ? banners : campaigns;
  const [index, setIndex] = useState(0),
    [playing, setPlaying] = useState(true);
  const current = index % slides.length,
    ad = slides[current];
  useEffect(() => {
    if (!playing || slides.length < 2) return;
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      6000,
    );
    return () => clearInterval(timer);
  }, [playing, slides.length]);
  const content = (
    <>
      <div className="space-y-2.5 z-10 max-w-[68%]">
        <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-[10px] font-black tracking-wider text-emerald-300">
          {ad.badge || "BOJOGAE"}
        </span>
        <h3 className="text-base sm:text-lg font-black leading-snug whitespace-pre-line text-white">
          {ad.title}
        </h3>
        <p className="text-[11.5px] font-medium text-slate-300 leading-relaxed">
          {ad.description}
        </p>
        {(ad.to || ad.link_url) && (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#03c75a] text-white text-xs font-black shadow-md">
            {ad.cta || "자세히 보기 →"}
          </span>
        )}
      </div>
      {!ad.id && (
        <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
          <div className="absolute inset-0 rounded-2xl bg-[#03c75a]/25 blur-xl anim-glow" />
          <div className="relative w-20 h-24 rounded-xl bg-white text-[#121314] p-2 shadow-xl border-2 border-[#03c75a] anim-float overflow-hidden flex flex-col items-center justify-between">
            <div className="w-full h-1 bg-[#03c75a] absolute left-0 anim-scan" />
            <span className="text-[8px] font-black text-primary">
              BOJOGAE AI
            </span>
            <Icon name={ad.icon} className="w-8 h-8 text-primary" />
            <span className="text-[8px] font-black">나의 업무 비서</span>
          </div>
        </div>
      )}
    </>
  );
  const stageClass =
    "home-ad-stage flex-1 p-5 relative overflow-hidden flex items-center justify-between gap-4 min-h-[210px] text-white " +
    [
      "bg-gradient-to-br from-[#064e3b] via-[#0f172a] to-[#1e1b4b]",
      "bg-gradient-to-br from-[#1e1b4b] via-[#311042] to-[#121314]",
      "bg-gradient-to-br from-[#121314] via-[#1f2937] to-[#065f46]",
      "bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#1e1b4b]",
    ][current % 4];
  const style = ad.id
    ? {
        "--banner-desktop": `url("${dashboardBannerImageUrl(ad.id, ad.image_revision)}")`,
        "--banner-mobile": `url("${dashboardBannerImageUrl(ad.id, ad.mobile_image_revision || ad.image_revision, "mobile")}")`,
      }
    : undefined;
  return (
    <div className="lg:col-span-5 ns-card bg-white border-2 border-[#e6eaee] overflow-hidden flex flex-col justify-between relative shadow-sm">
      <div className="px-4 py-2.5 bg-[#121314] text-white flex items-center justify-between gap-2 text-[11px] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-2 py-0.5 rounded bg-gradient-to-r from-[#03c75a] to-[#6b38fb] text-white text-[10px] font-black tracking-wider shrink-0">
            BOJOGAE LIVE
          </span>
          <span className="font-extrabold text-emerald-300 truncate">
            {ad.tag || ad.title}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setPlaying(!playing)}
            aria-label={playing ? "배너 일시정지" : "배너 재생"}
            className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-bold text-slate-300"
          >
            {playing ? "⏸ 일시정지" : "▶ 재생"}
          </button>
          <span className="font-mono font-black text-xs text-white">
            {current + 1} / {slides.length}
          </span>
        </div>
      </div>
      {ad.to ? (
        <Link to={ad.to} className={stageClass}>
          {content}
        </Link>
      ) : ad.link_url ? (
        <a
          href={ad.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className={stageClass}
          style={style}
        >
          {content}
        </a>
      ) : (
        <div className={stageClass} style={style}>
          {content}
        </div>
      )}
      <div className="px-4 py-2.5 bg-[#f8fafc] border-t border-[#e6eaee] flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.id || s.to}
              type="button"
              aria-label={`${i + 1}번째 배너`}
              aria-current={current === i ? "true" : undefined}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${current === i ? "w-6 bg-[#03c75a]" : "w-2 bg-slate-300"}`}
            />
          ))}
        </div>
        <a
          href="https://pf.kakao.com/_xjaxjmX/chat"
          target="_blank"
          rel="noopener noreferrer"
          className="font-extrabold text-[#64748b] flex items-center gap-1"
        >
          <Icon name="megaphone" className="w-3 h-3 text-sub" />
          보조개·제휴 배너 광고 안내 ↗
        </a>
      </div>
    </div>
  );
}
