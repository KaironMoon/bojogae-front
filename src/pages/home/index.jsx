/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Dialog } from "@mui/material";
import { useAuth } from "@/auth/AuthContext";
import { getDashboard } from "@/services/dashboard-service";
import { getPromptOptions } from "@/services/proposal-service";
import { promptPreviewImageUrl } from "@/services/prompt-service";
import { crmGet } from "@/services/crm-service";
import HomeReference from "./design/HomeReference";
import ReportCard from "./design/ReportCard";
import HomeBanner from "./design/HomeBanner";
import Icon from "./design/HomeIcon";
import "./design/source.css";
import "./design/utilities.css";
import "./design/integration.css";
const STATUS = {
  QUEUED: "대기 중",
  RUNNING: "생성 중",
  CANCEL_REQUESTED: "취소 중",
  COMPLETED: "완료",
  FAILED: "실패",
  CANCELLED: "취소됨",
};
const BOARDS = {
  notices: "공지사항",
  "industry-news": "업계소식",
  "insurance-knowledge": "보험 지식",
};
const EVENT_LABELS = {
  BIRTHDAY: "🎂 생일",
  SANGNYEONG: "📈 상령일",
  EXEMPTION: "🛡️ 면책종료",
  REDUCTION: "🎉 감액종료",
};
const EVENT_STYLES = {
  BIRTHDAY: "border-rose-200 hover:border-[#f04452] text-[#e11d48]",
  SANGNYEONG: "border-amber-300 hover:border-amber-500 text-[#b45309]",
  EXEMPTION: "border-emerald-300 hover:border-primary text-[#00913f]",
  REDUCTION: "border-purple-200 hover:border-sub text-sub",
};
const TRACKS = { latest: "newReportsTrack", updated: "updatedReportsTrack" };
function Empty({ children }) {
  return <p className="p-4 text-xs text-[#64748b]">{children}</p>;
}
function Ranking({ items = [], loading }) {
  return items.length ? (
    items.map((p, i) => (
      <div
        key={p.id}
        className="p-3 rounded-xl border border-[#e6eaee] hover:border-primary hover:bg-[#f8fafc] transition-all"
      >
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span
              className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${i < 3 ? "bg-[#03c75a] text-white" : "bg-[#f4f6f8] text-[#475569]"}`}
            >
              {i + 1}
            </span>
            <Link
              to={`/proposals?promptId=${p.id}`}
              className="text-xs sm:text-[13.5px] font-extrabold text-[#121314] truncate"
              title={p.title}
            >
              {p.title}
            </Link>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2 py-0.5 rounded-md bg-[#f4f6f8] text-[#64748b] text-[11px] font-bold">
              {p.usage_count.toLocaleString("ko-KR")}회 사용
            </span>
            <Link
              to={`/proposals?promptId=${p.id}`}
              className="px-2.5 py-1 rounded-lg bg-primary-soft hover:bg-[#03c75a] text-primary hover:text-white text-xs font-black"
            >
              만들기
            </Link>
          </div>
        </div>
      </div>
    ))
  ) : (
    <Empty>
      {loading ? "보고서를 불러오는 중입니다." : "아직 사용 기록이 없습니다."}
    </Empty>
  );
}
function PreviewImage({ prompt, image, index }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <Empty>미리보기 이미지를 불러오지 못했습니다.</Empty>
  ) : (
    <img
      className="w-full rounded-xl border border-[#e6eaee]"
      src={promptPreviewImageUrl(
        prompt.id,
        prompt.preview_image_revision,
        image.id,
      )}
      alt={`${prompt.title} 미리보기 ${index + 1}`}
      onError={() => setFailed(true)}
    />
  );
}
export default function Home() {
  const { user } = useAuth();
  const [data, setData] = useState(null),
    [crm, setCrm] = useState(null),
    [workspace, setWorkspace] = useState(null),
    [prompts, setPrompts] = useState(null),
    [errors, setErrors] = useState({}),
    [preview, setPreview] = useState(null),
    [indices, setIndices] = useState({ latest: 0, updated: 0 });
  const root = useRef(null);
  useEffect(() => {
    let active = true;
    const load = (name, request, set) =>
      request
        .then((value) => {
          if (active) set(value);
        })
        .catch(() => {
          if (active) setErrors((current) => ({ ...current, [name]: true }));
        });
    load("dashboard", getDashboard(), setData);
    load("crm", crmGet("/summary"), setCrm);
    load(
      "events",
      crmGet("/tasks/workspace", { scope: "TODAY" }),
      setWorkspace,
    );
    load("prompts", getPromptOptions(), setPrompts);
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const cleanups = [];
    for (const [key, id] of Object.entries(TRACKS)) {
      const el = root.current?.querySelector(`#${id}`);
      if (!el) continue;
      const update = () => {
        const cards = [...el.children];
        const closest = cards.reduce(
          (best, card, i) =>
            Math.abs(card.offsetLeft - cards[0].offsetLeft - el.scrollLeft) <
            best.distance
              ? {
                  index: i,
                  distance: Math.abs(
                    card.offsetLeft - cards[0].offsetLeft - el.scrollLeft,
                  ),
                }
              : best,
          { index: 0, distance: Infinity },
        );
        const activeIndex =
          el.scrollLeft > 0 &&
          el.scrollLeft + el.clientWidth >= el.scrollWidth - 2
            ? cards.length - 1
            : closest.index;
        setIndices((current) =>
          current[key] === activeIndex
            ? current
            : { ...current, [key]: activeIndex },
        );
      };
      el.addEventListener("scroll", update, { passive: true });
      window.addEventListener("resize", update);
      update();
      cleanups.push(() => {
        el.removeEventListener("scroll", update);
        window.removeEventListener("resize", update);
      });
    }
    return () => cleanups.forEach((fn) => fn());
  }, [data]);
  const go = (key, i) => {
    const track = root.current?.querySelector(`#${TRACKS[key]}`);
    const card = track?.children[i];
    if (card)
      track.scrollTo({
        left: card.offsetLeft - track.children[0].offsetLeft,
        behavior: "smooth",
      });
  };
  const favorites = prompts?.filter((p) => p.is_favorite) || [];
  const cards = (items, updated = false) =>
    items?.length ? (
      items.map((p) => (
        <ReportCard
          key={p.id}
          prompt={p}
          updated={updated}
          onPreview={setPreview}
        />
      ))
    ) : (
      <Empty>
        {!data && !errors.dashboard
          ? "보고서를 불러오는 중입니다."
          : errors.dashboard
            ? "보고서를 불러오지 못했습니다."
            : "등록된 보고서가 없습니다."}
      </Empty>
    );
  const vm = {
    name: user?.display_name || "고객",
    promptCount: prompts?.length ?? "—",
    favoriteCount: prompts ? favorites.length : "—",
    newsCount: data?.latest_posts.length ?? "—",
    number: (key) =>
      data ? Number(data.summary[key]).toLocaleString("ko-KR") : "—",
    crmLabel: (key, prefix, suffix) =>
      prefix +
      (crm
        ? (key === "today" || key === "overdue"
            ? crm[key].total
            : crm[key]
          ).toLocaleString("ko-KR")
        : "—") +
      suffix,
    favorites: (
      <div className="relative z-10 pt-4 mt-4 border-t border-white/10 flex items-center gap-1.5 flex-wrap text-[11px]">
        <span className="font-extrabold text-amber-300 mr-1">
          ⭐ 내 즐겨찾기 바로실행:
        </span>
        {favorites.slice(0, 4).map((p) => (
          <Link
            key={p.id}
            to={`/proposals?promptId=${p.id}`}
            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[#03c75a] text-white font-bold transition-colors"
          >
            {p.title}
          </Link>
        ))}
        {!favorites.length && (
          <Link to="/proposals?tab=favorites" className="text-white">
            {errors.prompts
              ? "즐겨찾기 조회 불가 · 보고서에서 확인"
              : prompts
                ? "즐겨찾기를 등록해 주세요."
                : "불러오는 중…"}
          </Link>
        )}
      </div>
    ),
    banner: <HomeBanner banners={data?.banners} />,
    events: workspace?.events?.length ? (
      workspace.events.slice(0, 4).map((e) => (
        <Link
          key={e.key}
          to={e.contract_id ? "/crm/contracts" : "/crm/tasks"}
          className={`px-2.5 py-1.5 rounded-lg bg-white border text-left flex items-center justify-between gap-1 ${EVENT_STYLES[e.category] || EVENT_STYLES.EXEMPTION}`}
        >
          <span className="font-bold text-[#121314] truncate">
            {EVENT_LABELS[e.category] || e.title}: {e.customer_name}
          </span>
          <span className="text-[10px] font-black shrink-0">
            {e.days === 0 ? "D-Day" : `D-${e.days}`}
          </span>
        </Link>
      ))
    ) : (
      <p className="col-span-2 text-[#64748b] py-2">
        {errors.events
          ? "고객 이벤트를 불러오지 못했습니다."
          : workspace
            ? "오늘부터 7일 이내의 고객 이벤트가 없습니다."
            : "고객 이벤트를 불러오는 중입니다."}
      </p>
    ),
    latest: cards(data?.latest_prompts),
    updated: cards(data?.updated_prompts, true),
    popular: (
      <Ranking
        items={data?.popular_prompts}
        loading={!data && !errors.dashboard}
      />
    ),
    personal: (
      <Ranking
        items={data?.personal_prompts}
        loading={!data && !errors.dashboard}
      />
    ),
    slide: (id, direction) => {
      const key = id === TRACKS.latest ? "latest" : "updated";
      const count =
        data?.[key === "latest" ? "latest_prompts" : "updated_prompts"]
          ?.length || 0;
      go(key, Math.max(0, Math.min(count - 1, indices[key] + direction)));
    },
    dots: (key) => (
      <div className="flex items-center justify-center gap-1.5 pt-1">
        {(
          data?.[key === "latest" ? "latest_prompts" : "updated_prompts"] || []
        ).map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => go(key, i)}
            aria-label={`${key === "latest" ? "새로 나온" : "업데이트된"} 보고서 ${i + 1}번째로 이동`}
            aria-current={indices[key] === i ? "true" : undefined}
            className={`h-1.5 rounded-full ${indices[key] === i ? (key === "latest" ? "w-5 bg-primary" : "w-5 bg-sub") : "w-1.5 bg-slate-300"}`}
          />
        ))}
      </div>
    ),
    recent: data?.recent_reports.length ? (
      data.recent_reports.map((r) => (
        <div
          key={r.id}
          className="py-3 px-2 hover:bg-[#f8fafc] rounded-xl flex items-center justify-between gap-3 transition-colors"
        >
          <Link
            to={`/proposals?generationId=${r.id}`}
            className="flex items-center gap-3 min-w-0"
          >
            <span className="w-9 h-9 rounded-xl bg-primary-soft text-primary font-black text-xs flex items-center justify-center shrink-0">
              {r.title.slice(0, 1)}
            </span>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-black text-[#121314] truncate">
                {r.title}
              </p>
              <span className="text-[11px] font-semibold text-[#64748b] block truncate">
                {r.prompt_title} ·{" "}
                {new Date(r.created_at).toLocaleDateString("ko-KR")}
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to={`/proposals?promptId=${r.prompt_id}`}
              className="text-[11px] font-extrabold text-sub hover:underline hidden sm:inline"
            >
              같은 양식 만들기
            </Link>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${r.status === "FAILED" ? "bg-rose-50 text-[#f04452]" : "bg-primary-soft text-primary border border-emerald-200"}`}
            >
              {STATUS[r.status] || r.status}
            </span>
          </div>
        </div>
      ))
    ) : (
      <Empty>
        {!data && !errors.dashboard
          ? "작업을 불러오는 중입니다."
          : "아직 만든 보고서가 없습니다."}
      </Empty>
    ),
    news: data?.latest_posts.length ? (
      data.latest_posts.map((p) => (
        <Link
          key={p.id}
          to={`/board/posts/${p.id}`}
          className="block p-3.5 rounded-2xl bg-[#f8fafc] hover:bg-primary-soft/40 border border-[#e6eaee] hover:border-primary transition-all"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`px-2 py-0.5 rounded-md text-[10.5px] font-black shrink-0 ${p.board_type === "notices" ? "bg-[#121314] text-emerald-400" : "bg-sub-soft text-sub"}`}
              >
                {BOARDS[p.board_type] || p.category}
              </span>
              <p className="text-xs sm:text-[13.5px] font-extrabold text-[#121314] truncate">
                {p.title}
              </p>
            </div>
            <Icon
              name="chevron-right"
              className="w-4 h-4 text-[#64748b] shrink-0"
            />
          </div>
        </Link>
      ))
    ) : (
      <Empty>
        {!data && !errors.dashboard
          ? "소식을 불러오는 중입니다."
          : "등록된 소식이 없습니다."}
      </Empty>
    ),
  };
  return (
    <>
      <div ref={root} className="home-design home-workspace">
        {Object.keys(errors).length > 0 && (
          <div
            role="alert"
            className="mb-4 p-4 rounded-xl bg-rose-50 text-[#f04452] text-sm"
          >
            {errors.dashboard ? "홈 정보를 불러오지 못했습니다. " : ""}
            {errors.crm ? "고객·계약 집계를 불러오지 못했습니다. " : ""}
            {errors.events ? "고객 이벤트 조회에 실패했습니다. " : ""}
            {errors.prompts ? "프롬프트 정보를 불러오지 못했습니다. " : ""}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="font-bold underline"
            >
              다시 시도
            </button>
          </div>
        )}
        <HomeReference vm={vm} />
      </div>
      <Dialog
        aria-labelledby="home-preview-title"
        open={!!preview}
        onClose={() => setPreview(null)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { className: "home-design home-preview-dialog" } }}
      >
        {preview && (
          <>
            <div className="bg-[#121314] text-white px-6 py-4 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="px-2.5 py-1 rounded-lg bg-[#03c75a] text-white text-xs font-black shrink-0">
                  미리보기
                </span>
                <div className="min-w-0">
                  <h2 id="home-preview-title" className="text-base font-black">
                    {preview.title}
                  </h2>
                  <p className="text-[11px] text-emerald-400">
                    보고서 · {preview.point_cost}꼬막
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="미리보기 닫기"
                onClick={() => setPreview(null)}
                className="text-slate-400 hover:text-white"
              >
                <Icon name="x" className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 bg-[#f8fafc] text-xs">
              <div className="p-3.5 rounded-2xl bg-primary-soft/60 border border-emerald-200 text-[#121314] font-semibold leading-relaxed">
                {prompts?.find((p) => p.id === preview.id)?.description ||
                  "등록된 보고서 미리보기입니다. 실제 생성 결과는 입력 자료에 따라 달라질 수 있습니다."}
              </div>
              {preview.preview_images?.length ? (
                preview.preview_images.map((im, i) => (
                  <PreviewImage
                    key={im.id}
                    image={im}
                    index={i}
                    prompt={preview}
                  />
                ))
              ) : (
                <div className="p-5 rounded-2xl bg-white border-2 border-[#cbd5e1] shadow-md">
                  <Empty>
                    등록된 미리보기 이미지가 없습니다. 준비 중입니다.
                  </Empty>
                </div>
              )}
            </div>
            <div className="home-preview-footer flex items-center justify-end gap-2 px-6 py-4 border-t border-[#e6eaee] shrink-0">
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="px-4 py-2.5 rounded-xl border border-[#d1d6db] font-extrabold text-[#475569]"
              >
                닫기
              </button>
              <Link
                to={`/proposals?promptId=${preview.id}`}
                className="ns-hero-cta px-6 py-2.5 rounded-xl text-white font-black flex items-center gap-1.5"
              >
                <Icon name="sparkles" className="w-4 h-4" />이 프롬프트로 보고서
                만들기
              </Link>
            </div>
          </>
        )}
      </Dialog>
    </>
  );
}
